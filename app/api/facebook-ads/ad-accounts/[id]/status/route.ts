import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin" // Para acessar o token de forma segura

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const adAccountId = params.id
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { status } = await request.json()

  if (!status || (status !== "ACTIVE" && status !== "PAUSED")) {
    return NextResponse.json({ error: "Status inválido. Deve ser 'ACTIVE' ou 'PAUSED'." }, { status: 400 })
  }

  try {
    // Obter o token de acesso do Facebook do perfil do usuário
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

    // Chamar a Graph API para atualizar o status da conta de anúncio
    // Nota: A API do Facebook não permite alterar o status de uma "ad account" diretamente para "ACTIVE" ou "PAUSED"
    // da mesma forma que uma campanha. O status da conta é mais complexo e geralmente reflete o estado da conta
    // (ativa, desativada, pendente de revisão, etc.).
    // Para fins de simulação e para atender ao pedido do usuário de "ativar/desativar",
    // vamos simular a chamada e retornar um sucesso. Em um cenário real, você precisaria
    // verificar a documentação da API do Facebook para gerenciar o status da conta de anúncio
    // ou focar em ativar/pausar campanhas dentro da conta.
    // Por enquanto, esta rota servirá como um placeholder funcional.

    console.log(`Simulando atualização de status para Ad Account ${adAccountId} para: ${status}`)

    // Simulação de sucesso
    return NextResponse.json({ success: true, newStatus: status, message: "Status atualizado com sucesso (simulado)." })
  } catch (error: any) {
    console.error("Erro inesperado ao atualizar status da conta de anúncio do Facebook:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
