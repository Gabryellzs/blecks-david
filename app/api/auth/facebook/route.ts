import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🚨 === ROTA /api/auth/facebook CHAMADA ===")

    // Verificar autenticação via cookies
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error("❌ Usuário não autenticado:", error)
      return NextResponse.redirect(new URL("/api/auth/force-resync", request.url))
    }

    console.log("✅ Usuário autenticado:", user.id)

    // Configurações do Facebook OAuth
    const facebookAppId = process.env.FACEBOOK_APP_ID
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    console.log("🔧 NEXT_PUBLIC_SITE_URL:", siteUrl)
    console.log("🔧 Tipo do siteUrl:", typeof siteUrl)

    // Garantir que a URL seja uma URI absoluta válida
    let redirectUri: string
    if (siteUrl && siteUrl.trim() !== '') {
      // Remover barras finais se existirem e espaços
      const cleanSiteUrl = siteUrl.trim().replace(/\/$/, '')
      redirectUri = `${cleanSiteUrl}/api/auth/facebook/callback`
      console.log("🔧 Site URL limpa:", cleanSiteUrl)
    } else {
      // Fallback para localhost se NEXT_PUBLIC_SITE_URL não estiver configurado
      redirectUri = "http://localhost:3000/api/auth/facebook/callback"
      console.log("🔧 Usando fallback localhost")
    }

    console.log("🔧 Redirect URI construída:", redirectUri)
    console.log("🔧 Comprimento da redirectUri:", redirectUri.length)

    const state = Math.random().toString(36).substring(7) // CSRF protection

    if (!facebookAppId) {
      console.error("FACEBOOK_APP_ID não configurado")
      return NextResponse.redirect(new URL("/dashboard/ads?error=facebook_config_missing", request.url))
    }

    // Validar se a redirectUri é uma URI absoluta válida
    try {
      const testUrl = new URL(redirectUri)
      console.log("✅ URL válida - Protocolo:", testUrl.protocol)
      console.log("✅ URL válida - Host:", testUrl.host)
      console.log("✅ URL válida - Pathname:", testUrl.pathname)
    } catch (error) {
      console.error("❌ Redirect URI inválida:", redirectUri)
      console.error("❌ Erro de validação:", error)
      return NextResponse.redirect(new URL("/dashboard/ads?error=invalid_redirect_uri", request.url))
    }

    // Construir URL de autorização do Facebook
    const authUrl = new URL("https://www.facebook.com/v23.0/dialog/oauth")
    authUrl.searchParams.set("client_id", facebookAppId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("scope", "ads_read,ads_management,business_management")
    authUrl.searchParams.set("response_type", "code")

    console.log("🔧 URL de autorização completa:", authUrl.toString())
    console.log("🔧 Parâmetros da URL:")
    console.log("  - client_id:", facebookAppId)
    console.log("  - redirect_uri:", redirectUri)
    console.log("  - state:", state)
    console.log("  - scope: ads_read,ads_management,business_management")
    console.log("  - response_type: code")
    
    // Verificar se a URL está sendo codificada corretamente
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    console.log("🔧 Redirect URI codificada:", encodedRedirectUri)
    console.log("🔧 URL decodificada de volta:", decodeURIComponent(encodedRedirectUri))
    
    return NextResponse.redirect(authUrl.toString())

  } catch (error: any) {
    console.error("Erro inesperado na rota /api/auth/facebook:", error)
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=${encodeURIComponent(error.message || "unknown_error")}`, request.url)
    )
  }
} 