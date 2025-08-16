"use client"

import { useState, useEffect, useCallback } from "react"
import { supabaseStorage } from "./supabase-storage-service"
import type {
  PaymentGatewayConfig,
  PaymentTransaction,
  PaymentGatewayType,
  GatewaySummary,
  ConsolidatedSummary,
} from "./payment-gateway-types"
import { supabase } from "./supabaseClient"

// Dados de exemplo para demonstração
const SAMPLE_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: "tx_001",
    gatewayId: "kirvano",
    transactionId: "KRV_2024_001",
    customerName: "João Silva",
    customerEmail: "joao@email.com",
    productName: "Curso de Marketing Digital",
    amount: 497.0,
    fees: 24.85,
    netAmount: 472.15,
    status: "completed",
    date: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
    currency: "BRL",
    paymentMethod: "credit_card",
  },
  {
    id: "tx_002",
    gatewayId: "cakto",
    transactionId: "CKT_2024_002",
    customerName: "Maria Santos",
    customerEmail: "maria@email.com",
    productName: "Mentoria Individual",
    amount: 1200.0,
    fees: 60.0,
    netAmount: 1140.0,
    status: "completed",
    date: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    currency: "BRL",
    paymentMethod: "pix",
  },
  {
    id: "tx_003",
    gatewayId: "tibopay",
    transactionId: "TBP_2024_003",
    customerName: "Carlos Oliveira",
    customerEmail: "carlos@email.com",
    productName: "E-book Avançado",
    amount: 97.0,
    fees: 4.85,
    netAmount: 92.15,
    status: "completed",
    date: new Date(Date.now() - 259200000).toISOString(), // 3 dias atrás
    currency: "BRL",
    paymentMethod: "credit_card",
  },
  {
    id: "tx_004",
    gatewayId: "kiwify",
    transactionId: "KWF_2024_004",
    customerName: "Ana Costa",
    customerEmail: "ana@email.com",
    productName: "Workshop Online",
    amount: 297.0,
    fees: 14.85,
    netAmount: 282.15,
    status: "pending",
    date: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
    currency: "BRL",
    paymentMethod: "boleto",
  },
  {
    id: "tx_005",
    gatewayId: "kirvano",
    transactionId: "KRV_2024_005",
    customerName: "Pedro Ferreira",
    customerEmail: "pedro@email.com",
    productName: "Consultoria Premium",
    amount: 2500.0,
    fees: 125.0,
    netAmount: 2375.0,
    status: "failed",
    date: new Date(Date.now() - 345600000).toISOString(), // 4 dias atrás
    currency: "BRL",
    paymentMethod: "credit_card",
  },
]

const DEFAULT_GATEWAY_CONFIGS: PaymentGatewayConfig[] = [
  {
    id: "kirvano",
    name: "Kirvano",
    isEnabled: true,
    apiKey: "",
    webhookUrl: "",
    color: "#6B7280",
  },
  {
    id: "cakto",
    name: "Cakto",
    isEnabled: true,
    apiKey: "",
    webhookUrl: "",
    color: "#4F46E5",
  },
  {
    id: "tibopay",
    name: "TiboPay",
    isEnabled: true,
    apiKey: "",
    webhookUrl: "",
    color: "#0EA5E9",
  },
  {
    id: "kiwify",
    name: "Kiwify",
    isEnabled: true,
    apiKey: "",
    webhookUrl: "",
    color: "#10B981",
  },
]

export function usePaymentGateways() {
  const [gatewayConfigs, setGatewayConfigs] = useState<PaymentGatewayConfig[]>(DEFAULT_GATEWAY_CONFIGS)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Obter ID do usuário autenticado
  useEffect(() => {
    const getUserId = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user?.id) {
          setUserId(session.user.id)
          console.log("DEBUG: User ID obtido:", session.user.id)
        } else {
          console.log("DEBUG: Usuário não autenticado")
        }
      } catch (error) {
        console.error("Erro ao obter ID do usuário:", error)
      }
    }

    getUserId()
  }, [])

  // Carregar dados quando o userId estiver disponível
  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  const loadData = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      console.log("DEBUG: Carregando dados para usuário:", userId)

      // Tentar carregar configurações
      const configs = await supabaseStorage.getGatewayConfigs(userId)
      if (configs.length > 0) {
        setGatewayConfigs(configs)
        console.log("DEBUG: Configurações carregadas do Supabase")
      } else {
        console.log("DEBUG: Usando configurações padrão")
        setGatewayConfigs(DEFAULT_GATEWAY_CONFIGS)
      }

      // Tentar carregar transações
      const loadedTransactions = await supabaseStorage.getTransactions(userId)
      if (loadedTransactions.length > 0) {
        setTransactions(loadedTransactions)
        console.log("DEBUG: Transações carregadas do Supabase:", loadedTransactions.length)
      } else {
        console.log("DEBUG: Usando transações de exemplo")
        setTransactions(SAMPLE_TRANSACTIONS)
        // Salvar transações de exemplo no Supabase para próximas vezes
        await supabaseStorage.saveTransactions(userId, SAMPLE_TRANSACTIONS)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      // Em caso de erro, usar dados de exemplo
      setGatewayConfigs(DEFAULT_GATEWAY_CONFIGS)
      setTransactions(SAMPLE_TRANSACTIONS)
    } finally {
      setIsLoading(false)
    }
  }

  const saveGatewayConfigs = async (configs: PaymentGatewayConfig[]) => {
    if (!userId) return false

    try {
      const success = await supabaseStorage.saveGatewayConfigs(userId, configs)
      if (success) {
        setGatewayConfigs(configs)
        console.log("DEBUG: Configurações salvas com sucesso")
      }
      return success
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      return false
    }
  }

  const addTransaction = async (transaction: PaymentTransaction) => {
    if (!userId) return false

    try {
      const newTransactions = [...transactions, transaction]
      const success = await supabaseStorage.saveTransactions(userId, newTransactions)
      if (success) {
        setTransactions(newTransactions)
        console.log("DEBUG: Transação adicionada com sucesso")
      }
      return success
    } catch (error) {
      console.error("Erro ao adicionar transação:", error)
      return false
    }
  }

  const getFilteredTransactions = useCallback(
    (filters: {
      gateway?: PaymentGatewayType
      status?: string | string[]
      period?: { from: Date; to: Date }
    }) => {
      let filtered = [...transactions]

      if (filters.gateway) {
        filtered = filtered.filter((t) => t.gatewayId === filters.gateway)
      }

      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status]
        filtered = filtered.filter((t) => statusArray.includes(t.status))
      }

      if (filters.period) {
        filtered = filtered.filter((t) => {
          const transactionDate = new Date(t.date)
          return transactionDate >= filters.period!.from && transactionDate <= filters.period!.to
        })
      }

      return filtered
    },
    [transactions],
  )

  const getConsolidatedSummary = useCallback(
    (period?: { from: Date; to: Date }): ConsolidatedSummary => {
      const filteredTransactions = period
        ? getFilteredTransactions({ period, status: "completed" })
        : transactions.filter((t) => t.status === "completed")

      const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
      const totalFees = filteredTransactions.reduce((sum, t) => sum + t.fees, 0)
      const netAmount = totalAmount - totalFees

      // Agrupar por gateway
      const gatewayMap = new Map<string, GatewaySummary>()

      filteredTransactions.forEach((transaction) => {
        const gatewayId = transaction.gatewayId
        if (!gatewayMap.has(gatewayId)) {
          gatewayMap.set(gatewayId, {
            gatewayId,
            totalAmount: 0,
            totalTransactions: 0,
            totalFees: 0,
            netAmount: 0,
            dailySummaries: [],
          })
        }

        const summary = gatewayMap.get(gatewayId)!
        summary.totalAmount += transaction.amount
        summary.totalTransactions += 1
        summary.totalFees += transaction.fees
        summary.netAmount += transaction.netAmount
      })

      // Criar resumos diários para cada gateway
      gatewayMap.forEach((summary) => {
        const gatewayTransactions = filteredTransactions.filter((t) => t.gatewayId === summary.gatewayId)
        const dailyMap = new Map<string, { totalAmount: number; netAmount: number; transactions: number }>()

        gatewayTransactions.forEach((transaction) => {
          const date = new Date(transaction.date).toISOString().split("T")[0]
          if (!dailyMap.has(date)) {
            dailyMap.set(date, { totalAmount: 0, netAmount: 0, transactions: 0 })
          }
          const daily = dailyMap.get(date)!
          daily.totalAmount += transaction.amount
          daily.netAmount += transaction.netAmount
          daily.transactions += 1
        })

        summary.dailySummaries = Array.from(dailyMap.entries()).map(([date, data]) => ({
          date,
          totalAmount: data.totalAmount,
          netAmount: data.netAmount,
          transactions: data.transactions,
        }))
      })

      return {
        totalAmount,
        totalTransactions: filteredTransactions.length,
        totalFees,
        netAmount,
        gatewaySummaries: Array.from(gatewayMap.values()),
      }
    },
    [transactions, getFilteredTransactions],
  )

  const importToFinance = useCallback(() => {
    try {
      // Simular importação para o módulo financeiro
      const completedTransactions = transactions.filter((t) => t.status === "completed")

      if (completedTransactions.length === 0) {
        return { success: true, count: 0, total: 0 }
      }

      const total = completedTransactions.reduce((sum, t) => sum + t.netAmount, 0)

      console.log("DEBUG: Importando para financeiro:", completedTransactions.length, "transações")

      return {
        success: true,
        count: completedTransactions.length,
        total,
      }
    } catch (error) {
      console.error("Erro ao importar para financeiro:", error)
      return { success: false, count: 0, total: 0 }
    }
  }, [transactions])

  const setupAutoSync = useCallback(() => {
    console.log("DEBUG: Configurando sincronização automática")

    const interval = setInterval(
      () => {
        console.log("DEBUG: Executando sincronização automática")
        // Aqui você pode adicionar lógica para sincronizar com APIs externas
      },
      5 * 60 * 1000,
    ) // 5 minutos

    return () => {
      console.log("DEBUG: Limpando sincronização automática")
      clearInterval(interval)
    }
  }, [])

  return {
    gatewayConfigs,
    transactions,
    isLoading,
    saveGatewayConfigs,
    addTransaction,
    getFilteredTransactions,
    getConsolidatedSummary,
    importToFinance,
    setupAutoSync,
    loadData,
  }
}
