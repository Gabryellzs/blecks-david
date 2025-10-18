import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const scope = searchParams.get("scope")

  // Verificar se houve erro na autorização do Google
  if (error) {
    console.error("Erro na autorização do Google Analytics:", { error, scope })
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=google_analytics_auth_error&reason=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/ads?error=no_code", request.url))
  }

  // Construir redirectUri como URL absoluta
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const redirectUri = `${siteUrl.replace(/\/$/, '')}/api/auth/google-analytics/callback`
  const clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET

  console.log("🔧 Site URL:", siteUrl)
  console.log("🔧 Redirect URI construída:", redirectUri)

  if (!clientId || !clientSecret) {
    console.error("Variáveis de ambiente do Google Analytics não configuradas.")
    return NextResponse.redirect(new URL("/dashboard/ads?error=env_not_configured", request.url))
  }

  try {
    // Trocar o código por um token de acesso usando Google OAuth 2.0
    const tokenResponse = await fetch(
      `https://oauth2.googleapis.com/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    )
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Erro na resposta do Google:", errorText)
      return NextResponse.redirect(new URL("/dashboard/ads?error=token_exchange_failed", request.url))
    }
    
    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("Erro ao obter token de acesso do Google:", tokenData.error)
      return NextResponse.redirect(new URL(`/dashboard/ads?error=${tokenData.error}`, request.url))
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in || 3600 // 1 hora em segundos
    const tokenType = tokenData.token_type || 'Bearer'

    // Verificar se o token é válido e obter informações do usuário
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
      { method: "GET" }
    )
    
    if (!userResponse.ok) {
      console.error("Erro ao verificar token do Google")
      return NextResponse.redirect(new URL("/dashboard/ads?error=invalid_token", request.url))
    }
    
    const userData = await userResponse.json()

    if (userData.error) {
      console.error("Erro ao obter dados do usuário do Google:", userData.error)
      return NextResponse.redirect(new URL(`/dashboard/ads?error=${userData.error.message}`, request.url))
    }

    const googleUserId = userData.id
    const googleUserEmail = userData.email

    // Obter a sessão do Supabase para identificar o usuário logado
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Erro ao obter usuário Supabase:", authError)
      return NextResponse.redirect(new URL("/login?error=auth_required", request.url))
    }

    // Verificar se o usuário tem acesso ao Google Analytics (opcional)
    // Fazer uma requisição para a API do Google Analytics para verificar permissões
    const analyticsTestResponse = await fetch(
      `https://analytics.googleapis.com/analytics/v3/management/accounts?access_token=${accessToken}`,
      { method: "GET" }
    )

    console.log("🔧 Analytics Test Response Status:", analyticsTestResponse.status)
    console.log("🔧 Analytics Test Response OK:", analyticsTestResponse.ok)

    let hasAnalyticsAccess = analyticsTestResponse.ok
    let analyticsErrorMessage = null

    if (!analyticsTestResponse.ok) {
      const errorText = await analyticsTestResponse.text()
      console.error("Erro ao acessar Google Analytics:", {
        status: analyticsTestResponse.status,
        statusText: analyticsTestResponse.statusText,
        error: errorText
      })
      
      hasAnalyticsAccess = false
      analyticsErrorMessage = `Status: ${analyticsTestResponse.status}, Error: ${errorText}`
    }

    // Salvar configuração do Google Analytics usando o PlatformConfigManager
    const success = await PlatformConfigManager.saveConfig(user.id, 'google_analytics', {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      platform_user_id: googleUserId,
      scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      metadata: {
        name: userData.name,
        email: googleUserEmail,
        picture: userData.picture,
        locale: userData.locale,
        verified_email: userData.verified_email,
        has_analytics_access: hasAnalyticsAccess,
        analytics_error: analyticsErrorMessage
      }
    })

    if (!success) {
      console.error("Erro ao salvar configuração do Google Analytics")
      return NextResponse.redirect(new URL("/dashboard/ads?error=config_save_failed", request.url))
    }

    console.log("Google Analytics conectado com sucesso para usuário:", user.id)
    
    if (hasAnalyticsAccess) {
      return NextResponse.redirect(new URL("/dashboard/ads?google_analytics_connected=true", request.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard/ads?google_analytics_connected=true&warning=no_analytics_access&message=Account connected but no Google Analytics access found", request.url))
    }
  } catch (error: any) {
    console.error("Erro inesperado no callback do Google Analytics:", error)
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=${encodeURIComponent(error.message || "unknown_error")}`, request.url)
    )
  }
} 