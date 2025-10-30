// app/api/auth/facebook/callback/route.ts
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

// URL fixa registrada no painel do Facebook
const REDIRECT_URI =
  "https://www.blacksproductivity.site/api/auth/facebook/callback"

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// service role: só usar no server, nunca expor client-side
const admin = createSupabaseAdminClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const code = searchParams.get("code")
  const fbError = searchParams.get("error")
  const error_reason = searchParams.get("error_reason")
  const error_description = searchParams.get("error_description")

  // 1) se o usuário recusou no popup
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
    console.error("⚠️ Callback sem code")
    return NextResponse.redirect(
      "https://www.blacksproductivity.site/dashboard/ads?error=no_code"
    )
  }

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error("❌ Env faltando (FACEBOOK_APP_ID/SECRET)")
    return NextResponse.redirect(
      "https://www.blacksproductivity.site/dashboard/ads?error=env_not_configured"
    )
  }

  try {
    // 2) trocar o "code" por um short-lived access token
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
      console.error("❌ Erro ao trocar code por token:", {
        status: tokenRes.status,
        body: tokenJson,
      })
      return NextResponse.redirect(
        "https://www.blacksproductivity.site/dashboard/ads?error=token_exchange_failed"
      )
    }

    const shortToken = tokenJson.access_token as string
    const shortExpiresIn = tokenJson.expires_in as number | undefined

    // 3) tentar trocar por long-lived token (mais estável)
    let finalAccessToken = shortToken
    let finalExpiresIn = shortExpiresIn

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
      finalExpiresIn = longJson.expires_in ?? finalExpiresIn
    }

    // 4) validar token e pegar dados básicos /me
    const meRes = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${encodeURIComponent(
        finalAccessToken
      )}`,
      { method: "GET", cache: "no-store" }
    )

    const meJson = await meRes.json().catch(() => ({}))

    if (!meRes.ok || meJson?.error || !meJson?.id) {
      console.error("❌ Erro ao validar token no /me:", {
        status: meRes.status,
        body: meJson,
      })
      return NextResponse.redirect(
        "https://www.blacksproductivity.site/dashboard/ads?error=invalid_token"
      )
    }

    const facebookUserId = meJson.id as string

    // 5) identificar o usuário logado na sua plataforma (Supabase Auth)
    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Usuário não autenticado ao voltar do Facebook:", authError)
      return NextResponse.redirect(
        "https://www.blacksproductivity.site/login?error=authentication_required"
      )
    }

    // 6) salvar token na tabela platform_tokens
    //    ESSENCIAL: platform = "meta"
    const { error: upsertError } = await admin
      .from("platform_tokens")
      .upsert(
        {
          user_id: user.id,
          platform: "meta", // <- a rota /facebook-ads/accounts procura "meta"
          access_token: finalAccessToken,
          updated_at: new Date().toISOString(),
          expires_in: finalExpiresIn ?? null,
          platform_user_id: facebookUserId,
        },
        {
          onConflict: "user_id,platform",
        }
      )

    if (upsertError) {
      console.error("❌ Erro salvando token em platform_tokens:", upsertError)
      return NextResponse.redirect(
        "https://www.blacksproductivity.site/dashboard/ads?error=save_failed"
      )
    }

    // 7) compatibilidade antiga (caso seu código ainda leia PlatformConfigManager)
    try {
      // @ts-ignore
      await PlatformConfigManager.saveOrUpdateToken?.(
        user.id,
        "facebook",
        finalAccessToken,
        {
          expires_in: finalExpiresIn ?? null,
          platform_user_id: facebookUserId,
        }
      )
    } catch {
      await PlatformConfigManager.saveConfig(user.id, "facebook", {
        access_token: finalAccessToken,
        expires_in: finalExpiresIn ?? null,
        platform_user_id: facebookUserId,
      })
    }

    console.log("✅ Facebook conectado!", {
      appUser: user.id,
      fbUser: facebookUserId,
    })

    // sucesso → volta pro dashboard, que vai chamar /api/facebook-ads/accounts
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
