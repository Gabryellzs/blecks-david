import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const campaignId = params.id
  const { name } = await request.json() as { name?: string }

  if (!campaignId || !name) {
    return NextResponse.json({ error: "ID da campanha e nome são obrigatórios" }, { status: 400 })
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
    // pega token da tabela platform_tokens
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("platform_tokens")
      .select("access_token")
      .eq("platform", "meta")
      .eq("user_id", user.id)
      .single()

    if (tokenError || !tokenRow?.access_token) {
      console.error("Token de acesso do Facebook não encontrado em platform_tokens:", tokenError)
      return NextResponse.json(
        { error: "Token de acesso do Facebook não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    const accessToken = tokenRow.access_token as string

    // Chama a Graph API para renomear a campanha
    const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${campaignId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        access_token: accessToken,
      }),
    })

    const data = await fbResponse.json()

    if (!fbResponse.ok || (data as any).error) {
      console.error("Erro ao renomear campanha do Facebook:", (data as any).error || data)
      return NextResponse.json(
        { error: (data as any).error?.message || "Falha ao renomear campanha no Facebook." },
        { status: fbResponse.status || 400 },
      )
    }

    return NextResponse.json({ success: true, newName: name })
  } catch (error: any) {
    console.error("Erro inesperado ao renomear campanha do Facebook:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
