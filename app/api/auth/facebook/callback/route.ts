import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const error_reason = searchParams.get("error_reason")
  const error_description = searchParams.get("error_description")

  // Verificar se houve erro na autorização do Facebook
  if (error) {
    console.error("Erro na autorização do Facebook:", { error, error_reason, error_description })
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=facebook_auth_error&reason=${error_reason || error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/ads?error=no_code", request.url))
  }

  // Construir redirectUri como URL absoluta
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const redirectUri = `${siteUrl.replace(/\/$/, '')}/api/auth/facebook/callback`
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET

  console.log("🔧 Site URL:", siteUrl)
  console.log("🔧 Redirect URI construída:", redirectUri)

  if (!appId || !appSecret) {
    console.error("Variáveis de ambiente do Facebook não configuradas.")
    return NextResponse.redirect(new URL("/dashboard/ads?error=env_not_configured", request.url))
  }

  try {
    // Trocar o código por um token de acesso
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`,
      { method: "GET" },
    )
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Erro na resposta do Facebook:", errorText)
      return NextResponse.json({ error: errorText }, { status: 500 })
      //return NextResponse.redirect(new URL("/dashboard/ads?error=token_exchange_failed", request.url))
    }
    
    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("Erro ao obter token de acesso do Facebook:", tokenData.error)
      return NextResponse.redirect(new URL(`/dashboard/ads?error=${tokenData.error.message}`, request.url))
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token // Facebook pode retornar refresh token
    const expiresIn = tokenData.expires_in || 5184000 // 60 dias em segundos (padrão do Facebook)

    // Verificar se o token é válido e obter informações do usuário
    const userResponse = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${accessToken}`,
      { method: "GET" }
    )
    
    if (!userResponse.ok) {
      console.error("Erro ao verificar token do Facebook")
      return NextResponse.redirect(new URL("/dashboard/ads?error=invalid_token", request.url))
    }

    
    const userData = await userResponse.json()

    if (userData.error) {
      console.error("Erro ao obter dados do usuário do Facebook:", userData.error)
      return NextResponse.redirect(new URL(`/dashboard/ads?error=${userData.error.message}`, request.url))
    }

    const facebookUserId = userData.id

    // Obter usuário autenticado via cookies
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Usuário não autenticado:", authError)
      return NextResponse.redirect(new URL("/login?error=authentication_required", request.url))
    }

    console.log("✅ Usuário autenticado:", user.id)

    // Salvar configuração do Facebook usando o PlatformConfigManager
    const success = await PlatformConfigManager.saveConfig(user.id, 'facebook', {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      platform_user_id: facebookUserId,
      // scopes: ['ads_read', 'ads_management', 'business_management'],
      // metadata: {
      //   name: userData.name,
      //   email: userData.email
      // }
    })

    if (!success) {
      console.error("Erro ao salvar configuração do Facebook")
      return NextResponse.redirect(new URL("/dashboard/ads?error=config_save_failed", request.url))
    }

    console.log("Facebook conectado com sucesso para usuário:", user.id)
    return NextResponse.redirect(new URL("/dashboard/ads?facebook_connected=true", request.url))
  } catch (error: any) {
    console.error("Erro inesperado no callback do Facebook:", error)
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=${encodeURIComponent(error.message || "unknown_error")}`, request.url)
    )
  }
}
