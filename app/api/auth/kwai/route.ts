import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Configurações do Kwai OAuth
  const clientId = process.env.NEXT_PUBLIC_KWAI_CLIENT_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  console.log("🔧 NEXT_PUBLIC_SITE_URL:", siteUrl)

  // Garantir que a URL seja uma URI absoluta válida
  let redirectUri: string
  if (siteUrl && siteUrl.trim() !== '') {
    // Remover barras finais se existirem e espaços
    const cleanSiteUrl = siteUrl.trim().replace(/\/$/, '')
    redirectUri = `${cleanSiteUrl}/api/auth/kwai/callback`
    console.log("🔧 Site URL limpa:", cleanSiteUrl)
  } else {
    // Fallback para localhost se NEXT_PUBLIC_SITE_URL não estiver configurado
    redirectUri = "http://localhost:3000/api/auth/kwai/callback"
    console.log("🔧 Usando fallback localhost")
  }

  console.log("🔧 Redirect URI construída:", redirectUri)

  const state = Math.random().toString(36).substring(7) // CSRF protection

  if (!clientId) {
    console.error("NEXT_PUBLIC_KWAI_CLIENT_ID não configurado")
    return NextResponse.redirect(new URL("/dashboard/ads?error=kwai_config_missing", request.url))
  }

  // Escopos necessários para Kwai Ads
  const scopes = [
    'ads_read',
    'ads_management',
    'user_info'
  ].join(',')

  // Construir URL de autorização do Kwai
  const authUrl = new URL('https://api.kwai.com/oauth2/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', state)

  console.log("🔧 URL de autorização construída:", authUrl.toString())

  // Redirecionar para o Kwai
  return NextResponse.redirect(authUrl.toString())
} 