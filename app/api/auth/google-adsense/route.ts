import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🚨 === ROTA /api/auth/google-adsense CHAMADA ===")

    // Verificar autenticação via cookies
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error("❌ Usuário não autenticado:", error)
      return NextResponse.redirect(new URL("/api/auth/force-resync", request.url))
    }

    console.log("✅ Usuário autenticado:", user.id)

    // Configurações do Google AdSense OAuth
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    console.log("🔧 NEXT_PUBLIC_SITE_URL:", siteUrl)

    // Garantir que a URL seja uma URI absoluta válida
    let redirectUri: string
    if (siteUrl && siteUrl.trim() !== '') {
      // Remover barras finais se existirem e espaços
      const cleanSiteUrl = siteUrl.trim().replace(/\/$/, '')
      redirectUri = `${cleanSiteUrl}/api/auth/google-adsense/callback`
      console.log("🔧 Site URL limpa:", cleanSiteUrl)
    } else {
      // Fallback para localhost se NEXT_PUBLIC_SITE_URL não estiver configurado
      redirectUri = "http://localhost:3000/api/auth/google-adsense/callback"
      console.log("🔧 Usando fallback localhost")
    }

    console.log("🔧 Redirect URI construída:", redirectUri)

    const state = Math.random().toString(36).substring(7) // CSRF protection

    if (!clientId) {
      console.error("GOOGLE_ADS_CLIENT_ID não configurado")
      return NextResponse.redirect(new URL("/dashboard/ads?error=google_adsense_config_missing", request.url))
    }

    // Escopos necessários para Google AdSense
    const scopes = [
      'https://www.googleapis.com/auth/adsense.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ')

    // Construir URL de autorização do Google
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("scope", scopes)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("access_type", "offline")
    authUrl.searchParams.set("prompt", "consent")
    authUrl.searchParams.set("state", state)

    console.log("🔧 URL de autorização completa:", authUrl.toString())
    return NextResponse.redirect(authUrl.toString())

  } catch (error: any) {
    console.error("Erro inesperado na rota /api/auth/google-adsense:", error)
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=${encodeURIComponent(error.message || "unknown_error")}`, request.url)
    )
  }
} 