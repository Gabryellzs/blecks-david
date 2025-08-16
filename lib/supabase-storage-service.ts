"use client"

import { supabase } from "@/lib/supabaseClient"
import type { PaymentGatewayConfig, PaymentTransaction } from "./payment-gateway-types"
import type { Transaction } from "@/components/views/finances-view"

export class SupabaseStorageService {
  // Usar o cliente singleton importado

  async saveGatewayConfigs(userId: string, configs: PaymentGatewayConfig[]): Promise<boolean> {
    try {
      console.log("DEBUG: Salvando configurações de gateway para usuário:", userId)

      // Primeiro verificamos se já existe um registro para este usuário
      const { data: existingData, error: selectError } = await supabase
        .from("gateway_configs")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Erro ao verificar configurações existentes:", selectError)
        return false
      }

      if (existingData) {
        // Atualizar registro existente
        const { error } = await supabase
          .from("gateway_configs")
          .update({ configs, updated_at: new Date().toISOString() })
          .eq("user_id", userId)

        if (error) {
          console.error("Erro ao atualizar configurações:", error)
          return false
        }
        console.log("DEBUG: Configurações atualizadas com sucesso")
        return true
      } else {
        // Criar novo registro
        const { error } = await supabase.from("gateway_configs").insert([
          {
            user_id: userId,
            configs,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) {
          console.error("Erro ao criar configurações:", error)
          return false
        }
        console.log("DEBUG: Configurações criadas com sucesso")
        return true
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      return false
    }
  }

  async getGatewayConfigs(userId: string): Promise<PaymentGatewayConfig[]> {
    try {
      console.log("DEBUG: Buscando configurações de gateway para usuário:", userId)

      const { data, error } = await supabase.from("gateway_configs").select("configs").eq("user_id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          console.log("DEBUG: Nenhuma configuração encontrada, retornando array vazio")
          return []
        }
        console.error("Erro ao buscar configurações:", error)
        return []
      }

      console.log("DEBUG: Configurações encontradas:", data?.configs?.length || 0)
      return data?.configs || []
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
      return []
    }
  }

  async saveTransactions(userId: string, transactions: PaymentTransaction[]): Promise<boolean> {
    try {
      console.log("DEBUG: Salvando transações para usuário:", userId, "Total:", transactions.length)

      // Primeiro verificamos se já existe um registro para este usuário
      const { data: existingData, error: selectError } = await supabase
        .from("gateway_transactions")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Erro ao verificar transações existentes:", selectError)
        return false
      }

      if (existingData) {
        // Atualizar registro existente
        const { error } = await supabase
          .from("gateway_transactions")
          .update({ transactions, updated_at: new Date().toISOString() })
          .eq("user_id", userId)

        if (error) {
          console.error("Erro ao atualizar transações:", error)
          return false
        }
        console.log("DEBUG: Transações atualizadas com sucesso")
        return true
      } else {
        // Criar novo registro
        const { error } = await supabase.from("gateway_transactions").insert([
          {
            user_id: userId,
            transactions,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) {
          console.error("Erro ao criar transações:", error)
          return false
        }
        console.log("DEBUG: Transações criadas com sucesso")
        return true
      }
    } catch (error) {
      console.error("Erro ao salvar transações:", error)
      return false
    }
  }

  async getTransactions(userId: string): Promise<PaymentTransaction[]> {
    try {
      console.log("DEBUG: Buscando transações para usuário:", userId)

      const { data, error } = await supabase
        .from("gateway_transactions")
        .select("transactions")
        .eq("user_id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          console.log("DEBUG: Nenhuma transação encontrada, retornando array vazio")
          return []
        }
        console.error("Erro ao buscar transações:", error)
        return []
      }

      console.log("DEBUG: Transações encontradas:", data?.transactions?.length || 0)
      return data?.transactions || []
    } catch (error) {
      console.error("Erro ao buscar transações:", error)
      return []
    }
  }

  async saveFinanceTransactions(userId: string, transactions: Transaction[]): Promise<boolean> {
    try {
      console.log("DEBUG: Salvando transações financeiras para usuário:", userId, "Total:", transactions.length)

      // Primeiro verificamos se já existe um registro para este usuário
      const { data: existingData, error: selectError } = await supabase
        .from("finance_transactions")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Erro ao verificar transações financeiras existentes:", selectError)
        return false
      }

      if (existingData) {
        // Atualizar registro existente
        const { error } = await supabase
          .from("finance_transactions")
          .update({ transactions, updated_at: new Date().toISOString() })
          .eq("user_id", userId)

        if (error) {
          console.error("Erro ao atualizar transações financeiras:", error)
          return false
        }
        console.log("DEBUG: Transações financeiras atualizadas com sucesso")
        return true
      } else {
        // Criar novo registro
        const { error } = await supabase.from("finance_transactions").insert([
          {
            user_id: userId,
            transactions,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) {
          console.error("Erro ao criar transações financeiras:", error)
          return false
        }
        console.log("DEBUG: Transações financeiras criadas com sucesso")
        return true
      }
    } catch (error) {
      console.error("Erro ao salvar transações financeiras:", error)
      return false
    }
  }

  async getFinanceTransactions(userId: string): Promise<Transaction[]> {
    try {
      console.log("DEBUG: Buscando transações financeiras para usuário:", userId)

      const { data, error } = await supabase
        .from("finance_transactions")
        .select("transactions")
        .eq("user_id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          console.log("DEBUG: Nenhuma transação financeira encontrada, retornando array vazio")
          return []
        }
        console.error("Erro ao buscar transações financeiras:", error)
        return []
      }

      console.log("DEBUG: Transações financeiras encontradas:", data?.transactions?.length || 0)
      return data?.transactions || []
    } catch (error) {
      console.error("Erro ao buscar transações financeiras:", error)
      return []
    }
  }
}

export const supabaseStorage = new SupabaseStorageService()
