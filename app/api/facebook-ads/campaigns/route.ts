import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const adAccountId = searchParams.get("ad_account_id")

  if (!adAccountId) {
    return NextResponse.json({ error: "ID da conta de anúncio é obrigatório" }, { status: 400 })
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

    // Chamar a Graph API para listar campanhas
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=name,status,daily_budget,insights{spend}&access_token=${accessToken}`,
      { method: "GET" },
    )
    const data = await response.json()

    if (data.error) {
      console.error("Erro ao buscar campanhas do Facebook:", data.error)
      return NextResponse.json({ error: data.error.message }, { status: response.status })
    }

    return NextResponse.json(data.data)
  } catch (error: any) {
    console.error("Erro inesperado ao buscar campanhas do Facebook:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
