import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

// cooldown em memória por usuário (reset a cada boot)
const cooldownUntilByUser = new Map<string, number>() // key = userId, value = epoch ms

export async function GET(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Se ainda está em cooldown, devolve 429 sem chamar o Graph
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
    const accessToken = await PlatformConfigManager.getValidToken(user.id, "facebook")
    if (!accessToken) {
      return NextResponse.json(
        { error: "Token do Facebook não encontrado. Reconecte sua conta." },
        { status: 400 }
      )
    }

    // Reduz o custo da chamada: peça só os campos necessários
    const url = new URL("https://graph.facebook.com/v23.0/me/adaccounts")
    url.searchParams.set("access_token", accessToken)
    url.searchParams.set("fields", "id,account_id,name") // só o essencial
    url.searchParams.set("limit", "50")

    const graphRes = await fetch(url.toString(), { method: "GET", cache: "no-store" })
    const graphJson = await graphRes.json()

    if (graphJson?.error) {
      const err = graphJson.error as { code?: number; message?: string }
      console.error("Erro Facebook Graph:", err)

      // Token inválido/expirado
      if (err.code === 190 || err.code === 104) {
        return NextResponse.json(
          { error: "Token do Facebook expirado. Por favor, reconecte sua conta." },
          { status: 401 }
        )
      }

      // Rate limit — ative um cooldown para este usuário
      if (err.code === 80004) {
        const cooldownSeconds = 90 // ajuste se quiser
        cooldownUntilByUser.set(user.id, Date.now() + cooldownSeconds * 1000)
        return NextResponse.json(
          {
            error:
              err.message ||
              "Muitas chamadas ao ad-account. Aguarde alguns segundos e tente novamente.",
            cooldownSeconds,
          },
          { status: 429 }
        )
      }

      // Outros erros
      return NextResponse.json(
        { error: err.message || "Falha ao buscar contas de anúncio do Facebook." },
        { status: graphRes.status || 400 }
      )
    }

    const accounts = Array.isArray(graphJson?.data) ? graphJson.data : []

    return NextResponse.json(
      { accounts },
      {
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (error: any) {
    console.error("Erro inesperado ao buscar contas de anúncio do Facebook:", error)
    return NextResponse.json({ error: error?.message || "Erro interno do servidor" }, { status: 500 })
  }
}
