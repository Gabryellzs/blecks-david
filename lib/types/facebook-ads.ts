export interface FacebookAdAccount {
  id: string
  name: string
  account_status: number // 1 = ACTIVE, 2 = DISABLED, etc.
  currency: string
  timezone_name: string
}

export interface FacebookCampaignInsight {
  spend: string // Valor em string, precisa ser convertido para number
}

export interface FacebookCampaign {
  id: string
  name: string
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED" | string
  daily_budget?: string // Opcional
  insights?: FacebookCampaignInsight[] // Opcional, pode não vir se não houver gasto
}
