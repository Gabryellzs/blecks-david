import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get("customerId")
  const pageSize = searchParams.get("pageSize") || "100"
  const pageToken = searchParams.get("pageToken")

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!customerId) {
    return NextResponse.json({ error: "Customer ID é obrigatório" }, { status: 400 })
  }

  try {
    // Obter token válido do Google Ads
    const accessToken = await PlatformConfigManager.getValidToken(user.id, 'google_ads')

    if (!accessToken) {
      console.error("Token de acesso do Google Ads não encontrado para o usuário")
      return NextResponse.json(
        { error: "Token de acesso do Google Ads não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    // Construir query GAQL (Google Ads Query Language)
    // Documentação: https://developers.google.com/google-ads/api/docs/query/overview
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.advertising_channel_sub_type,
        campaign.bidding_strategy_type,
        campaign.budget_amount_micros,
        campaign.budget_type,
        campaign.start_date,
        campaign.end_date,
        campaign.created_at,
        campaign.updated_at,
        campaign.optimization_score,
        campaign.excluded_parent_asset_field_types,
        campaign.url_expansion_opt_out,
        campaign.local_campaign_setting,
        campaign.real_time_bidding_setting,
        campaign.network_settings,
        campaign.geo_target_type_setting,
        campaign.serving_status,
        campaign.ad_serving_optimization_status,
        campaign.advertising_channel_sub_type,
        campaign.base_campaign,
        campaign.campaign_budget,
        campaign.bidding_strategy,
        campaign.commission,
        campaign.dynamic_search_ads_setting,
        campaign.geo_target_type_setting,
        campaign.hotel_setting,
        campaign.local_setting,
        campaign.optimization_goal_setting,
        campaign.performance_max_upgrade,
        campaign.real_time_bidding_setting,
        campaign.selective_optimization,
        campaign.shopping_setting,
        campaign.target_cpa,
        campaign.target_cpm,
        campaign.target_impression_share,
        campaign.target_roas,
        campaign.target_spend,
        campaign.tracking_setting,
        campaign.vanity_pharma,
        campaign.video_setting
      FROM campaign 
      WHERE campaign.customer_id = ${customerId}
      ORDER BY campaign.created_at DESC
      LIMIT ${pageSize}
    `

    // Chamar a Google Ads API para buscar campanhas
    const response = await fetch(
      `https://googleads.googleapis.com/v14/customers/${customerId}/googleAds:searchStream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query,
          pageSize: parseInt(pageSize),
          pageToken: pageToken || undefined,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na resposta da API do Google Ads:", errorText)
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Token do Google Ads expirado. Por favor, reconecte sua conta." },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `Erro na API do Google Ads: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Transformar dados para formato padronizado
    const campaigns = data.results?.map((result: any) => {
      const campaign = result.campaign
      return {
        id: campaign.id,
        name: campaign.name,
        status: mapCampaignStatus(campaign.status),
        objective: campaign.advertising_channel_type,
        subType: campaign.advertising_channel_sub_type,
        budget: campaign.budget_amount_micros ? {
          amount: campaign.budget_amount_micros / 1000000, // Converter de micros
          currency: 'BRL',
          type: campaign.budget_type === 'STANDARD' ? 'DAILY' : 'LIFETIME'
        } : undefined,
        biddingStrategy: campaign.bidding_strategy_type,
        spend: 0, // Será calculado separadamente
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: 0,
        frequency: 0,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
        optimizationScore: campaign.optimization_score || 0,
        servingStatus: campaign.serving_status,
        adServingStatus: campaign.ad_serving_optimization_status,
        platform: 'google_ads',
        rawData: campaign
      }
    }) || []

    return NextResponse.json({
      campaigns,
      totalCount: campaigns.length,
      nextPageToken: data.nextPageToken || null
    })
  } catch (error: any) {
    console.error("Erro inesperado ao buscar campanhas do Google Ads:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Função para mapear status das campanhas
function mapCampaignStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ENABLED': 'ACTIVE',
    'PAUSED': 'PAUSED',
    'REMOVED': 'ARCHIVED',
    'UNKNOWN': 'UNKNOWN'
  }
  return statusMap[status] || 'UNKNOWN'
} 