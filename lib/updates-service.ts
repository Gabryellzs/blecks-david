import { supabase } from "./supabase"
import type { AppUpdate } from "./update-types"

// Serviço para gerenciar atualizações do aplicativo
export const updatesService = {
  // Obter todas as atualizações
  async getAllUpdates(): Promise<AppUpdate[]> {
    const { data, error } = await supabase.from("app_updates").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar atualizações:", error)
      throw error
    }

    return data || []
  },

  // Obter atualizações não vistas pelo usuário
  async getUnseenUpdates(userId: string): Promise<AppUpdate[]> {
    // Primeiro, verificamos se a tabela existe
    const { error: tableCheckError } = await supabase.from("app_updates").select("id").limit(1)

    // Se a tabela não existir, criamos ela
    if (tableCheckError) {
      console.log("Tabela de atualizações não encontrada, criando...")
      await this.createUpdateTables()
      return []
    }

    // Buscar atualizações que o usuário ainda não viu
    const { data, error } = await supabase
      .from("app_updates")
      .select("*")
      .not("id", "in", supabase.from("user_seen_updates").select("update_id").eq("user_id", userId))
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar atualizações não vistas:", error)
      throw error
    }

    return data || []
  },

  // Marcar uma atualização como vista pelo usuário
  async markUpdateAsSeen(userId: string, updateId: string): Promise<void> {
    const { error } = await supabase.from("user_seen_updates").insert({
      user_id: userId,
      update_id: updateId,
      seen_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Erro ao marcar atualização como vista:", error)
      throw error
    }
  },

  // Adicionar uma nova atualização
  async addUpdate(update: Omit<AppUpdate, "id" | "created_at">): Promise<AppUpdate> {
    const { data, error } = await supabase
      .from("app_updates")
      .insert({
        ...update,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Erro ao adicionar atualização:", error)
      throw error
    }

    return data[0]
  },

  // Excluir uma atualização
  async deleteUpdate(updateId: string): Promise<void> {
    const { error } = await supabase.from("app_updates").delete().eq("id", updateId)

    if (error) {
      console.error("Erro ao excluir atualização:", error)
      throw error
    }
  },

  // Criar as tabelas necessárias no Supabase (executar apenas uma vez)
  async createUpdateTables(): Promise<void> {
    // Criar tabela de atualizações
    await supabase.rpc("create_app_updates_table")

    // Criar tabela de visualizações de atualizações
    await supabase.rpc("create_user_seen_updates_table")

    console.log("Tabelas de atualizações criadas com sucesso")
  },
}
