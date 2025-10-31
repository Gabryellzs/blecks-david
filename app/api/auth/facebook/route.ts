// app/api/auth/facebook/route.ts
import { NextResponse, NextRequest } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

const FB_OAUTH_VERSION = "v23.0"

// URL fixa registrada no painel do Facebook
const REDIRECT_URI =
  "https://www.blacksproductivity.site/api/auth/facebook/callback"

// usar variável server-side segura
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID

// permissões necessárias pra puxar contas de anúncio e campanhas
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
    // se não está autenticado na sua plataforma -> manda logar
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 2. conferir envs
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

  // 3. gerar state (ideal: salvar em sessão, mas por enquanto ok)
  const state = Math.random().toString(36).slice(2)

  // 4. montar URL oficial de autorização
  const authUrl =
    `https://www.facebook.com/${FB_OAUTH_VERSION}/dialog/oauth` +
    `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&state=${encodeURIComponent(state)}`

  // 5. redirecionar pro Facebook
  return NextResponse.redirect(authUrl, { status: 307 })
}
