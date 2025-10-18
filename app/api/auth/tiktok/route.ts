import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Configurações do TikTok OAuth
  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  console.log("🔧 NEXT_PUBLIC_SITE_URL:", siteUrl)

  // Garantir que a URL seja uma URI absoluta válida
  let redirectUri: string
  if (siteUrl && siteUrl.trim() !== '') {
    // Remover barras finais se existirem e espaços
    const cleanSiteUrl = siteUrl.trim().replace(/\/$/, '')
    redirectUri = `${cleanSiteUrl}/api/auth/tiktok/callback`
    console.log("🔧 Site URL limpa:", cleanSiteUrl)
  } else {
    // Fallback para localhost se NEXT_PUBLIC_SITE_URL não estiver configurado
    redirectUri = "http://localhost:3000/api/auth/tiktok/callback"
    console.log("🔧 Usando fallback localhost")
  }

  console.log("🔧 Redirect URI construída:", redirectUri)

  const state = Math.random().toString(36).substring(7) // CSRF protection

  if (!clientKey) {
    console.error("NEXT_PUBLIC_TIKTOK_CLIENT_KEY não configurado")
    return NextResponse.redirect(new URL("/dashboard/ads?error=tiktok_config_missing", request.url))
  }

  // Escopos necessários para TikTok Ads
  const scopes = [
    'user.info.basic',
    'user.info.stats', 
    'user.info.email',
    'ad.read',
    'ad.write'
  ].join(',')

  // Construir URL de autorização do TikTok
  const authUrl = new URL('https://ads.tiktok.com/marketing_api/auth')
  authUrl.searchParams.set('app_id', clientKey)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)

  console.log("🔧 URL de autorização construída:", authUrl.toString())

  // Redirecionar para o TikTok
  return NextResponse.redirect(authUrl.toString())
} 