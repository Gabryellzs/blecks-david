import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const campaignId = params.id
  const { dailyBudget } = (await request.json()) as { dailyBudget?: number }

  if (!campaignId || !dailyBudget || dailyBudget <= 0) {
    return NextResponse.json(
      { error: "ID da campanha e dailyBudget (centavos) são obrigatórios." },
      { status: 400 },
    )
  }

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("platform_tokens")
      .select("access_token")
      .eq("platform", "meta")
      .eq("user_id", user.id)
      .maybeSingle()

    if (tokenError || !tokenRow?.access_token) {
      console.error("Token de acesso do Facebook não encontrado em platform_tokens:", tokenError)
      return NextResponse.json(
        { error: "Token de acesso do Facebook não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    const accessToken = tokenRow.access_token as string

    // Facebook espera daily_budget em centavos (string)
    const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${campaignId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        daily_budget: String(dailyBudget),
        access_token: accessToken,
      }),
    })

    const data = await fbResponse.json()

    if (!fbResponse.ok || (data as any).error) {
      console.error("Erro ao atualizar orçamento da campanha no Facebook:", (data as any).error || data)
      return NextResponse.json(
        { error: (data as any).error?.message || "Falha ao atualizar orçamento no Facebook." },
        { status: fbResponse.status || 400 },
      )
    }

    // devolve em reais pro front (opcional)
    const newBudgetBRL = dailyBudget / 100

    return NextResponse.json({ success: true, newBudget: newBudgetBRL })
  } catch (error: any) {
    console.error("Erro inesperado ao atualizar orçamento da campanha:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
