import { z } from "zod"

// Define o esquema Zod para os dados de venda
export const saleSchema = z.object({
  user_id: z.string().uuid("ID de usuário inválido."), // ID do usuário Supabase ao qual a venda está vinculada
  email: z.string().email("Formato de e-mail inválido."),
  phone: z.string().optional().nullable(),
  buyer_name: z.string().optional().nullable(),
  product: z.string().min(1, "Nome do produto é obrigatório."),
  amount: z.number().positive("Valor deve ser um número positivo."),
  status: z.string().min(1, "Status é obrigatório."),
  transaction_id: z.string().min(1, "ID da transação é obrigatório."),
  event_type: z.string().min(1, "Tipo de evento é obrigatório."),
})

// Tipo TypeScript inferido do esquema Zod
export type SalePayload = z.infer<typeof saleSchema>

// Tipo para a venda salva no banco de dados (inclui campos gerados pelo DB)
export interface Sale {
  id: string
  user_id: string
  email: string
  phone: string | null
  buyer_name: string | null
  product: string
  amount: number
  status: string
  transaction_id: string
  event_type: string
  created_at: string
}
