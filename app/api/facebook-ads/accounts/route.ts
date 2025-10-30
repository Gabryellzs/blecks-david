// app/api/facebook-ads/accounts/route.ts
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

// =============================
// Supabase Admin (SERVICE ROLE)
// =============================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// IMPORTANTE: o service role NUNCA pode vazar pro client-side.
// Aqui a rota é server-side, então tudo bem.
const admin = createSupabaseAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// cooldown em memória por usuário (reset a cada boot)
const cooldownUntilByUser = new Map<string, number>() // key = userId, value = epoch ms

// =============================
// Tipos auxiliares
// =============================
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

// =============================
// Busca o token do Meta
// 1) tabela platform_tokens
// 2) fallback PlatformConfigManager
// =============================
async function getMetaAccessToken(userId: string): Promise<string | null> {
  // 1. tentar na platform_tokens
  const { data: row, error } = await admin
    .from("platform_tokens")
    .select("access_token")
    .eq("user_id", userId)
    .eq("platform", "meta")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[ACCOUNTS] Supabase platform_tokens error:", error)
  }

  if (row?.access_token) {
    return String(row.access_token)
  }

  // 2. fallback
  try {
    const tokenObj = await PlatformConfigManager.getValidToken(userId, "facebook")
    if (tokenObj?.access_token) {
      return String(tokenObj.access_token)
    }
  } catch (e) {
    console.warn("[ACCOUNTS] Fallback PlatformConfigManager falhou:", e)
  }

  return null
}

// =============================
// Handler GET
// =============================
export async function GET() {
  // --- Autenticação do usuário logado via Supabase ---
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

  // --- Rate limit simples em memória (cooldown local) ---
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
    // --- Recuperar access_token do Meta ---
    const accessToken = await getMetaAccessToken(user.id)

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "SEM_TOKEN_FACEBOOK",
          message:
            "Token de acesso do Facebook não encontrado. Conecte ou renove sua conta de anúncios.",
        },
        { status: 400 }
      )
    }

    // --- Montar URL do Graph ---
    // você estava usando v23.0, mantive
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

    // --- Chamar Graph ---
    const graphRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // garantir que Next não faça cache dessa chamada
      cache: "no-store",
    })

    const graphJson = await graphRes.json()

    // --- Se o Graph retornou erro ---
    if (!graphRes.ok || graphJson?.error) {
      const err =
        (graphJson?.error as { code?: number; message?: string }) || undefined

      console.error("[ACCOUNTS] Graph error:", err || graphJson)

      // Token inválido/expirado
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

      // Rate limit específico do Meta (ex.: code 80004)
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

      // Qualquer outro erro do Graph
      return NextResponse.json(
        {
          error: "FACEBOOK_GRAPH_ERROR",
          message:
            err?.message ||
            "Falha ao buscar contas de anúncio do Facebook.",
          details: err || graphJson,
        },
        {
          status: graphRes.status && graphRes.status !== 200
            ? graphRes.status
            : 400,
        }
      )
    }

    // --- Normalizar retorno ---
    const data: FBAdAccountRaw[] = Array.isArray(graphJson?.data)
      ? graphJson.data
      : []

    const normalized = data.map(normalizeAccount)

    // IMPORTANTE:
    // Seu front espera um ARRAY PURO, não objeto {accounts: [...]}
    // então retorno direto o array
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
