"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "./supabase"
import type { PaymentGatewayType } from "./payment-gateway-types"
import type { RealtimeChannel } from "@supabase/supabase-js"

/* =========================
   Tipos
========================= */

export interface GatewayTransaction {
  id: string
  user_id: string
  transaction_id: string
  gateway_id: PaymentGatewayType
  amount: number | null
  currency?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  product_name?: string | null
  product_price?: number | null
  payment_method?: string | null
  fee?: number | null
  net_amount?: number | null
  event_type?: string | null
  status: "completed" | "pending" | "failed" | "refunded" | "abandoned" | "unknown"
  raw_payload?: any | null
  created_at: string
  updated_at?: string | null
  updated_by?: string | null
  fees?: number | null
}

export interface GatewayStats {
  totalRevenue: number
  totalTransactions: number
  totalFees: number
  netAmount: number
  pendingAmount: number
  failedAmount: number
  failedTransactions: number
  totalAbandonedTransactions: number
  abandonedAmount: number
  completedTransactions: number
  pendingTransactions: number
  totalRefunds: number
  refundedAmount: number
}

/* =========================
   Helpers de normalização
========================= */

// Normalização “simples” para comparar chaves de status
const normalizeKey = (s?: string) => (s ?? "").toLowerCase().trim().replace(/\s+/g, "_")

// Variações comuns para “não concluídas” em gateways (Kirvano, etc.)
const ABANDONED_STATUSES = new Set<string>([
  "abandoned",
  "abandoned_cart",
  "abandoned_checkout",
  "incomplete",
  "incomplete_expired",
  "expired",
  // "canceled", // habilite se quiser contar canceladas como não-concluídas
])

export const isAbandonedStatus = (status?: string) => ABANDONED_STATUSES.has(normalizeKey(status))

// Normaliza status/event_type vindos do banco para o enum interno
const normalizeRawStatus = (
  statusFromDb: string | null,
  eventTypeFromDb: string | null,
): GatewayTransaction["status"] => {
  const statusLower = (statusFromDb ?? "").toLowerCase()
  const eventTypeLower = (eventTypeFromDb ?? "").toLowerCase()

  console.log(`[normalizeRawStatus] Input - status: '${statusFromDb}', event_type: '${eventTypeFromDb}'`)

  if (["completed", "approved", "paid", "success", "payment.success"].includes(statusLower)) {
    console.log(`[normalizeRawStatus] Output: completed (from status)`)
    return "completed"
  }
  if (["failed", "error", "declined", "rejected", "payment.failed"].includes(statusLower)) {
    console.log(`[normalizeRawStatus] Output: failed (from status)`)
    return "failed"
  }
  if (["refunded", "cancelled", "canceled", "payment.refunded"].includes(statusLower)) {
    console.log(`[normalizeRawStatus] Output: refunded (from status)`)
    return "refunded"
  }
  // Abandono pode vir no status OU no event_type
  if (
    ["checkout.abandonment", "checkout_abandonment"].includes(statusLower) ||
    ["checkout.abandonment", "checkout_abandonment"].includes(eventTypeLower)
  ) {
    console.log(`[normalizeRawStatus] Output: abandoned (from status or event_type)`)
    return "abandoned"
  }

  // Como fallback, se statusLower bater com variações conhecidas de abandonadas
  if (isAbandonedStatus(statusLower)) {
    console.log(`[normalizeRawStatus] Output: abandoned (from variants)`)
    return "abandoned"
  }

  console.log(`[normalizeRawStatus] Output: unknown (default)`)
  return "unknown"
}

/* =========================
   Hook principal
========================= */

export function useGatewayTransactions() {
  const [transactions, setTransactions] = useState<GatewayTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [refreshCount, setRefreshCount] = useState(0)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<string>("CLOSED")

  // Obter ID do usuário autenticado
  useEffect(() => {
    const getUserId = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Erro ao obter sessão:", sessionError)
          setUserId("demo-user")
          return
        }

        if (session?.user?.id) {
          setUserId(session.user.id)
          console.log("✅ Usuário autenticado:", session.user.id)
        } else {
          setUserId("demo-user")
          console.log("⚠️ Usando usuário demo")
        }
      } catch (error) {
        console.error("❌ Erro ao obter usuário:", error)
        setUserId("demo-user")
      }
    }

    getUserId()
  }, [])

  // Função principal para buscar dados
  const fetchTransactions = useCallback(async () => {
    if (!userId) return

    console.log("🚀 Buscando transações para usuário:", userId)
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from("gateway_transactions")
        .select("*, product_price")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1000)

      if (queryError) throw queryError

      console.log("🚀 Dados brutos do Supabase:", data?.length || 0, "registros")

      if (data && data.length > 0) {
        const statusCount = data.reduce((acc, item) => {
          const s = item.status || "unknown"
          acc[s] = (acc[s] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log("🚀 Status encontrados no Supabase:", statusCount)
      }

      const mappedData = mapTransactions(data || [], userId)
      setTransactions(mappedData)
      console.log("✅ Dados mapeados e carregados:", mappedData.length, "transações")

      const mappedStatusCount = mappedData.reduce((acc, item) => {
        const s = item.status || "unknown"
        acc[s] = (acc[s] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      console.log("✅ Status após mapeamento:", mappedStatusCount)

      setLastUpdate(new Date())
    } catch (error) {
      console.error("❌ Erro ao buscar dados do gateway:", error)
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Realtime
  useEffect(() => {
    if (!userId) return

    console.log("🔧 Configurando Supabase Realtime para usuário:", userId)
    fetchTransactions()

    const channelName = `gateway_transactions_${userId}_${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gateway_transactions",
        },
        (payload) => {
          console.log("🔄 Mudança detectada na tabela gateway_transactions:", payload)
          const payloadUserId = payload.new?.user_id || payload.old?.user_id
          if (payloadUserId === userId || userId === "demo-user") {
            console.log("✅ Mudança relevante, atualizando dados...")
            fetchTransactions()
            setRefreshCount((prev) => prev + 1)
          }
        },
      )
      .subscribe((status, err) => {
        console.log("📡 Status da subscription realtime:", status)
        setRealtimeStatus(status)
        if (err) console.error("❌ Erro na subscription:", err)
      })

    setRealtimeChannel(channel)

    return () => {
      console.log("🧹 Limpando subscription realtime")
      if (channel) supabase.removeChannel(channel)
      setRealtimeStatus("CLOSED")
    }
  }, [userId, fetchTransactions])

  // Refresh manual
  const manualRefresh = useCallback(async () => {
    console.log("🔄 Refresh manual iniciado.")
    setRefreshCount((prev) => prev + 1)
    setTransactions([])
    setError(null)
    await fetchTransactions()
    console.log("✅ Refresh manual concluído.")
  }, [fetchTransactions])

  // Mapear dados do Supabase → GatewayTransaction
  const mapTransactions = (data: any[], currentUserId: string): GatewayTransaction[] => {
    return data.map((item) => {
      const normalizedStatus = normalizeRawStatus(item.status, item.event_type)

      const tx: GatewayTransaction = {
        id: item.id,
        user_id: item.user_id || currentUserId,
        transaction_id: item.transaction_id,
        gateway_id: (item.gateway_id || "unknown") as PaymentGatewayType,
        amount: Number.parseFloat(item.amount?.toString() || "0") || null,
        currency: item.currency || "BRL",
        customer_name: item.customer_name || "N/A",
        customer_email: item.customer_email || "N/A",
        customer_phone: item.customer_phone || null,
        product_name: item.product_name || "N/A",
        product_price: Number.parseFloat(item.product_price?.toString() || "0") || null,
        payment_method: item.payment_method || "unknown",
        fee: Number.parseFloat(item.fee?.toString() || "0") || null,
        net_amount: Number.parseFloat(item.net_amount?.toString() || item.amount?.toString() || "0") || null,
        event_type: item.event_type || null,
        status: normalizedStatus,
        raw_payload: item.raw_payload || null,
        created_at: item.created_at,
        updated_at: item.updated_at || null,
        updated_by: item.updated_by || null,
        fees: Number.parseFloat(item.fees?.toString() || "0") || null,
      }

      return tx
    })
  }

  /* =========================
     Filtros e Stats
  ========================= */

  const getFilteredTransactions = useCallback(
    (filters: {
      gateway?: PaymentGatewayType
      status?: string | string[]
      period?: { from: Date; to: Date }
      search?: string
    }) => {
      console.log("[getFilteredTransactions] Applying filters:", filters)
      let filtered = [...transactions]

      if (filters.gateway) {
        filtered = filtered.filter((t) => t.gateway_id === filters.gateway)
      }

      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status]
        filtered = filtered.filter((t) => statusArray.includes(t.status))
      }

      if (filters.period) {
        filtered = filtered.filter((t) => {
          const dt = new Date(t.created_at)
          return dt >= filters.period!.from && dt <= filters.period!.to
        })
      }

      if (filters.search) {
        const q = filters.search.toLowerCase()
        filtered = filtered.filter(
          (t) =>
            t.customer_name?.toLowerCase().includes(q) ||
            t.customer_email?.toLowerCase().includes(q) ||
            t.product_name?.toLowerCase().includes(q) ||
            t.transaction_id.toLowerCase().includes(q),
        )
      }

      console.log(`[getFilteredTransactions] Found ${filtered.length} transactions after filtering.`)
      return filtered
    },
    [transactions],
  )

  const getStats = useCallback(
    (filters?: { gateway?: PaymentGatewayType; period?: { from: Date; to: Date } }): GatewayStats => {
      console.log("📈 Calculando stats para gateway:", filters?.gateway || "all")
      console.log("📈 Total de transações carregadas:", transactions.length)

      let filteredTransactions = [...transactions]

      if (filters?.gateway) {
        filteredTransactions = filteredTransactions.filter((t) => t.gateway_id === filters.gateway)
        console.log(`📈 Filtrado por ${filters.gateway}: ${filteredTransactions.length} transações`)
      }

      if (filters?.period) {
        const original = filteredTransactions.length
        filteredTransactions = filteredTransactions.filter((t) => {
          const dt = new Date(t.created_at)
          return dt >= filters.period!.from && dt <= filters.period!.to
        })
        console.log(`📈 Filtrado por período: ${original} -> ${filteredTransactions.length} transações`)
      }

      // Quebra por status usando helpers
      const completedTransactions = filteredTransactions.filter((t) => normalizeKey(t.status) === "completed")
      const pendingTransactions = filteredTransactions.filter((t) => normalizeKey(t.status) === "pending")
      const failedTransactions = filteredTransactions.filter((t) => normalizeKey(t.status) === "failed")
      const refundedTransactions = filteredTransactions.filter((t) => normalizeKey(t.status) === "refunded")
      const abandonedTransactions = filteredTransactions.filter((t) => isAbandonedStatus(t.status))

      // Debug: contagem por status bruto normalizado
      const statusCounts = filteredTransactions.reduce<Record<string, number>>((acc, t) => {
        const s = normalizeKey(t.status)
        acc[s] = (acc[s] || 0) + 1
        return acc
      }, {})
      console.log("Status counts:", statusCounts)
      console.log("Abandoned detected via helper:", abandonedTransactions.length)

      console.log("📈 Breakdown por status:")
      console.log("  - Completed:", completedTransactions.length)
      console.log("  - Pending:", pendingTransactions.length)
      console.log("  - Failed:", failedTransactions.length)
      console.log("  - Refunded:", refundedTransactions.length)
      console.log("  - Abandoned:", abandonedTransactions.length)

      const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const totalTransactions = completedTransactions.length

      console.log("📈 RESULTADO FINAL:")
      console.log("  - Total de vendas (completed):", totalTransactions)
      console.log("  - Receita total:", totalRevenue)

      const totalFees = completedTransactions.reduce((sum, t) => sum + (t.fees || 0), 0)

      const netAmount = completedTransactions.reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0)
      const pendingAmount = pendingTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const failedAmount = failedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const refundedAmount = refundedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const abandonedAmount = abandonedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)

      const stats: GatewayStats = {
        totalRevenue,
        totalTransactions,
        totalFees,
        netAmount,
        pendingAmount,
        failedAmount,
        failedTransactions: failedTransactions.length,
        completedTransactions: completedTransactions.length,
        pendingTransactions: pendingTransactions.length,
        totalRefunds: refundedTransactions.length,
        refundedAmount,
        totalAbandonedTransactions: abandonedTransactions.length,
        abandonedAmount,
      }

      console.log("📈 Stats finais calculadas:", {
        gateway: filters?.gateway || "all",
        receita: totalRevenue,
        transacoesConcluidas: totalTransactions,
        taxas: totalFees,
        liquido: netAmount,
        reembolsos: refundedAmount,
        abandonadas: abandonedAmount,
      })

      return stats
    },
    [transactions],
  )

  // Teste de realtime (opcional)
  const testRealtimeConnection = useCallback(async () => {
    console.log("🧪 Testando conexão realtime...")
    try {
      const testTransaction = {
        user_id: userId,
        transaction_id: `test_${Date.now()}`,
        gateway_id: "kirvano" as PaymentGatewayType,
        amount: 1.0,
        customer_name: "Teste Realtime",
        customer_email: "teste@realtime.com",
        product_name: "Produto Teste",
        status: "completed",
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("gateway_transactions").insert([testTransaction]).select()
      if (error) {
        console.error("❌ Erro ao inserir transação de teste:", error)
        return false
      }
      console.log("✅ Transação de teste inserida:", data)

      setTimeout(async () => {
        if (data && data[0]) {
          await supabase.from("gateway_transactions").delete().eq("id", data[0].id)
          console.log("🧹 Transação de teste removida")
        }
      }, 5000)

      return true
    } catch (error) {
      console.error("❌ Erro no teste de realtime:", error)
      return false
    }
  }, [userId])

  return {
    transactions,
    isLoading,
    error,
    lastUpdate,
    refreshCount,
    refreshTransactions: manualRefresh,
    getStats,
    getFilteredTransactions,
    realtimeStatus,
    testRealtimeConnection,
  }
}
