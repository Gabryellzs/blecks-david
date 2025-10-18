import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { Event } from "@/lib/types/event"

export async function GET(req: NextRequest) {
  try {
    // 1. Obter a sessão do usuário autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("Erro ao obter sessão ou sessão não encontrada:", sessionError?.message || "Sessão não encontrada")
      return NextResponse.json({ error: "Não autenticado. Faça login para acessar os eventos." }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Consultar a tabela 'events' para os eventos do usuário autenticado
    // O RLS (Row Level Security) no Supabase garantirá que apenas os eventos do usuário sejam retornados.
    const { data: events, error } = await supabase
      .from("events")
      .select("*") // Seleciona todos os campos
      .eq("user_id", userId) // Filtra por user_id (RLS também faria isso, mas é bom ser explícito)
      .order("created_at", { ascending: false }) // Ordena pelos mais recentes

    if (error) {
      console.error("Erro ao buscar eventos no Supabase:", error)
      return NextResponse.json({ error: "Erro interno ao buscar eventos.", details: error.message }, { status: 500 })
    }

    console.log(`Eventos encontrados para o usuário ${userId}:`, events.length)
    return NextResponse.json(events as Event[], { status: 200 })
  } catch (error: any) {
    console.error("Erro inesperado ao buscar eventos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor.", details: error.message || "Erro desconhecido." },
      { status: 500 },
    )
  }
}
