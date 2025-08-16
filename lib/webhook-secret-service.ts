import { supabase } from "./supabaseClient"
import type { PaymentGatewayType } from "./payment-gateway-types"

export interface WebhookSecret {
  id: string
  user_id: string
  gateway_id: PaymentGatewayType
  secret_key: string
  created_at: string
  updated_at: string
}

export const webhookSecretService = {
  async getSecretByUserIdAndGateway(userId: string, gatewayId: PaymentGatewayType): Promise<WebhookSecret | null> {
    console.log("DEBUG: webhookSecretService: Buscando chave secreta para:", { userId, gatewayId })
    const { data, error } = await supabase
      .from("webhook_secrets")
      .select("*")
      .eq("user_id", userId)
      .eq("gateway_id", gatewayId)
      .single() // Espera apenas um resultado

    if (error && error.code !== "PGRST116") {
      // PGRST116 é "No rows found", que é esperado se não houver chave
      console.error("Erro ao buscar chave secreta do webhook:", error)
      throw error
    }
    console.log("DEBUG: webhookSecretService: Chave secreta encontrada:", data ? "Sim" : "Não")
    return data as WebhookSecret | null
  },

  async saveSecret(userId: string, gatewayId: PaymentGatewayType, secretKey: string): Promise<WebhookSecret | null> {
    console.log("DEBUG: webhookSecretService: Tentando salvar/atualizar chave secreta:", {
      userId,
      gatewayId,
      secretKey: "********", // Não logar a chave real
    })

    const { data, error } = await supabase
      .from("webhook_secrets")
      .upsert(
        {
          user_id: userId,
          gateway_id: gatewayId,
          secret_key: secretKey,
        },
        { onConflict: "user_id, gateway_id" }, // Conflito na combinação de user_id e gateway_id
      )
      .select()

    if (error) {
      console.error("Erro ao salvar/atualizar chave secreta:", error)
      throw error
    }
    console.log("DEBUG: webhookSecretService: Chave secreta salva/atualizada com sucesso.")
    return data[0] as WebhookSecret
  },
}
