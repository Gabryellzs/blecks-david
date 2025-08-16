import { supabase } from "./supabaseClient"
import type { PaymentGatewayType } from "./payment-gateway-types"

export interface UserWebhook {
  id: string
  user_id: string
  gateway_id: PaymentGatewayType
  webhook_name: string
  webhook_url: string
  created_at: string
  updated_at: string
}

export const userWebhookService = {
  async getWebhooksByUserId(userId: string): Promise<UserWebhook[]> {
    console.log("DEBUG: userWebhookService: Buscando webhooks para o usuário:", userId)
    const { data, error } = await supabase.from("user_webhooks").select("*").eq("user_id", userId)

    if (error) {
      console.error("Erro ao buscar webhooks do usuário:", error)
      throw error
    }
    console.log("DEBUG: userWebhookService: Webhooks encontrados:", data.length)
    return data as UserWebhook[]
  },

  async saveWebhook(
    userId: string,
    gatewayId: PaymentGatewayType,
    webhookName: string,
    webhookUrl: string,
  ): Promise<UserWebhook | null> {
    console.log("DEBUG: userWebhookService: Tentando salvar/atualizar webhook:", {
      userId,
      gatewayId,
      webhookName,
      webhookUrl,
    })

    // Tenta inserir, se houver conflito (user_id, gateway_id), tenta atualizar
    const { data, error } = await supabase
      .from("user_webhooks")
      .upsert(
        {
          user_id: userId,
          gateway_id: gatewayId,
          webhook_name: webhookName,
          webhook_url: webhookUrl,
        },
        { onConflict: "user_id, gateway_id" }, // Conflito na combinação de user_id e gateway_id
      )
      .select()

    if (error) {
      console.error("Erro ao salvar/atualizar webhook:", error)
      throw error
    }
    console.log("DEBUG: userWebhookService: Webhook salvo/atualizado com sucesso:", data[0])
    return data[0] as UserWebhook
  },
}
