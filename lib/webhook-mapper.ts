import type { PaymentTransaction, PaymentGatewayType } from "./payment-gateway-types"

// Esta função será responsável por mapear os dados brutos do webhook
// para o formato PaymentTransaction esperado pelo seu sistema.
// Você precisará expandir esta função para cada gateway.
export function mapWebhookToPaymentTransaction(gatewayId: PaymentGatewayType, payload: any): PaymentTransaction | null {
  switch (gatewayId) {
    case "kiwify":
      // Exemplo de mapeamento para Kiwify (baseado em uma estrutura hipotética)
      // VOCÊ PRECISARÁ AJUSTAR ISSO CONFORME A DOCUMENTAÇÃO REAL DA KIWIFY
      if (payload.event === "transaction_status_updated") {
        const transaction = payload.data
        return {
          id: transaction.id,
          gatewayId: "kiwify",
          amount: Number.parseFloat(transaction.amount), // Certifique-se de que é um número
          currency: transaction.currency || "BRL",
          status: transaction.status === "approved" ? "completed" : transaction.status, // Mapear status
          customerName: transaction.customer?.name || "N/A",
          customerEmail: transaction.customer?.email || "N/A",
          productName: transaction.product?.name || "N/A",
          productId: transaction.product?.id || "N/A",
          date: new Date(transaction.created_at).toISOString(), // Data no formato ISO
          paymentMethod: transaction.payment_method || "N/A",
          fee: Number.parseFloat(transaction.fee || "0"),
          netAmount: Number.parseFloat(transaction.net_amount || "0"),
          metadata: payload, // Salva o payload completo para depuração
        }
      }
      break
    case "kirvano":
      // TODO: Implementar mapeamento para Kirvano
      console.warn("Mapeamento para Kirvano não implementado.")
      break
    case "cakto":
      // TODO: Implementar mapeamento para Cakto
      console.warn("Mapeamento para Cakto não implementado.")
      break
    case "tibopay":
      // TODO: Implementar mapeamento para TiboPay
      console.warn("Mapeamento para TiboPay não implementado.")
      break
    default:
      console.warn(`Gateway desconhecido: ${gatewayId}`)
  }
  return null
}
