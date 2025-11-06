import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get("accountId")
  const pageSize = searchParams.get("pageSize") || "100"
  const cursor = searchParams.get("cursor")

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!accountId) {
    return NextResponse.json({ error: "Account ID é obrigatório" }, { status: 400 })
  }

  try {
    // Obter token válido do Kwai
    const accessToken = await PlatformConfigManager.getValidToken(user.id, 'kwai')

    if (!accessToken) {
      console.error("Token de acesso do Kwai não encontrado para o usuário")
      return NextResponse.json(
        { error: "Token de acesso do Kwai não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    // Chamar a Kwai API para listar campanhas
    const response = await fetch(
      `https://api.kwai.com/v1/ads/campaigns?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_id: accountId,
          page_size: parseInt(pageSize),
          cursor: cursor || undefined,
          fields: [
            "campaign_id",
            "campaign_name",
            "objective_type",
            "status",
            "budget_mode",
            "budget",
            "create_time",
            "modify_time",
            "campaign_type",
            "targeting",
            "account_id"
          ]
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na resposta da API do Kwai:", errorText)
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Token do Kwai expirado. Por favor, reconecte sua conta." },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `Erro na API do Kwai: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.error) {
      console.error("Erro na API do Kwai:", data)
      return NextResponse.json(
        { error: data.message || "Erro na API do Kwai" },
        { status: 400 }
      )
    }

    // Transformar dados para formato padronizado
    const campaigns = data.campaigns?.map((campaign: any) => ({
      id: campaign.campaign_id,
      name: campaign.campaign_name,
      status: mapCampaignStatus(campaign.status),
      objective: campaign.objective_type,
      budget: campaign.budget ? {
        amount: campaign.budget,
        currency: 'USD',
        type: campaign.budget_mode === 'DAILY' ? 'DAILY' : 'LIFETIME'
      } : undefined,
      spend: 0, // Será calculado
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      reach: 0,
      frequency: 0,
      startDate: campaign.create_time,
      endDate: null,
      createdAt: campaign.create_time,
      updatedAt: campaign.modify_time,
      campaignType: campaign.campaign_type,
      targeting: campaign.targeting,
      platform: 'kwai',
      rawData: campaign
    })) || []

    return NextResponse.json({
      campaigns,
      totalCount: campaigns.length,
      cursor: data.page_info?.cursor || null,
      hasMore: data.page_info?.total_count > campaigns.length
    })
  } catch (error: any) {
    console.error("Erro inesperado ao buscar campanhas do Kwai:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Função para mapear status das campanhas
function mapCampaignStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'ACTIVE',
    'PAUSED': 'PAUSED',
    'DELETED': 'ARCHIVED',
    'REJECTED': 'REJECTED',
    'PENDING': 'PENDING'
  }
  return statusMap[status] || 'UNKNOWN'
} 