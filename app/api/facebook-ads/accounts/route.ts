// app/api/facebook-ads/accounts/route.ts
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createSupabaseAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// cooldown em memória por usuário (reset a cada boot)
const cooldownUntilByUser = new Map<string, number>()

type FBAdAccountRaw = {
  id?: string
  account_id?: string
  name?: string
  account_status?: number
  currency?: string
  timezone_id?: number
  amount_spent?: string
}

function ensureActPrefix(id: string) {
  const s = String(id || "").trim()
  return s.startsWith("act_") ? s : `act_${s}`
}

function normalizeAccount(a: FBAdAccountRaw) {
  const rawId = a.id || a.account_id || ""
  return {
    id: ensureActPrefix(rawId),
    name: a.name ?? "",
    account_status: a.account_status ?? 0,
    currency: a.currency ?? "",
    timezone_id: a.timezone_id ?? null,
    amount_spent: a.amount_spent ?? "0",
  }
}

// tenta pegar o token no banco
async function getMetaAccessToken(userId: string): Promise<string | null> {
  // aceitar tanto "meta" quanto "facebook" por compat
  const { data, error } = await admin
    .from("platform_tokens")
    .select("platform, access_token, updated_at")
    .eq("user_id", userId)
    .in("platform", ["meta", "facebook"])
    .order("updated_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("[ACCOUNTS] Supabase platform_tokens error:", error)
    return null
  }

  if (data && data.length > 0 && data[0]?.access_token) {
    return String(data[0].access_token)
  }

  // fallback compatível com PlatformConfigManager legado
  try {
    const tokenObj = await PlatformConfigManager.getValidToken(
      userId,
      "facebook"
    )
    if (tokenObj?.access_token) {
      return String(tokenObj.access_token)
    }
  } catch (e) {
    console.warn("[ACCOUNTS] Fallback PlatformConfigManager falhou:", e)
  }

  return null
}

export async function GET() {
  // -- autenticar usuário
  const supabase = createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "SEM_SESSAO",
        message: "Usuário não autenticado.",
      },
      { status: 401 }
    )
  }

  // -- rate limit local
  const now = Date.now()
  const until = cooldownUntilByUser.get(user.id) ?? 0
  if (now < until) {
    const cooldownSeconds = Math.ceil((until - now) / 1000)
    return NextResponse.json(
      {
        error: "RATE_LIMIT",
        message: "Muitas consultas em sequência. Aguarde alguns segundos.",
        cooldownSeconds,
      },
      { status: 429 }
    )
  }

  try {
    // -- token salvo no banco
    const accessToken = await getMetaAccessToken(user.id)

    if (!accessToken) {
      // DEBUG: vamos olhar o que tem pra esse user na tabela
      const debugRows = await admin
        .from("platform_tokens")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)

      return NextResponse.json(
        {
          error: "SEM_TOKEN_FACEBOOK",
          message:
            "Token de acesso do Facebook não encontrado. Conecte ou renove sua conta de anúncios.",
          debug_user_id: user.id,
          debug_rows: debugRows.data ?? null,
          debug_error: debugRows.error ?? null,
        },
        { status: 400 }
      )
    }

    // -- montar URL pro Graph
    const fields = [
      "id",
      "name",
      "account_status",
      "currency",
      "timezone_id",
      "amount_spent",
    ].join(",")

    const url = `https://graph.facebook.com/v23.0/me/adaccounts?fields=${encodeURIComponent(
      fields
    )}&limit=200`

    const graphRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    const graphJson = await graphRes.json()

    if (!graphRes.ok || graphJson?.error) {
      const err =
        (graphJson?.error as { code?: number; message?: string }) || undefined

      console.error("[ACCOUNTS] Graph error:", err || graphJson)

      if (err?.code === 190 || err?.code === 104) {
        return NextResponse.json(
          {
            error: "TOKEN_EXPIRADO",
            message:
              "Token do Facebook expirado ou inválido. Por favor, reconecte sua conta.",
            details: err,
          },
          { status: 401 }
        )
      }

      if (err?.code === 80004) {
        const cooldownSeconds = 90
        cooldownUntilByUser.set(user.id, Date.now() + cooldownSeconds * 1000)

        return NextResponse.json(
          {
            error: "FACEBOOK_RATE_LIMIT",
            message:
              err?.message ||
              "Muitas chamadas para /adaccounts. Aguarde alguns segundos e tente novamente.",
            cooldownSeconds,
            details: err,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: "FACEBOOK_GRAPH_ERROR",
          message:
            err?.message ||
            "Falha ao buscar contas de anúncio do Facebook.",
          details: err || graphJson,
        },
        {
          status:
            graphRes.status && graphRes.status !== 200
              ? graphRes.status
              : 400,
        }
      )
    }

    const data: FBAdAccountRaw[] = Array.isArray(graphJson?.data)
      ? graphJson.data
      : []

    const normalized = data.map(normalizeAccount)

    return NextResponse.json(normalized, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (err: any) {
    console.error(
      "Erro inesperado ao buscar contas de anúncio do Facebook:",
      err
    )

    return NextResponse.json(
      {
        error: "ERRO_INTERNO",
        message: err?.message || "Erro interno do servidor.",
      },
      { status: 500 }
    )
  }
}
