import type { FacebookAdAccount, FacebookCampaign } from "./types/facebook-ads"

/** Utilitário para tentar ler JSON de erro sem quebrar */
async function tryJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/** ============== CONTAS ============== */
export async function getFacebookAdAccounts(): Promise<FacebookAdAccount[]> {
  const response = await fetch("/api/facebook-ads/accounts")
  if (!response.ok) {
    const errorData = await tryJson(response)
    throw new Error(errorData?.error || "Falha ao buscar contas de anúncio do Facebook.")
  }
  return response.json()
}

/** ============== CAMPANHAS ============== */
export async function getFacebookCampaigns(adAccountId: string): Promise<FacebookCampaign[]> {
  // a sua rota de campanhas já aceita ad_account_id com prefixo act_, então mantive assim
  const response = await fetch(`/api/facebook-ads/campaigns?ad_account_id=${adAccountId}`)
  if (!response.ok) {
    const errorData = await tryJson(response)
    throw new Error(errorData?.error || "Falha ao buscar campanhas do Facebook.")
  }
  return response.json()
}

/** ============== CONJUNTOS (AD SETS) ============== */
export type FacebookAdSet = {
  id: string
  name: string
  status: string
  effective_status?: string
  campaign_id?: string | null
  daily_budget?: number | string | null
  optimization_goal?: string | null
  billing_event?: string | null
  start_time?: string | null
  end_time?: string | null
}

/**
 * Busca Ad Sets da conta informada.
 * Aceita `accountId` com ou sem prefixo `act_`.
 * A rota aceita `uuid` opcional pra filtrar o token do usuário (platform_tokens.user_id).
 */
export async function getFacebookAdSets(
  accountId: string,
  uuid?: string
): Promise<FacebookAdSet[]> {
  const cleanId = accountId.replace(/^act_/, "") // aceita "act_123" e "123"

  const qs = new URLSearchParams({ accountId: cleanId })
  if (uuid) qs.set("uuid", uuid) // <-- importante pro filtro por usuário logado

  const res = await fetch(`/api/facebook-ads/adsets?${qs.toString()}`)
  if (!res.ok) {
    const details = await tryJson(res)
    throw new Error(
      `Erro ao carregar conjuntos de anúncios: ${res.status} ${details ? JSON.stringify(details) : ""}`
    )
  }

  const data = await res.json()
  const items = Array.isArray(data?.data) ? data.data : []

  // Mapeia com campos planos (sem nested campaign{})
  return items.map((item: any): FacebookAdSet => ({
    id: item.id,
    name: item.name,
    status: item.status,
    effective_status: item.effective_status,
    campaign_id: item.campaign_id ?? null,
    daily_budget: item.daily_budget ?? null,
    optimization_goal: item.optimization_goal ?? null,
    billing_event: item.billing_event ?? null,
    start_time: item.start_time ?? null,
    end_time: item.end_time ?? null,
  }))
}

/** ============== ANÚNCIOS (ADS) ============== */
export type FacebookAd = {
  id: string
  name: string
  status: string
  effective_status?: string
  adset_id?: string | null
  campaign_id?: string | null
  creative_id?: string | null
  creative_name?: string | null
  updated_time?: string | null
  created_time?: string | null
}

/**
 * Busca Ads da conta informada.
 * Aceita `accountId` com ou sem `act_`.
 * A rota aceita `uuid` opcional pra filtrar o token do usuário (platform_tokens.user_id).
 */
export async function getFacebookAds(
  accountId: string,
  uuid?: string
): Promise<FacebookAd[]> {
  const cleanId = accountId.replace(/^act_/, "")

  const qs = new URLSearchParams({ accountId: cleanId })
  if (uuid) qs.set("uuid", uuid)

  const res = await fetch(`/api/facebook-ads/ads?${qs.toString()}`)
  if (!res.ok) {
    const details = await tryJson(res)
    throw new Error(
      `Erro ao carregar anúncios: ${res.status} ${details ? JSON.stringify(details) : ""}`
    )
  }

  const data = await res.json()
  const items = Array.isArray(data?.data) ? data.data : []

  return items.map((x: any): FacebookAd => ({
    id: x.id,
    name: x.name,
    status: x.status,
    effective_status: x.effective_status,
    adset_id: x.adset_id ?? null,
    campaign_id: x.campaign_id ?? null,
    creative_id: x.creative?.id ?? x.creative_id ?? null,
    creative_name: x.creative?.name ?? null,
    updated_time: x.updated_time ?? null,
    created_time: x.created_time ?? null,
  }))
}

/** ============== ATUALIZAÇÕES ============== */
export async function updateFacebookCampaignStatus(
  campaignId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<{ success: boolean; newStatus: string }> {
  const response = await fetch(`/api/facebook-ads/campaigns/${campaignId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    const errorData = await tryJson(response)
    throw new Error(errorData?.error || "Falha ao atualizar status da campanha do Facebook.")
  }
  return response.json()
}

export async function updateFacebookAdAccountStatus(
  adAccountId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<{ success: boolean; newStatus: string }> {
  const response = await fetch(`/api/facebook-ads/ad-accounts/${adAccountId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    const errorData = await tryJson(response)
    throw new Error(errorData?.error || "Falha ao atualizar status da conta de anúncio do Facebook.")
  }
  return response.json()
}
