// app/api/auth/facebook/route.ts
import { NextResponse, NextRequest } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

const FB_OAUTH_VERSION = "v23.0"

// MESMA URL que você colocou no painel do Facebook
// e que o callback usa pra trocar o code pelo token
const REDIRECT_URI =
  "https://www.blacksproductivity.site/api/auth/facebook/callback"

// IMPORTANTE: usar variáveis server-side seguras
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID

// escopos que permitem puxar contas de anúncio e campanhas
const SCOPES = [
  "ads_read",
  "ads_management",
  "business_management",
].join(",")

export async function GET(req: NextRequest) {
  // 1. garantir que o usuário está logado na sua plataforma
  const supabase = createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    // se o cara não está logado na sua app, manda pro login
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 2. validar envs mínimas
  if (!FACEBOOK_APP_ID) {
    console.error("❌ FACEBOOK_APP_ID ausente nas env vars")
    return NextResponse.json(
      {
        error: "ENV_MISSING",
        message: "FACEBOOK_APP_ID ausente nas variáveis de ambiente",
      },
      { status: 500 }
    )
  }

  // 3. gerar state (anti-CSRF / identificação de quem pediu)
  // pra produção idealmente salva isso em algum lugar (session/server)
  const state = Math.random().toString(36).slice(2)

  // 4. montar URL oficial do OAuth no Facebook
  // IMPORTANTE: redirect_uri TEM QUE bater 1:1 com o cadastrado no painel
  const authUrl =
    `https://www.facebook.com/${FB_OAUTH_VERSION}/dialog/oauth` +
    `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&state=${encodeURIComponent(state)}`

  // 5. redirecionar o usuário pro Facebook pra autorizar
  return NextResponse.redirect(authUrl, { status: 307 })
}
