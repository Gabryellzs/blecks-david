// app/api/facebook-ads/ads/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export const revalidate = 0
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v20.0"
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

function getSSRClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const store = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get: (n: string) => store.get(n)?.value,
      set: (n: string, v: string, o?: Parameters<typeof store.set>[1]) => store.set(n, v, o),
      remove: (n: string, o?: Parameters<typeof store.set>[1]) => store.set(n, "", { ...o, maxAge: 0 }),
    },
  })
}

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

async function getUserIdFromCookies(): Promise<string | null> {
  const ssr = getSSRClient()
  if (!ssr) return null
  const { data } = await ssr.auth.getUser()
  return data?.user?.id ?? null
}

async function findMetaAccessToken(userId?: string | null): Promise<string | null> {
  const admin = getAdminClient()
  if (!admin) return null

  // 1) token do usuário logado
  if (userId) {
    const { data } = await admin
      .from("platform_tokens")
      .select("access_token")
      .eq("platform", "meta")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data?.access_token) return data.access_token as string
  }

  // 2) fallback: último token meta (útil em dev)
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
    const uuidFromQuery = searchParams.get("uuid")
    const debug = searchParams.get("debug") === "1"

    if (!rawAccount) {
      return NextResponse.json(
        { error: "Parâmetro obrigatório ausente: use 'accountId' ou 'ad_account_id'." },
        { status: 400 }
      )
    }

    // user_id via cookies; se não tiver (auth só no client), aceita ?uuid=
    let userId = await getUserIdFromCookies()
    if (!userId && uuidFromQuery) userId = uuidFromQuery

    const ACCESS_TOKEN = await findMetaAccessToken(userId)
    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Nenhum access_token 'meta' encontrado em platform_tokens." },
        { status: 404 }
      )
    }

    const accountNumericId = rawAccount.replace(/^act_/, "")
    const baseUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountNumericId}/ads`

    const fullFields = [
      "id",
      "name",
      "status",
      "effective_status",
      "adset_id",
      "campaign_id",
      "created_time",
      "updated_time",
      "creative{id,name}",
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

    // tenta com campos completos e cai para minimal em caso de erro
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
        error: r1.json?.error?.message || r2.json?.error?.message || "Erro ao buscar anúncios",
        details_primary: r1.json,
        details_fallback: r2.json,
        graph_status_primary: r1.status,
        graph_status_fallback: r2.status,
        graph_url_primary: r1.url,
        graph_url_fallback: r2.url,
      },
      { status: r2.status || r1.status || 502 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro interno no servidor" }, { status: 500 })
  }
}
