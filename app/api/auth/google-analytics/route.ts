import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Configurações do Google Analytics OAuth
  const clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  console.log("🔧 NEXT_PUBLIC_SITE_URL:", siteUrl)

  // Garantir que a URL seja uma URI absoluta válida
  let redirectUri: string
  if (siteUrl && siteUrl.trim() !== '') {
    // Remover barras finais se existirem e espaços
    const cleanSiteUrl = siteUrl.trim().replace(/\/$/, '')
    redirectUri = `${cleanSiteUrl}/api/auth/google-analytics/callback`
    console.log("🔧 Site URL limpa:", cleanSiteUrl)
  } else {
    // Fallback para localhost se NEXT_PUBLIC_SITE_URL não estiver configurado
    redirectUri = "http://localhost:3000/api/auth/google-analytics/callback"
    console.log("🔧 Usando fallback localhost")
  }

  console.log("🔧 Redirect URI construída:", redirectUri)

  const state = Math.random().toString(36).substring(7) // CSRF protection

  if (!clientId) {
    console.error("GOOGLE_ANALYTICS_CLIENT_ID não configurado")
    return NextResponse.redirect(new URL("/dashboard/ads?error=google_analytics_config_missing", request.url))
  }

  // Escopos necessários para Google Analytics
  const scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' ')

  // Construir URL de autorização do Google
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', state)

  console.log("🔧 URL de autorização construída:", authUrl.toString())

  // Redirecionar para o Google
  return NextResponse.redirect(authUrl.toString())
} 