import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(
  request: Request,
  { params }: { params: { id: string; adSetId: string } },
) {
  const { id: adAccountId, adSetId } = params

  try {
    const body = await request.json().catch(() => ({}))
    const dailyBudget = Number(body.dailyBudget)

    if (!Number.isFinite(dailyBudget) || dailyBudget <= 0) {
      return NextResponse.json(
        { error: "dailyBudget inválido. Envie um valor em centavos maior que zero." },
        { status: 400 },
      )
    }

    // 1) Usuário logado
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[AdSetBudget] Usuário não autenticado:", authError)
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      )
    }

    // 2) Token do Meta na platform_tokens
    const { data: tokenRow, error: tokenError } = await supabase
      .from("platform_tokens")
      .select("access_token")
      .eq("platform", "meta")
      .eq("user_id", user.id)
      .single()

    if (tokenError) {
      console.error(
        "[AdSetBudget] Erro ao buscar token na platform_tokens:",
        tokenError,
      )
      return NextResponse.json(
        { error: "Erro ao buscar token do Meta no banco." },
        { status: 500 },
      )
    }

    if (!tokenRow?.access_token) {
      console.error(
        "[AdSetBudget] Nenhum access_token encontrado para platform=meta e user_id=",
        user.id,
      )
      return NextResponse.json(
        {
          error:
            "Token do Meta não encontrado. Conecte sua conta Meta novamente.",
        },
        { status: 400 },
      )
    }

    const accessToken = tokenRow.access_token

    // 3) Chama o Graph API para atualizar o orçamento do AD SET
    const url = `https://graph.facebook.com/v20.0/${adSetId}`

    const graphRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        daily_budget: String(dailyBudget), // em centavos, string
        access_token: accessToken,
      }),
    })

    const graphBody = await graphRes.json().catch(() => null)

    if (!graphRes.ok) {
      console.error("[AdSetBudget] Erro do Graph API:", graphBody)
      return NextResponse.json(
        {
          error:
            graphBody?.error?.message ||
            "Erro ao atualizar orçamento do conjunto no Facebook.",
          details: graphBody,
        },
        { status: graphRes.status || 500 },
      )
    }

    return NextResponse.json({
      success: true,
      adAccountId,
      adSetId,
      newBudget: dailyBudget,
    })
  } catch (err: any) {
    console.error("[AdSetBudget] Erro inesperado:", err)
    return NextResponse.json(
      { error: err?.message || "Erro interno do servidor." },
      { status: 500 },
    )
  }
}
