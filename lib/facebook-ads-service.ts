import type { FacebookAdAccount, FacebookCampaign } from "./types/facebook-ads"

/* ========= Helpers ========= */
async function tryJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}
const withAct  = (id: string) => (id?.startsWith("act_") ? id : `act_${id}`)
const stripAct = (id: string) => (id || "").replace(/^act_/, "")

/* ========= CONTAS ========= */
export async function getFacebookAdAccounts(): Promise<FacebookAdAccount[]> {
  const response = await fetch("/api/facebook-ads/accounts", { credentials: "include" })
  if (!response.ok) {
    const errorData = await tryJson(response)
    throw new Error(errorData?.error || "Falha ao buscar contas de anúncio do Facebook.")
  }
  return response.json()
}

/* ========= CAMPANHAS (sem insights) ========= */
export async function getFacebookCampaigns(
  adAccountId: string
): Promise<FacebookCampaign[]> {
  const response = await fetch(
    `/api/facebook-ads/campaigns?ad_account_id=${encodeURIComponent(withAct(adAccountId))}`,
    { credentials: "include" }
  )
  if (!response.ok) {
    const errorData = await tryJson(response)
    throw new Error(errorData?.error || "Falha ao buscar campanhas do Facebook.")
  }
  return response.json()
}

/* ========= CAMPANHAS + INSIGHTS (normalizado para o grid) ========= */
export type CampaignRow = {
  id: string
  name: string
  status: string
  spend: number
  resultLabel: string
  results: number
  roas?: number | null
  cost_per_result?: number | null
  cpm?: number | null
  inline_link_clicks?: number | null
  cpc?: number | null
  ctr?: number | null
}

export async function getFacebookCampaignsWithInsights(
  adAccountId: string,
  uuid?: string,
  datePreset: string = "last_7d"
): Promise<CampaignRow[]> {
  const qs = new URLSearchParams({ ad_account_id: withAct(adAccountId) })
  if (uuid) qs.set("uuid", uuid)
  if (datePreset) qs.set("date_preset", datePreset)

  const res = await fetch(`/api/facebook-ads/campaigns/insights?${qs.toString()}`, {
    credentials: "include",
  })
  if (!res.ok) {
    const details = await tryJson(res)
    throw new Error(
      `Erro ao buscar campanhas com insights: ${res.status} ${details ? JSON.stringify(details) : ""}`
    )
  }

  const payload = await res.json()
  const arr = Array.isArray(payload?.data) ? payload.data : []

  return arr.map((c: any): CampaignRow => {
    const insight = Array.isArray(c.insights?.data) ? c.insights.data[0] : c.insights || null
    const spend = insight ? Number(insight.spend || 0) : 0

    const actions: any[] = insight?.actions || []
    const actionValues: any[] = insight?.action_values || []
    const cpat: any[] = insight?.cost_per_action_type || []

    const findAction = (types: string[]) =>
      actions.find(a => types.includes(a.action_type)) || null

    const primary =
      findAction(["purchase", "omni_purchase", "offsite_conversion.purchase"]) ||
      findAction(["lead"]) ||
      findAction(["messaging_conversation_started_7d"]) ||
      findAction(["link_click"])

    const resultLabel =
      primary?.action_type === "purchase" ||
      primary?.action_type === "omni_purchase" ||
      primary?.action_type === "offsite_conversion.purchase"
        ? "Compras"
        : primary?.action_type === "lead"
        ? "Leads"
        : primary?.action_type?.includes("messaging")
        ? "Conversas por mensagem"
        : primary?.action_type === "link_click"
        ? "Cliques no link"
        : "Resultados"

    const results = primary ? Number(primary.value || 0) : 0

    const valueRow =
      actionValues.find(a =>
        ["purchase", "omni_purchase", "offsite_conversion.purchase"].includes(a.action_type)
      ) || null
    const roas = valueRow ? (spend > 0 ? Number(valueRow.value || 0) / spend : null) : null

    const cprRow = primary ? cpat.find(a => a.action_type === primary.action_type) : null
    const cost_per_result = cprRow ? Number(cprRow.value || 0) : null

    return {
      id: c.id,
      name: c.name,
      status: c.status,
      spend,
      resultLabel,
      results,
      roas,
      cost_per_result,
      cpm: insight ? Number(insight.cpm || 0) : null,
      inline_link_clicks: insight ? Number(insight.inline_link_clicks || 0) : null,
      cpc: insight ? Number(insight.cpc || 0) : null,
      ctr: insight ? Number(insight.ctr || 0) : null,
    }
  })
}

/* ========= CONJUNTOS (AD SETS) ========= */
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

export async function getFacebookAdSets(
  accountId: string,
  uuid?: string
): Promise<FacebookAdSet[]> {
  const qs = new URLSearchParams({ accountId: stripAct(accountId) })
  if (uuid) qs.set("uuid", uuid)

  const res = await fetch(`/api/facebook-ads/adsets?${qs.toString()}`, {
    credentials: "include",
  })
  if (!res.ok) {
    const details = await tryJson(res)
    throw new Error(
      `Erro ao carregar conjuntos de anúncios: ${res.status} ${details ? JSON.stringify(details) : ""}`
    )
  }

  const data = await res.json()
  const items = Array.isArray(data?.data) ? data.data : []

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

/* ========= ANÚNCIOS (ADS) ========= */
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

type GetFacebookAdsParams = {
  limit?: number
  offset?: number
  status?: "ACTIVE" | "PAUSED" | "ALL"
  q?: string
}

export async function getFacebookAds(
  accountId: string,
  uuid?: string,
  params: GetFacebookAdsParams = {}
): Promise<FacebookAd[]> {
  const qs = new URLSearchParams({ accountId: stripAct(accountId) })
  if (uuid) qs.set("uuid", uuid)
  if (params.limit != null) qs.set("limit", String(params.limit))
  if (params.offset != null) qs.set("offset", String(params.offset))
  if (params.status && params.status !== "ALL") qs.set("status", params.status)
  if (params.q) qs.set("q", params.q)

  const res = await fetch(`/api/facebook-ads/ads?${qs.toString()}`, {
    credentials: "include",
  })
  if (!res.ok) {
    const details = await tryJson(res)
    throw new Error(
      `Erro ao carregar anúncios: ${res.status} ${details ? JSON.stringify(details) : ""}`
    )
  }

  const data = await res.json()
  const items = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray(data)
    ? (data as any)
    : []

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

/* ========= ATUALIZAÇÕES ========= */
export async function updateFacebookCampaignStatus(
  campaignId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<{ success: boolean; newStatus: string }> {
  const response = await fetch(`/api/facebook-ads/campaigns/${campaignId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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
    credentials: "include",
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    const errorData = await tryJson(response)
    throw new Error(errorData?.error || "Falha ao atualizar status da conta de anúncio do Facebook.")
  }
  return response.json()
}
