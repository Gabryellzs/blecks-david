import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    console.error("Erro na autorização do TikTok:", { error })
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=tiktok_auth_error&reason=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/ads?error=no_code", request.url))
  }

  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET

  if (!redirectUri || !clientKey || !clientSecret) {
    console.error("Variáveis de ambiente do TikTok não configuradas.")
    return NextResponse.redirect(new URL("/dashboard/ads?error=env_not_configured", request.url))
  }

  try {
    // Trocar o código por um token de acesso
    const tokenResponse = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: clientKey,
          secret: clientSecret,
          auth_code: code,
          grant_type: "auth_code",
        }),
      }
    )
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Erro na resposta do TikTok:", errorText)
      return NextResponse.redirect(new URL("/dashboard/ads?error=token_exchange_failed", request.url))
    }
    
    const tokenData = await tokenResponse.json()

    if (tokenData.code !== 0) {
      console.error("Erro ao obter token de acesso do TikTok:", tokenData)
      return NextResponse.redirect(new URL(`/dashboard/ads?error=${tokenData.message}`, request.url))
    }

    const accessToken = tokenData.data.access_token
    const refreshToken = tokenData.data.refresh_token
    const expiresIn = tokenData.data.expires_in || 7200 // 2 horas em segundos

    // Obter informações do usuário
    const userResponse = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/user/info/?access_token=${accessToken}`,
      { method: "GET" }
    )
    
    if (!userResponse.ok) {
      console.error("Erro ao verificar token do TikTok")
      return NextResponse.redirect(new URL("/dashboard/ads?error=invalid_token", request.url))
    }
    
    const userData = await userResponse.json()

    if (userData.code !== 0) {
      console.error("Erro ao obter dados do usuário do TikTok:", userData)
      return NextResponse.redirect(new URL(`/dashboard/ads?error=${userData.message}`, request.url))
    }

    const tiktokUserId = userData.data.user_id
    const tiktokUserEmail = userData.data.email

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

    // Salvar configuração do TikTok
    const success = await PlatformConfigManager.saveConfig(user.id, 'tiktok', {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      platform_user_id: tiktokUserId,
      scopes: [
        'user.info.basic',
        'user.info.stats',
        'user.info.email',
        'ad.read',
        'ad.write'
      ],
      metadata: {
        name: userData.data.display_name,
        email: tiktokUserEmail,
        avatar_url: userData.data.avatar_url,
        region: userData.data.region
      }
    })

    if (!success) {
      console.error("Erro ao salvar configuração do TikTok")
      return NextResponse.redirect(new URL("/dashboard/ads?error=config_save_failed", request.url))
    }

    console.log("TikTok conectado com sucesso para usuário:", user.id)
    return NextResponse.redirect(new URL("/dashboard/ads?tiktok_connected=true", request.url))
  } catch (error: any) {
    console.error("Erro inesperado no callback do TikTok:", error)
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=${encodeURIComponent(error.message || "unknown_error")}`, request.url)
    )
  }
} 