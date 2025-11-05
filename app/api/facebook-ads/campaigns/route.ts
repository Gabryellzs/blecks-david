// app/api/facebook-ads/campaigns/route.ts
import { NextResponse, NextRequest } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

// ===== Supabase Admin (SERVICE ROLE) =====
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// cooldown simples por usuário (opcional)
const cooldownUntilByUser = new Map<string, number>()

type FBCampaignRaw = {
  id?: string
  name?: string
  status?: string
  effective_status?: string
  objective?: string
  daily_budget?: string | null
  created_time?: string
  updated_time?: string
}

function ensureActPrefix(id: string) {
  const s = String(id || "").trim()
  return s.startsWith("act_") ? s : `act_${s}`
}

function normalizeCampaign(c: FBCampaignRaw) {
  return {
    id: c.id ?? "",
    name: c.name ?? "",
    status: c.status ?? "",
    effective_status: c.effective_status ?? "",
    objective: c.objective ?? "",
    daily_budget: c.daily_budget ?? null,
    created_time: c.created_time ?? null,
    updated_time: c.updated_time ?? null,
  }
}

// Busca o token do Meta igual ao /accounts
async function getMetaAccessToken(userId: string): Promise<string | null> {
  // 1) platform_tokens (platform = 'meta')
  const { data: row, error } = await admin
    .from("platform_tokens")
    .select("access_token")
    .eq("user_id", userId)
    .eq("platform", "meta")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[CAMPAIGNS] Supabase platform_tokens error:", error)
  }
  if (row?.access_token) return String(row.access_token)

  // 2) fallback (compatibilidade)
  try {
    const tokenObj = await PlatformConfigManager.getValidToken(userId, "facebook")
    if (tokenObj?.access_token) return String(tokenObj.access_token)
  } catch (e) {
    console.warn("[CAMPAIGNS] Fallback PlatformConfigManager falhou:", e)
  }

  return null
}

export async function GET(req: NextRequest) {
  // Autenticação do usuário
  const supabase = createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Rate limit local simples
  const now = Date.now()
  const until = cooldownUntilByUser.get(user.id) ?? 0
  if (now < until) {
    const cooldownSeconds = Math.ceil((until - now) / 1000)
    return NextResponse.json(
      { error: "Rate limit", cooldownSeconds },
      { status: 429 }
    )
  }

  // ad_account_id obrigatório
  const adAccountIdParam = req.nextUrl.searchParams.get("ad_account_id") || ""
  if (!adAccountIdParam) {
    return NextResponse.json(
      { error: "Parâmetro ad_account_id é obrigatório" },
      { status: 400 }
    )
  }
  const adAccountId = ensureActPrefix(adAccountIdParam)

  try {
    // Token do Meta
    const accessToken = await getMetaAccessToken(user.id)
    if (!accessToken) {
      return NextResponse.json(
        {
          error: "SEM_TOKEN_FACEBOOK",
          message:
            "Token de acesso do Facebook não encontrado. Por favor, reconecte sua conta.",
        },
        { status: 400 }
      )
    }

    // Chamada ao Graph
    const fields = [
      "id",
      "name",
      "status",
      "effective_status",
      "objective",
      "daily_budget",
      "created_time",
      "updated_time",
    ].join(",")

    const url = `https://graph.facebook.com/v23.0/${encodeURIComponent(
      adAccountId
    )}/campaigns?fields=${encodeURIComponent(fields)}&limit=200`

    const graphRes = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })

    const graphJson = await graphRes.json().catch(() => ({}))

    // Tratamento de erro Graph
    if (!graphRes.ok || (graphJson as any)?.error) {
      const err = (graphJson as any)?.error as { code?: number; message?: string } | undefined
      console.error("[CAMPAIGNS] Graph error:", err || graphJson)

      // Token inválido/expirado
      if (err?.code === 190 || err?.code === 104) {
        return NextResponse.json(
          { error: "TOKEN_EXPIRADO", message: "Token expirado. Reconecte sua conta." },
          { status: 401 }
        )
      }

      // Rate limit do Meta
      if (err?.code === 80004) {
        const cooldownSeconds = 90
        cooldownUntilByUser.set(user.id, Date.now() + cooldownSeconds * 1000)
        return NextResponse.json(
          {
            error: "FACEBOOK_RATE_LIMIT",
            message:
              err?.message ||
              "Muitas chamadas ao endpoint de campanhas. Aguarde alguns segundos e tente novamente.",
            cooldownSeconds,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: "FACEBOOK_GRAPH_ERROR", message: err?.message || "Falha ao buscar campanhas." },
        { status: graphRes.status || 400 }
      )
    }

    // Normalização do retorno (array puro)
    const data: FBCampaignRaw[] = Array.isArray((graphJson as any)?.data)
      ? (graphJson as any).data
      : []

    const normalized = data.map(normalizeCampaign)

    return NextResponse.json(normalized, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (e: any) {
    console.error("Erro inesperado ao buscar campanhas:", e)
    return NextResponse.json(
      { error: e?.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
