import { z } from "zod"

export interface WebhookEvent {
  id: string
  type: string
  data: any
  created_at: string
}

export const webhookEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  data: z.any(),
  created_at: z.string().datetime(),
})
