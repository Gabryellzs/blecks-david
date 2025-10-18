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
    console.error("Erro na autorização do Google AdSense:", { error, scope })
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=google_adsense_auth_error&reason=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/ads?error=no_code", request.url))
  }

  // Construir redirectUri como URL absoluta
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const redirectUri = `${siteUrl.replace(/\/$/, '')}/api/auth/google-adsense/callback`
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET

  console.log("🔧 Site URL:", siteUrl)
  console.log("🔧 Redirect URI construída:", redirectUri)

  if (!clientId || !clientSecret) {
    console.error("Variáveis de ambiente do Google AdSense não configuradas.")
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

    console.log("🔧 Tokens obtidos:", { 
      accessToken: accessToken ? "present" : "missing",
      refreshToken: refreshToken ? "present" : "missing",
      expiresIn,
      tokenType 
    })

    // Verificar se o token é válido e obter informações do usuário
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
      { method: "GET" }
    )

    // Debug: verificar se a resposta está ok
    console.log("🔧 UserResponse status:", userResponse.status)
    console.log("🔧 UserResponse ok:", userResponse.ok)
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("🔧 Erro na resposta do userinfo:", errorText)
      return NextResponse.json({ 
        error: "userinfo_failed", 
        status: userResponse.status, 
        errorText,
        accessToken: accessToken ? "present" : "missing",
        refreshToken: refreshToken ? "present" : "missing"
      })
    }
    
    const userData = await userResponse.json()
    console.log("🔧 UserData recebido:", userData)

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

    // Verificar se o usuário tem acesso ao Google AdSense
    // Fazer uma requisição para a API do Google AdSense para verificar permissões
    // Usando a API v2 que é a versão atual
    const adsenseUserResponse = await fetch(
      `https://adsense.googleapis.com/v2/accounts?access_token=${accessToken}`,
      { method: "GET" }
    )
    
    console.log("🔧 AdSense Response status:", adsenseUserResponse.status)
    console.log("🔧 AdSense Response ok:", adsenseUserResponse.ok)
    
    if (!adsenseUserResponse.ok) {
      const errorText = await adsenseUserResponse.text()
      console.error("🔧 Erro na resposta do AdSense:", errorText)
      return NextResponse.json({ 
        error: "adsense_access_denied", 
        status: adsenseUserResponse.status, 
        errorText,
        accessToken: accessToken ? "present" : "missing"
      })
    }
    
    const adsenseData = await adsenseUserResponse.json()
    console.log("🔧 AdSense Data recebido:", adsenseData)


    // Salvar configuração do Google AdSense usando o PlatformConfigManager
    const success = await PlatformConfigManager.saveConfig(user.id, 'google_adsense', {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      platform_user_id: googleUserId,
      scopes: [
        'https://www.googleapis.com/auth/adsense.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      metadata: {
        name: userData.name,
        email: googleUserEmail,
        picture: userData.picture,
        locale: userData.locale,
        verified_email: userData.verified_email
      }
    })

    if (!success) {
      console.error("Erro ao salvar configuração do Google AdSense")
      return NextResponse.redirect(new URL("/dashboard/ads?error=config_save_failed", request.url))
    }

    console.log("Google AdSense conectado com sucesso para usuário:", user.id)
    return NextResponse.redirect(new URL("/dashboard/ads?google_adsense_connected=true", request.url))
  } catch (error: any) {
    console.error("Erro inesperado no callback do Google AdSense:", error)
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=${encodeURIComponent(error.message || "unknown_error")}`, request.url)
    )
  }
} 