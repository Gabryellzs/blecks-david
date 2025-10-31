// app/api/auth/facebook/callback/route.ts
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

// ====== CONFIG FIXA ======
const REDIRECT_URI =
  "https://www.blacksproductivity.site/api/auth/facebook/callback"

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service Role — apenas no backend!
const admin = createSupabaseAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const fbError = searchParams.get("error")
  const error_reason = searchParams.get("error_reason")
  const error_description = searchParams.get("error_description")

  // === 1. Cancelado pelo usuário ===
  if (fbError) {
    console.error("⚠️ Facebook OAuth error:", {
      fbError,
      error_reason,
      error_description,
    })
    return NextResponse.redirect(
      "https://www.blacksproductivity.site/dashboard/ads?error=facebook_auth_error"
    )
  }

  if (!code) {
    return NextResponse.redirect(
      "https://www.blacksproductivity.site/dashboard/ads?error=no_code"
    )
  }

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error("❌ Faltando FACEBOOK_APP_ID/SECRET nas envs")
    return NextResponse.redirect(
      "https://www.blacksproductivity.site/dashboard/ads?error=env_not_configured"
    )
  }

  try {
    // === 2. Trocar code -> short-lived token ===
    const tokenRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token` +
        `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
        `&code=${encodeURIComponent(code)}`,
      { method: "GET", cache: "no-store" }
    )

    const tokenJson = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokenJson?.access_token) {
      console.error("❌ Erro ao trocar code por token:", tokenJson)
      return NextResponse.redirect(
        "https://www.blacksproductivity.site/dashboard/ads?error=token_exchange_failed"
      )
    }

    const shortToken = tokenJson.access_token as string
    const shortExpiresIn = Number(tokenJson.expires_in ?? 0)

    // === 3. Trocar por long-lived token ===
    let finalAccessToken = shortToken
    let finalExpiresAt: string | null = null

    const longRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
        `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
        `&fb_exchange_token=${encodeURIComponent(shortToken)}`,
      { method: "GET", cache: "no-store" }
    )

    const longJson = await longRes.json().catch(() => ({}))
    if (longRes.ok && longJson?.access_token) {
      finalAccessToken = longJson.access_token
      const expiresIn = Number(longJson.expires_in ?? shortExpiresIn)
      if (expiresIn > 0) {
        finalExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
      }
    }

    // === 4. Validar token (/me) ===
    const meRes = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${encodeURIComponent(
        finalAccessToken
      )}`,
      { method: "GET", cache: "no-store" }
    )
    const meJson = await meRes.json().catch(() => ({}))
    if (!meRes.ok || meJson?.error || !meJson?.id) {
      console.error("❌ Erro ao validar token /me:", meJson)
      return NextResponse.redirect(
        "https://www.blacksproductivity.site/dashboard/ads?error=invalid_token"
      )
    }

    const facebookUserId = meJson.id

    // === 5. Usuário logado ===
    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("❌ Usuário não autenticado:", authError)
      return NextResponse.redirect(
        "https://www.blacksproductivity.site/login?error=authentication_required"
      )
    }

    // === 6. Salvar token ===
    // ⚠️ Usando colunas REAIS da tabela: access_token, expires_at, updated_at
    const { error: insertError } = await admin
      .from("platform_tokens")
      .upsert(
        {
          user_id: user.id,
          platform: "meta",
          access_token: finalAccessToken,
          expires_at: finalExpiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" }
      )

    if (insertError) {
      console.error("❌ Erro ao salvar token em platform_tokens:", insertError)
      return NextResponse.redirect(
        "https://www.blacksproductivity.site/dashboard/ads?error=save_failed"
      )
    }

    // === 7. Compatibilidade antiga (PlatformConfigManager) ===
    try {
      // @ts-ignore
      await PlatformConfigManager.saveOrUpdateToken?.(
        user.id,
        "facebook",
        finalAccessToken,
        { expires_at: finalExpiresAt }
      )
    } catch {
      await PlatformConfigManager.saveConfig(user.id, "facebook", {
        access_token: finalAccessToken,
        expires_at: finalExpiresAt,
      })
    }

    console.log("✅ Facebook conectado com sucesso:", {
      user: user.id,
      fbUser: facebookUserId,
    })

    return NextResponse.redirect(
      "https://www.blacksproductivity.site/dashboard/ads?fb=ok"
    )
  } catch (err: any) {
    console.error("❌ Erro inesperado no callback do Facebook:", err)
    return NextResponse.redirect(
      "https://www.blacksproductivity.site/dashboard/ads?error=unexpected"
    )
  }
}
