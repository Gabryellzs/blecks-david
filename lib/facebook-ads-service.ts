import type { FacebookAdAccount, FacebookCampaign } from "./types/facebook-ads"

export async function getFacebookAdAccounts(): Promise<FacebookAdAccount[]> {
  const response = await fetch("/api/facebook-ads/accounts")
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Falha ao buscar contas de anúncio do Facebook.")
  }
  return response.json()
}

export async function getFacebookCampaigns(adAccountId: string): Promise<FacebookCampaign[]> {
  const response = await fetch(`/api/facebook-ads/campaigns?ad_account_id=${adAccountId}`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Falha ao buscar campanhas do Facebook.")
  }
  return response.json()
}

export async function updateFacebookCampaignStatus(
  campaignId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<{ success: boolean; newStatus: string }> {
  const response = await fetch(`/api/facebook-ads/campaigns/${campaignId}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Falha ao atualizar status da campanha do Facebook.")
  }
  return response.json()
}

export async function updateFacebookAdAccountStatus(
  adAccountId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<{ success: boolean; newStatus: string }> {
  const response = await fetch(`/api/facebook-ads/ad-accounts/${adAccountId}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Falha ao atualizar status da conta de anúncio do Facebook.")
  }
  return response.json()
}
