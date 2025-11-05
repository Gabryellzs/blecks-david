import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export const revalidate = 0
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v20.0"

// ENVs
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

// SSR client (pega usuário logado pelos cookies; se não houver, podemos usar ?uuid=)
function getSSRClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options?: Parameters<typeof cookieStore.set>[1]) =>
        cookieStore.set(name, value, options),
      remove: (name: string, options?: Parameters<typeof cookieStore.set>[1]) =>
        cookieStore.set(name, "", { ...options, maxAge: 0 }),
    },
  })
}

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

async function getLoggedUserIdFromCookies(): Promise<string | null> {
  const ssr = getSSRClient()
  if (!ssr) return null
  const { data } = await ssr.auth.getUser()
  return data?.user?.id ?? null
}

// Busca token em platform_tokens usando as colunas reais:
// user_id + platform='meta' -> access_token
async function findMetaAccessToken({
  userId,
}: {
  userId?: string | null
}): Promise<string | null> {
  const admin = getAdminClient()
  if (!admin) return null

  // 1) tentar por user_id (usuário logado)
  if (userId) {
    const { data } = await admin
      .from("platform_tokens")
      .select("access_token")
      .eq("platform", "meta")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }) // se não existir created_at, o Supabase ignora
      .limit(1)
      .maybeSingle()

    if (data?.access_token) return data.access_token as string
  }

  // 2) fallback: último token meta (qualquer usuário) — opcional, mas útil em dev
  const { data: latest } = await admin
    .from("platform_tokens")
    .select("access_token")
    .eq("platform", "meta")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest?.access_token) return latest.access_token as string

  return null
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawAccount = searchParams.get("accountId") ?? searchParams.get("ad_account_id")
    const debug = searchParams.get("debug") === "1"
    // fallback manual do uuid via query (caso a sessão esteja só no client)
    const uuidFromQuery = searchParams.get("uuid")

    if (!rawAccount) {
      return NextResponse.json(
        { error: "Parâmetro obrigatório ausente: use 'accountId' ou 'ad_account_id'." },
        { status: 400 }
      )
    }

    // pega user_id pelos cookies; se não tiver, usa ?uuid=
    let userId = await getLoggedUserIdFromCookies()
    if (!userId && uuidFromQuery) userId = uuidFromQuery

    const accountNumericId = rawAccount.replace(/^act_/, "")

    // token do Supabase (platform_tokens.user_id + platform='meta')
    const ACCESS_TOKEN = await findMetaAccessToken({ userId })
    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Nenhum access_token 'meta' encontrado em platform_tokens para os filtros informados." },
        { status: 404 }
      )
    }

    // chamada ao Graph com fallback de campos
    const baseUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountNumericId}/adsets`
    const fullFields = [
      "id",
      "name",
      "status",
      "effective_status",
      "campaign_id",
      "daily_budget",
      "optimization_goal",
      "billing_event",
      "start_time",
      "end_time",
    ].join(",")
    const minimalFields = ["id", "name", "status"].join(",")

    async function callGraph(fields: string) {
      const url = new URL(baseUrl)
      url.searchParams.set("fields", fields)
      url.searchParams.set("limit", "100")
      url.searchParams.set("access_token", ACCESS_TOKEN)
      const response = await fetch(url.toString(), { method: "GET", cache: "no-store" })
      let json: any = {}
      try { json = await response.json() } catch {}
      return { ok: response.ok, status: response.status, url: url.toString(), json }
    }

    const r1 = await callGraph(fullFields)
    if (r1.ok) return NextResponse.json(r1.json)

    const r2 = await callGraph(minimalFields)
    if (r2.ok) {
      return NextResponse.json({
        ...r2.json,
        _meta: {
          fallback: true,
          reason: r1.json?.error?.message || "Campos completos rejeitados pelo Graph",
          graph_status_full: r1.status,
          graph_url_full: r1.url,
          debug_info: debug ? r1.json : undefined,
        },
      })
    }

    return NextResponse.json(
      {
        error: r1.json?.error?.message || r2.json?.error?.message || "Erro ao buscar ad sets",
        details_primary: r1.json,
        details_fallback: r2.json,
        graph_status_primary: r1.status,
        graph_status_fallback: r2.status,
        graph_url_primary: r1.url,
        graph_url_fallback: r2.url,
        used_user_id: userId ?? null,
      },
      { status: r2.status || r1.status || 502 }
    )
  } catch (error: any) {
    console.error("[/api/facebook-ads/adsets] erro:", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno no servidor" },
      { status: 500 }
    )
  }
}
