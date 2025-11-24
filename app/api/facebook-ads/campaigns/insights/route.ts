import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const dynamic = "force-dynamic"
export const revalidate = 0

const FB_API = process.env.FACEBOOK_GRAPH_API || "https://graph.facebook.com"
const FB_VER = process.env.FACEBOOK_API_VERSION || "v19.0"

const stripAct = (id: string) => (id || "").replace(/^act_/, "")
const withAct = (id: string) => (id?.startsWith("act_") ? id : `act_${id}`)

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const rawId = url.searchParams.get("ad_account_id")
    const datePreset = url.searchParams.get("date_preset") || "last_7d"
    const uuidParam = url.searchParams.get("uuid") || undefined

    if (!rawId) {
      return NextResponse.json(
        { error: "Parâmetro ad_account_id é obrigatório." },
        { status: 400 },
      )
    }

    // Normaliza SEMPRE: aceita tanto "123" quanto "act_123"
    const actId = withAct(stripAct(rawId))

    // --------- Resolve usuário (uuid > sessão > nenhum) ----------
    let userId: string | null = null
    if (uuidParam) {
      userId = uuidParam
    } else {
      try {
        const supabase = createRouteHandlerClient({ cookies })
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) userId = user.id
      } catch (err) {
        console.warn(
          "[insights] Sem sessão; seguindo com fallback do token meta mais recente.",
        )
      }
    }

    // --------- Busca token em platform_tokens (platform='meta') ----------
    const SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error("Faltam envs SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY")
      return NextResponse.json(
        { error: "Configuração do servidor ausente." },
        { status: 500 },
      )
    }

    const { createClient } = await import("@supabase/supabase-js")
    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    let accessToken: string | null = null

    if (userId) {
      const { data: byUser, error: errUser } = await admin
        .from("platform_tokens")
        .select("access_token")
        .eq("platform", "meta")
        .eq("user_id", userId)
        .maybeSingle()
      if (errUser)
        console.error("[platform_tokens] select by user error:", errUser)
      accessToken = byUser?.access_token ?? null
    }

    if (!accessToken) {
      const { data: lastMeta, error: errAny } = await admin
        .from("platform_tokens")
        .select("access_token")
        .eq("platform", "meta")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (errAny) {
        console.error("[platform_tokens] select last meta error:", errAny)
        return NextResponse.json(
          { error: "Falha ao ler token." },
          { status: 500 },
        )
      }
      if (!lastMeta?.access_token) {
        return NextResponse.json(
          { error: "Token do Facebook não encontrado." },
          { status: 401 },
        )
      }
      accessToken = lastMeta.access_token
    }

    // 🔹 Inclui orçamento e insights
    const fields = [
      "id",
      "name",
      "status",
      "daily_budget",
      "lifetime_budget",
      `insights.date_preset(${datePreset}){spend,actions,action_values,cost_per_action_type,cpm,inline_link_clicks,cpc,ctr}`,
    ].join(",")

    // URL base (1ª página)
    let nextUrl =
      `${FB_API}/${FB_VER}/${actId}/campaigns` +
      `?fields=${encodeURIComponent(fields)}` +
      `&limit=200` +
      `&access_token=${encodeURIComponent(accessToken)}`

    const allData: any[] = []
    let safety = 0

    // 🔁 PAGINAÇÃO: vai seguindo paging.next até acabar
    while (nextUrl && safety < 20) {
      safety += 1

      const fbRes = await fetch(nextUrl, { cache: "no-store" })
      const fbJson: any = await fbRes.json()

      if (!fbRes.ok) {
        console.error("[Facebook error]", fbJson)
        return NextResponse.json(
          { error: "Facebook error", details: fbJson },
          { status: fbRes.status },
        )
      }

      const batch: any[] = Array.isArray(fbJson.data) ? fbJson.data : []
      allData.push(...batch)

      const next = fbJson.paging?.next
      if (!next) break
      nextUrl = next
    }

    return NextResponse.json({ data: allData })
  } catch (e) {
    console.error("[campaigns/insights]", e)
    return NextResponse.json(
      { error: "Erro interno ao buscar insights." },
      { status: 500 },
    )
  }
}
