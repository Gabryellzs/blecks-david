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
    const status = body.status as "ACTIVE" | "PAUSED"

    if (!status || (status !== "ACTIVE" && status !== "PAUSED")) {
      return NextResponse.json(
        { error: "Status inválido. Use 'ACTIVE' ou 'PAUSED'." },
        { status: 400 },
      )
    }

    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[AdSetStatus] Usuário não autenticado:", authError)
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      )
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from("platform_tokens")
      .select("access_token")
      .eq("platform", "meta")
      .eq("user_id", user.id)
      .single()

    if (tokenError) {
      console.error("[AdSetStatus] Erro ao buscar token na platform_tokens:", tokenError)
      return NextResponse.json(
        { error: "Erro ao buscar token do Meta no banco." },
        { status: 500 },
      )
    }

    if (!tokenRow?.access_token) {
      console.error(
        "[AdSetStatus] Nenhum access_token encontrado para platform=meta e user_id=",
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

    const url = `https://graph.facebook.com/v20.0/${adSetId}`

    const graphRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        access_token: accessToken,
      }),
    })

    const graphBody = await graphRes.json().catch(() => null)

    if (!graphRes.ok) {
      console.error("[AdSetStatus] Erro do Graph API:", graphBody)
      return NextResponse.json(
        {
          error:
            graphBody?.error?.message ||
            "Erro ao atualizar status do conjunto no Facebook.",
          details: graphBody,
        },
        { status: graphRes.status || 500 },
      )
    }

    return NextResponse.json({
      success: true,
      adAccountId,
      adSetId,
      newStatus: status,
    })
  } catch (err: any) {
    console.error("[AdSetStatus] Erro inesperado:", err)
    return NextResponse.json(
      { error: err?.message || "Erro interno do servidor." },
      { status: 500 },
    )
  }
}
