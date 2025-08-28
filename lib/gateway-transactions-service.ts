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
  status_raw?: string | null          // status original do banco (ex.: "refused")
  is_refused?: boolean                // <- flag calculado
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
  refusedTransactions: number
  refusedAmount: number
}

/* =========================
   Helpers de normalização
========================= */

const normalizeKey = (s?: string | null) =>
  (s ?? "").toLowerCase().trim().replace(/\s+/g, "_")

// — Abandonadas
const ABANDONED_STATUSES = new Set<string>([
  "abandoned",
  "abandoned_cart",
  "abandoned_checkout",
  "incomplete",
  "incomplete_expired",
  "expired",
  // "canceled",
])
const isAbandonedStatus = (status?: string | null) =>
  ABANDONED_STATUSES.has(normalizeKey(status))

// — Recusadas (status/event_type comuns)
const REFUSED_STATUSES = new Set<string>(["refused", "declined", "rejected"])
const REFUSED_EVENT_TYPES = new Set<string>([
  "refused",
  "declined",
  "rejected",
  "payment.refused",
  "payment_refused",
])

/** Detecta recusadas considerando status normalizado, status bruto e event_type */
const isRefusedByFields = (
  statusNorm?: string | null,
  statusRaw?: string | null,
  eventType?: string | null,
) => {
  const sNorm = normalizeKey(statusNorm)
  const sRaw = normalizeKey(statusRaw)
  const eType = normalizeKey(eventType)
  return REFUSED_STATUSES.has(sNorm) || REFUSED_STATUSES.has(sRaw) || REFUSED_EVENT_TYPES.has(eType)
}

// Normaliza status/event_type do banco para enum interno
const normalizeRawStatus = (
  statusFromDb: string | null,
  eventTypeFromDb: string | null,
): GatewayTransaction["status"] => {
  const statusLower = normalizeKey(statusFromDb)
  const eventTypeLower = normalizeKey(eventTypeFromDb)

  if (["completed", "approved", "paid", "success", "payment.success"].includes(statusLower)) {
    return "completed"
  }
  // Recusadas também entram como "failed" no agregado padrão
  if (
    ["failed", "error", "declined", "rejected", "payment.failed", "refused"].includes(statusLower) ||
    REFUSED_EVENT_TYPES.has(eventTypeLower)
  ) {
    return "failed"
  }
  if (["refunded", "cancelled", "canceled", "payment.refunded"].includes(statusLower)) {
    return "refunded"
  }
  if (
    ["checkout.abandonment", "checkout_abandonment"].includes(statusLower) ||
    ["checkout.abandonment", "checkout_abandonment"].includes(eventTypeLower) ||
    isAbandonedStatus(statusLower)
  ) {
    return "abandoned"
  }
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

        if (session?.user?.id) setUserId(session.user.id)
        else setUserId("demo-user")
      } catch (error) {
        console.error("❌ Erro ao obter usuário:", error)
        setUserId("demo-user")
      }
    }
    getUserId()
  }, [])

  // Buscar dados
  const fetchTransactions = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from("gateway_transactions")
        .select("*, product_price")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(0, 999999)

      if (queryError) throw queryError

      const mappedData = mapTransactions(data || [], userId)
      setTransactions(mappedData)

      // DEBUG: quantas recusadas mapeadas?
      const refusedCount = mappedData.filter((t) => t.is_refused).length
      console.log(`[GATEWAY] Mapeadas: ${mappedData.length} | Recusadas detectadas: ${refusedCount}`)

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

    fetchTransactions()

    const channelName = `gateway_transactions_${userId}_${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gateway_transactions" },
        (payload) => {
          const payloadUserId = (payload as any).new?.user_id || (payload as any).old?.user_id
          if (payloadUserId === userId || userId === "demo-user") {
            fetchTransactions()
            setRefreshCount((prev) => prev + 1)
          }
        },
      )
      .subscribe((status, err) => {
        setRealtimeStatus(status)
        if (err) console.error("❌ Erro na subscription:", err)
      })

    setRealtimeChannel(channel)

    return () => {
      if (channel) supabase.removeChannel(channel)
      setRealtimeStatus("CLOSED")
    }
  }, [userId, fetchTransactions])

  // Refresh manual
  const manualRefresh = useCallback(async () => {
    setRefreshCount((prev) => prev + 1)
    setTransactions([])
    setError(null)
    await fetchTransactions()
  }, [fetchTransactions])

  // Mapear dados do Supabase → GatewayTransaction
  const mapTransactions = (data: any[], currentUserId: string): GatewayTransaction[] => {
    return data.map((item) => {
      const normalizedStatus = normalizeRawStatus(item.status, item.event_type)
      const statusRaw = item.status ?? null

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
        net_amount:
          Number.parseFloat(item.net_amount?.toString() || item.amount?.toString() || "0") || null,
        event_type: item.event_type || null,
        status: normalizedStatus,
        status_raw: statusRaw,
        is_refused: isRefusedByFields(normalizedStatus, statusRaw, item.event_type), // <- flag
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

      return filtered
    },
    [transactions],
  )

  const getStats = useCallback(
    (filters?: { gateway?: PaymentGatewayType; period?: { from: Date; to: Date } }): GatewayStats => {
      let filteredTransactions = [...transactions]

      if (filters?.gateway) {
        filteredTransactions = filteredTransactions.filter((t) => t.gateway_id === filters.gateway)
      }

      if (filters?.period) {
        filteredTransactions = filteredTransactions.filter((t) => {
          const dt = new Date(t.created_at)
          return dt >= filters.period!.from && dt <= filters.period!.to
        })
      }

      // DEBUG: ver status_raw presentes após filtros
      const rawStatusCounts = filteredTransactions.reduce<Record<string, number>>((acc, t) => {
        const k = normalizeKey(t.status_raw)
        acc[k] = (acc[k] || 0) + 1
        return acc
      }, {})
      console.log("[GATEWAY] status_raw após filtros:", rawStatusCounts)

      // Quebra por status
      const completedTransactions = filteredTransactions.filter((t) => normalizeKey(t.status) === "completed")
      const pendingTransactions = filteredTransactions.filter((t) => normalizeKey(t.status) === "pending")
      const failedTransactions = filteredTransactions.filter((t) => normalizeKey(t.status) === "failed")
      const refundedTransactions = filteredTransactions.filter((t) => normalizeKey(t.status) === "refunded")
      const abandonedTransactions = filteredTransactions.filter((t) => isAbandonedStatus(t.status))
      const refusedTransactions = filteredTransactions.filter((t) => t.is_refused) // usa o flag

      const totalRevenue = completedTransactions.reduce((s, t) => s + (t.amount || 0), 0)
      const totalTransactions = completedTransactions.length
      const totalFees = completedTransactions.reduce((s, t) => s + (t.fees || 0), 0)

      const netAmount = completedTransactions.reduce((s, t) => s + (t.net_amount || t.amount || 0), 0)
      const pendingAmount = pendingTransactions.reduce((s, t) => s + (t.amount || 0), 0)
      const failedAmount = failedTransactions.reduce((s, t) => s + (t.amount || 0), 0)
      const refundedAmount = refundedTransactions.reduce((s, t) => s + (t.amount || 0), 0)
      const abandonedAmount = abandonedTransactions.reduce((s, t) => s + (t.amount || 0), 0)
      const refusedAmount = refusedTransactions.reduce((s, t) => s + (t.amount || 0), 0)

      // DEBUG: contagens finais
      console.log("[GATEWAY] Counts => completed:", completedTransactions.length,
        "| pending:", pendingTransactions.length,
        "| failed:", failedTransactions.length,
        "| refunded:", refundedTransactions.length,
        "| abandoned:", abandonedTransactions.length,
        "| refused:", refusedTransactions.length)

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
        refusedTransactions: refusedTransactions.length,
        refusedAmount,
      }

      return stats
    },
    [transactions],
  )

  // Teste de realtime (opcional)
  const testRealtimeConnection = useCallback(async () => {
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

      setTimeout(async () => {
        if (data && data[0]) {
          await supabase.from("gateway_transactions").delete().eq("id", data[0].id)
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
