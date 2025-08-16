// Tipos para o sistema de atualizações
export interface AppUpdate {
  id: string
  title: string
  description: string
  version: string
  importance: "low" | "medium" | "high" | "critical"
  created_at: string
  features?: string[]
  image_url?: string
  action_url?: string
  action_text?: string
}

export interface UserSeenUpdate {
  id: string
  user_id: string
  update_id: string
  seen_at: string
}

export interface UpdatesState {
  updates: AppUpdate[]
  loading: boolean
  error: string | null
}
