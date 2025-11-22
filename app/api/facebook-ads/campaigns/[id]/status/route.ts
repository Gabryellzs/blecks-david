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
    // 🔹 Busca o token na tabela platform_tokens
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("platform_tokens")
      .select("access_token") // coluna do print (sem o segundo "s")
      .eq("user_id", user.id)
      .eq("platform", "meta")
      .single()

    if (tokenError || !tokenRow?.access_token) {
      console.error("Token de acesso do Facebook não encontrado em platform_tokens:", tokenError)
      return NextResponse.json(
        { error: "Token de acesso do Facebook não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    // 🔹 Normaliza o token vindo do banco
    let rawToken = tokenRow.access_token as any
    let accessToken: string | undefined

    if (typeof rawToken === "string") {
      // Se por acaso tiver salvo JSON como string, tenta parsear
      try {
        const maybeJson = JSON.parse(rawToken)
        if (maybeJson && typeof maybeJson === "object" && typeof maybeJson.access_token === "string") {
          accessToken = maybeJson.access_token
        } else {
          accessToken = rawToken
        }
      } catch {
        // não era JSON, usa direto
        accessToken = rawToken
      }

      // Remove prefixo "Bearer " se tiver
      if (accessToken.startsWith("Bearer ")) {
        accessToken = accessToken.replace(/^Bearer\s+/i, "")
      }

      // Tira espaços extras
      accessToken = accessToken.trim()
    } else if (rawToken && typeof rawToken.access_token === "string") {
      // Caso tenha sido salvo como objeto
      accessToken = rawToken.access_token
    }

    if (!accessToken || accessToken.length < 20) {
      console.error("Token de acesso do Facebook inválido ou muito curto:", accessToken)
      return NextResponse.json(
        { error: "Token de acesso do Facebook inválido. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    // 🔹 Chama a Graph API para atualizar o status da campanha
    const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${campaignId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        status,
        access_token: accessToken,
      }),
    })

    const data = await fbResponse.json()

    if (!fbResponse.ok || data.error) {
      console.error("Erro ao atualizar status da campanha do Facebook:", data.error || data)
      const message = data?.error?.message || "Falha ao atualizar status da campanha do Facebook."
      return NextResponse.json({ error: message }, { status: fbResponse.status })
    }

    return NextResponse.json({ success: true, newStatus: status })
  } catch (error: any) {
    console.error("Erro inesperado ao atualizar status da campanha do Facebook:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
