// /app/api/auth/facebook/callback/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

function resolveRedirectUri(): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
  const envRedirect = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || "/api/auth/facebook/callback"

  // se já vier absoluta, usa; se vier caminho relativo, prefixa com SITE_URL
  if (/^https?:\/\//i.test(envRedirect)) return envRedirect
  return `${siteUrl}${envRedirect.startsWith("/") ? "" : "/"}${envRedirect}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const fbError = searchParams.get("error") // ex: access_denied
  const error_reason = searchParams.get("error_reason")
  const error_description = searchParams.get("error_description")

  // 1) Erro direto do OAuth
  if (fbError) {
    console.error("⚠️ Facebook OAuth error:", { fbError, error_reason, error_description })
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=facebook_auth_error&reason=${encodeURIComponent(error_reason || fbError)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/ads?error=no_code", request.url))
  }

  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const redirectUri = resolveRedirectUri()

  if (!appId || !appSecret) {
    console.error("❌ FACEBOOK_APP_ID/SECRET ausentes nas envs")
    return NextResponse.redirect(new URL("/dashboard/ads?error=env_not_configured", request.url))
  }

  try {
    // 2) Trocar code por access_token
    const tokenUrl =
      `https://graph.facebook.com/v23.0/oauth/access_token` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&code=${encodeURIComponent(code)}`

    const tokenRes = await fetch(tokenUrl, { method: "GET", cache: "no-store" })
    const tokenJson = await tokenRes.json().catch(() => ({}))

    if (!tokenRes.ok || !tokenJson?.access_token) {
      console.error("❌ Erro ao trocar code por token:", { status: tokenRes.status, body: tokenJson })
      return NextResponse.redirect(new URL("/dashboard/ads?error=token_exchange_failed", request.url))
    }

    const accessToken: string = tokenJson.access_token
    const refreshToken: string | null = tokenJson.refresh_token ?? null // FB normalmente não retorna
    const expiresIn: number = tokenJson.expires_in ?? 60 * 24 * 60 * 60 // fallback ~60 dias

    // 3) Validar token (opcional) e pegar id do usuário do FB
    const meRes = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
      { method: "GET", cache: "no-store" }
    )
    const meJson = await meRes.json().catch(() => ({}))

    if (!meRes.ok || meJson?.error || !meJson?.id) {
      console.error("❌ Erro ao validar token / obter /me:", { status: meRes.status, body: meJson })
      return NextResponse.redirect(new URL("/dashboard/ads?error=invalid_token", request.url))
    }

    const facebookUserId: string = meJson.id

    // 4) Pegar usuário logado (Supabase)
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Usuário não autenticado:", authError)
      return NextResponse.redirect(new URL("/login?error=authentication_required", request.url))
    }

    // 5) Persistir token/config no Supabase
    try {
      // Se sua lib tiver este método, use-o como "caminho feliz"
      // (salva em platform_tokens e/ou configurações internas)
      // @ts-ignore - permita cair no catch se não existir
      await PlatformConfigManager.saveOrUpdateToken?.(user.id, "facebook", accessToken, {
        refresh_token: refreshToken,
        expires_in: expiresIn,
        platform_user_id: facebookUserId,
      })
    } catch {
      // fallback para quem tem apenas saveConfig
      await PlatformConfigManager.saveConfig(user.id, "facebook", {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        platform_user_id: facebookUserId,
      })
    }

    console.log("✅ Facebook conectado p/ user:", user.id, "FB user:", facebookUserId)
    // o front já trata ?fb=ok para fechar a view e recarregar contas
    return NextResponse.redirect(new URL("/dashboard/ads?fb=ok", request.url))
  } catch (err: any) {
    console.error("❌ Erro inesperado no callback do Facebook:", err)
    return NextResponse.redirect(
      new URL(`/dashboard/ads?error=${encodeURIComponent(err?.message || "unknown_error")}`, request.url)
    )
  }
}
