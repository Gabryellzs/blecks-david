"use client"

import { useGatewayTransactions, type GatewayTransaction } from "@/lib/gateway-transactions-service"
import { useMemo } from "react"
import type { PaymentGatewayType } from "@/lib/payment-gateway-types" // Importar o tipo

export interface Sale {
  id: string
  commission: number
  gateway: PaymentGatewayType // Usar o tipo PaymentGatewayType
  created_at: string
  customer_name?: string
  product_name?: string
}

export function useSales() {
  const { transactions, isLoading, error, refreshTransactions } = useGatewayTransactions()

  const sales: Sale[] = useMemo(() => {
    return transactions.map((t: GatewayTransaction) => ({
      id: t.id,
      commission: t.net_amount || t.amount || 0,
      gateway: t.gateway_id || "unknown", // Garante que 'gateway' nunca seja nulo/undefined
      created_at: t.created_at,
      customer_name: t.customer_name,
      product_name: t.product_name,
    }))
  }, [transactions])

  return { sales, isLoading, error, refreshSales: refreshTransactions }
}
