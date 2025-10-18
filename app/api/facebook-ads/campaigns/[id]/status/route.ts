import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const campaignId = params.id
  const { status } = await request.json() // 'PAUSED' ou 'ACTIVE'

  if (!campaignId || !status) {
    return NextResponse.json({ error: "ID da campanha e status são obrigatórios" }, { status: 400 })
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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("facebook_access_token")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.facebook_access_token) {
      console.error("Token de acesso do Facebook não encontrado para o usuário:", profileError)
      return NextResponse.json(
        { error: "Token de acesso do Facebook não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    const accessToken = profile.facebook_access_token

    // Chamar a Graph API para atualizar o status da campanha
    const response = await fetch(`https://graph.facebook.com/v19.0/${campaignId}?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    })
    const data = await response.json()

    if (data.error) {
      console.error("Erro ao atualizar status da campanha do Facebook:", data.error)
      return NextResponse.json({ error: data.error.message }, { status: response.status })
    }

    return NextResponse.json({ success: true, newStatus: status })
  } catch (error: any) {
    console.error("Erro inesperado ao atualizar status da campanha do Facebook:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
