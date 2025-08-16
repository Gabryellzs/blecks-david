// Tipos para integração com gateways de pagamento

export type PaymentGatewayType =
  | "kirvano"
  | "ticto"
  | "hotmart"
  | "monetizze"
  | "eduzz"
  | "pepper"
  | "braip"
  | "lastlink"
  | "disrupty"
  | "perfectpay"
  | "goatpay"
  | "tribopay"
  | "cakto"
  | "nuvemshop" // Novo gateway
  | "woocommerce" // Novo gateway
  | "loja_integrada" // Novo gateway
  | "cartpanda" // Novo gateway
  | "unknown" // Adicionar 'unknown' como um tipo válido

export interface PaymentGatewayConfig {
  id: PaymentGatewayType
  name: string
  enabled: boolean
  webhookUrl?: string
  apiKey?: string
  secretKey?: string
  color: string
  logo?: string
  // Adicione outros campos de configuração conforme necessário
}

export interface Transaction {
  id: string
  gateway: PaymentGatewayType
  amount: number
  currency: string
  status: "approved" | "pending" | "declined" | "refunded"
  timestamp: number
  productName?: string
  customerEmail?: string
  fees?: number
  // Adicione outros campos relevantes da transação
}

export interface GatewayDailySummary {
  date: string
  gatewayId: PaymentGatewayType
  totalAmount: number
  totalTransactions: number
  totalFees: number
  netAmount: number
}

export interface GatewaySummary {
  gatewayId: PaymentGatewayType
  totalAmount: number
  totalTransactions: number
  totalFees: number
  netAmount: number
  dailySummaries: GatewayDailySummary[]
}

export interface ConsolidatedSummary {
  totalAmount: number
  totalTransactions: number
  totalFees: number
  netAmount: number
  gatewaySummaries: GatewaySummary[]
}
