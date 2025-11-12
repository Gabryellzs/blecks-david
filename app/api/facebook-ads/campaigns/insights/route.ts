import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const dynamic = "force-dynamic"
export const revalidate = 0

const FB_API = process.env.FACEBOOK_GRAPH_API || "https://graph.facebook.com"
const FB_VER = process.env.FACEBOOK_API_VERSION || "v19.0"

const withAct = (id: string) => (id?.startsWith("act_") ? id : `act_${id}`)

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const adAccountId = url.searchParams.get("ad_account_id")
    const datePreset  = url.searchParams.get("date_preset") || "last_7d"
    const uuidParam   = url.searchParams.get("uuid") || undefined

    if (!adAccountId) {
      return NextResponse.json(
        { error: "Parâmetro ad_account_id é obrigatório." },
        { status: 400 }
      )
    }

    // ====== Resolve usuário (uuid > sessão) ======
    let userId: string | null = null

    if (uuidParam) {
      userId = uuidParam
    } else {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { user }, error: sessErr } = await supabase.auth.getUser()
      if (sessErr) console.error("[insights] getUser error:", sessErr)
      if (!user) {
        return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 })
      }
      userId = user.id
    }

    // ====== Buscar token em platform_tokens (platform='meta') com client admin ======
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error("Faltam envs SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY")
      return NextResponse.json({ error: "Configuração do servidor ausente." }, { status: 500 })
    }

    const { createClient } = await import("@supabase/supabase-js")
    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: tokenRow, error: tokenErr } = await admin
      .from("platform_tokens")
      .select("access_token, expires_at")
      .eq("platform", "meta")     // <- sua coluna
      .eq("user_id", userId!)     // <- sua coluna
      .maybeSingle()

    if (tokenErr) {
      console.error("[platform_tokens] select error:", tokenErr)
      return NextResponse.json({ error: "Falha ao ler token." }, { status: 500 })
    }
    if (!tokenRow?.access_token) {
      return NextResponse.json({ error: "Token do Facebook não encontrado para o usuário." }, { status: 401 })
    }

    const accessToken: string = tokenRow.access_token

    // ====== Chamada à Graph API ======
    const fields = [
      "id",
      "name",
      "status",
      `insights.date_preset(${datePreset}){spend,actions,action_values,cost_per_action_type,cpm,inline_link_clicks,cpc,ctr}`
    ].join(",")

    const graphUrl =
      `${FB_API}/${FB_VER}/${withAct(adAccountId)}/campaigns`
      + `?fields=${encodeURIComponent(fields)}`
      + `&limit=200`
      + `&access_token=${encodeURIComponent(accessToken)}`

    const fbRes  = await fetch(graphUrl, { cache: "no-store" })
    const fbJson = await fbRes.json()

    if (!fbRes.ok) {
      console.error("[Facebook error]", fbJson)
      return NextResponse.json({ error: "Facebook error", details: fbJson }, { status: fbRes.status })
    }

    return NextResponse.json({ data: fbJson.data ?? [] })
  } catch (e) {
    console.error("[campaigns/insights]", e)
    return NextResponse.json({ error: "Erro interno ao buscar insights." }, { status: 500 })
  }
}
