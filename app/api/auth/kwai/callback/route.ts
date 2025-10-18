import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    console.error("Erro na autorização do Kwai:", { error })
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=kwai_auth_error&reason=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/ads?error=no_code", request.url))
  }

  const redirectUri = process.env.NEXT_PUBLIC_KWAI_REDIRECT_URI
  const clientId = process.env.KWAI_CLIENT_ID
  const clientSecret = process.env.KWAI_CLIENT_SECRET

  if (!redirectUri || !clientId || !clientSecret) {
    console.error("Variáveis de ambiente do Kwai não configuradas.")
    return NextResponse.redirect(new URL("/dashboard/ads?error=env_not_configured", request.url))
  }

  try {
    // Trocar o código por um token de acesso
    const tokenResponse = await fetch(
      `https://api.kwai.com/oauth2/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      }
    )
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Erro na resposta do Kwai:", errorText)
      return NextResponse.redirect(new URL("/dashboard/ads?error=token_exchange_failed", request.url))
    }
    
    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("Erro ao obter token de acesso do Kwai:", tokenData.error)
      return NextResponse.redirect(new URL(`/dashboard/ads?error=${tokenData.error}`, request.url))
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in || 7200 // 2 horas em segundos

    // Obter informações do usuário
    const userResponse = await fetch(
      `https://api.kwai.com/v1/user/info?access_token=${accessToken}`,
      { method: "GET" }
    )
    
    if (!userResponse.ok) {
      console.error("Erro ao verificar token do Kwai")
      return NextResponse.redirect(new URL("/dashboard/ads?error=invalid_token", request.url))
    }
    
    const userData = await userResponse.json()

    if (userData.error) {
      console.error("Erro ao obter dados do usuário do Kwai:", userData.error)
      return NextResponse.redirect(new URL(`/dashboard/ads?error=${userData.error.message}`, request.url))
    }

    const kwaiUserId = userData.user_id
    const kwaiUserEmail = userData.email

    // Obter a sessão do Supabase
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Erro ao obter usuário Supabase:", authError)
      return NextResponse.redirect(new URL("/login?error=auth_required", request.url))
    }

    // Verificar se o usuário tem acesso ao Kwai Ads
    const adsTestResponse = await fetch(
      `https://api.kwai.com/v1/ads/accounts?access_token=${accessToken}`,
      { method: "GET" }
    )

    if (!adsTestResponse.ok) {
      console.error("Usuário não tem acesso ao Kwai Ads ou token inválido")
      return NextResponse.redirect(new URL("/dashboard/ads?error=kwai_access_denied", request.url))
    }

    // Salvar configuração do Kwai
    const success = await PlatformConfigManager.saveConfig(user.id, 'kwai', {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      platform_user_id: kwaiUserId,
      scopes: [
        'ads_read',
        'ads_management',
        'user_info'
      ],
      metadata: {
        name: userData.display_name,
        email: kwaiUserEmail,
        avatar_url: userData.avatar_url,
        region: userData.region
      }
    })

    if (!success) {
      console.error("Erro ao salvar configuração do Kwai")
      return NextResponse.redirect(new URL("/dashboard/ads?error=config_save_failed", request.url))
    }

    console.log("Kwai conectado com sucesso para usuário:", user.id)
    return NextResponse.redirect(new URL("/dashboard/ads?kwai_connected=true", request.url))
  } catch (error: any) {
    console.error("Erro inesperado no callback do Kwai:", error)
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=${encodeURIComponent(error.message || "unknown_error")}`, request.url)
    )
  }
} 