// app/api/facebook-ads/accounts/route.ts
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

// ===== Supabase Admin (para ler platform_tokens com segurança) =====
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// cooldown em memória por usuário (reset a cada boot)
const cooldownUntilByUser = new Map<string, number>() // key = userId, value = epoch ms

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

// Busca o token do Meta: 1) platform_tokens 2) fallback no PlatformConfigManager
async function getMetaAccessToken(userId: string): Promise<string | null> {
  // 1) platform_tokens (preferido)
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

  // 2) fallback para compatibilidade
  try {
    const tokenObj = await PlatformConfigManager.getValidToken(userId, "facebook")
    if (tokenObj?.access_token) return String(tokenObj.access_token)
  } catch (e) {
    console.warn("[ACCOUNTS] Fallback PlatformConfigManager falhou:", e)
  }

  return null
}

export async function GET() {
  // === Autenticação do usuário ===
  const supabase = createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // === Rate limit local (cooldown) ===
  const now = Date.now()
  const until = cooldownUntilByUser.get(user.id) ?? 0
  if (now < until) {
    const cooldownSeconds = Math.ceil((until - now) / 1000)
    return NextResponse.json(
      { error: "Rate limit em andamento. Aguarde.", cooldownSeconds },
      { status: 429 }
    )
  }

  try {
    // === Token do Meta ===
    const accessToken = await getMetaAccessToken(user.id)
    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Facebook não encontrado. Conecte/renove sua conta." },
        { status: 400 }
      )
    }

    // === Chamada ao Graph ===
    // Use a versão que você já estava usando; v23 continua ok
    const fields = ["id", "name", "account_status", "currency", "timezone_id", "amount_spent"].join(",")
    const url = `https://graph.facebook.com/v23.0/me/adaccounts?fields=${encodeURIComponent(fields)}&limit=200`

    const graphRes = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })

    const graphJson = await graphRes.json()

    // === Tratamento de erro do Graph ===
    if (!graphRes.ok || graphJson?.error) {
      const err = graphJson?.error as { code?: number; message?: string } | undefined
      console.error("[ACCOUNTS] Graph error:", err || graphJson)

      // Token inválido/expirado
      if (err?.code === 190 || err?.code === 104) {
        return NextResponse.json(
          { error: "Token do Facebook expirado. Por favor, reconecte sua conta." },
          { status: 401 }
        )
      }

      // Rate limit — ative um cooldown para este usuário
      if (err?.code === 80004) {
        const cooldownSeconds = 90 // ajuste se quiser
        cooldownUntilByUser.set(user.id, Date.now() + cooldownSeconds * 1000)
        return NextResponse.json(
          {
            error:
              err?.message ||
              "Muitas chamadas ao ad-account. Aguarde alguns segundos e tente novamente.",
            cooldownSeconds,
          },
          { status: 429 }
        )
      }

      // Outros erros
      return NextResponse.json(
        { error: err?.message || "Falha ao buscar contas de anúncio do Facebook." },
        { status: graphRes.status || 400 }
      )
    }

    // === Normalização e retorno (sempre array) ===
    const data: FBAdAccountRaw[] = Array.isArray(graphJson?.data) ? graphJson.data : []
    const normalized = data.map(normalizeAccount)

    // Importante: retorne **array puro** para combinar com seu getFacebookAdAccounts()
    return NextResponse.json(normalized, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error: any) {
    console.error("Erro inesperado ao buscar contas de anúncio do Facebook:", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
