import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FB_OAUTH_VERSION = "v19.0";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Configuração do Facebook não encontrada" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  // 1) Se chegou com erro do Facebook
  if (errorParam) {
    return NextResponse.redirect(new URL("/dashboard/ads?error=facebook_auth_error", req.url));
  }

  // 2) Se NÃO tem "code", inicia o OAuth redirecionando pro Facebook
  if (!code) {
    const state = Math.random().toString(36).slice(2);
    const authUrl = new URL(`https://www.facebook.com/${FB_OAUTH_VERSION}/dialog/oauth`);
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "ads_read,ads_management,business_management");
    authUrl.searchParams.set("state", state);
    return NextResponse.redirect(authUrl.toString());
  }

  // 3) Tem "code": troca por access_token
  try {
    // Troca "code" por short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/${FB_OAUTH_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        }),
      { method: "GET", cache: "no-store" }
    );

    const tokenJson: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.access_token) {
      console.error("Falha ao trocar code por token:", tokenJson);
      return NextResponse.redirect(
        new URL("/dashboard/ads?error=token_exchange_failed", req.url)
      );
    }

    const shortToken = tokenJson.access_token as string;

    // Opcional: troca por long-lived token
    const longRes = await fetch(
      `https://graph.facebook.com/${FB_OAUTH_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortToken,
        }),
      { method: "GET", cache: "no-store" }
    );

    let finalToken = shortToken;
    let expiresAt: string | null = null;

    if (longRes.ok) {
      const longJson: any = await longRes.json();
      if (longJson?.access_token) {
        finalToken = longJson.access_token;
        const expiresIn = Number(longJson.expires_in ?? 0);
        if (expiresIn > 0) {
          expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
        }
      }
    }

    // Salva/Atualiza no Supabase (RLS: user_id = auth.uid())
    const upsert = await supabase
      .from("platform_tokens")
      .upsert(
        {
          user_id: user.id,
          platform: "facebook",
          access_token: finalToken,
          expires_at: expiresAt,
          meta: { source: "oauth" },
        },
        { onConflict: "user_id,platform" }
      )
      .select("id")
      .single();

    if (upsert.error) {
      console.error("Erro ao salvar token:", upsert.error);
      return NextResponse.redirect(
        new URL("/dashboard/ads?error=config_save_failed", req.url)
      );
    }

    // Sucesso: volta pro dashboard e dispara carregamento
    return NextResponse.redirect(new URL("/dashboard/ads?fb=ok", req.url));
  } catch (e) {
    console.error("Erro inesperado no OAuth Facebook:", e);
    return NextResponse.redirect(new URL("/dashboard/ads?error=unknown_error", req.url));
  }
}
