import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get("customerId")
  const startDate = searchParams.get("startDate") || "30daysAgo"
  const endDate = searchParams.get("endDate") || "today"

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
    const accessToken = await PlatformConfigManager.getValidToken(user.id, 'google_ads')

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Google Ads não encontrado." },
        { status: 400 },
      )
    }

    // Query GAQL para métricas
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.average_cpc,
        metrics.ctr,
        metrics.average_cpm,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion,
        metrics.conversions_from_interactions_rate,
        metrics.conversions_value_per_cost,
        metrics.value_per_conversion,
        metrics.bounce_rate,
        metrics.average_page_views,
        metrics.average_time_on_site,
        metrics.search_absolute_top_impression_share,
        metrics.search_budget_lost_absolute_top_impression_share,
        metrics.search_budget_lost_impression_share,
        metrics.search_budget_lost_top_impression_share,
        metrics.search_click_share,
        metrics.search_impression_share,
        metrics.search_rank_lost_absolute_top_impression_share,
        metrics.search_rank_lost_impression_share,
        metrics.search_rank_lost_top_impression_share,
        metrics.search_top_impression_share,
        metrics.top_impressions,
        metrics.top_impression_share,
        metrics.video_views,
        metrics.video_quartile_p100_rate,
        metrics.video_quartile_p75_rate,
        metrics.video_quartile_p50_rate,
        metrics.video_quartile_p25_rate,
        metrics.video_view_rate,
        metrics.video_views,
        metrics.video_views_percentage,
        metrics.video_views_percentage_25_percent,
        metrics.video_views_percentage_50_percent,
        metrics.video_views_percentage_75_percent,
        metrics.video_views_percentage_100_percent
      FROM campaign 
      WHERE campaign.customer_id = ${customerId}
        AND segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.cost_micros DESC
    `

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
          pageSize: 1000,
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

    // Calcular métricas consolidadas
    const metrics = calculateConsolidatedMetrics(data.results || [])

    return NextResponse.json({
      metrics,
      period: { startDate, endDate },
      totalCampaigns: data.results?.length || 0
    })
  } catch (error: any) {
    console.error("Erro inesperado ao buscar métricas do Google Ads:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

function calculateConsolidatedMetrics(results: any[]) {
  const consolidated = {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalConversionValue: 0,
    averageCtr: 0,
    averageCpc: 0,
    averageCpm: 0,
    averageConversionRate: 0,
    averageCostPerConversion: 0,
    averageValuePerConversion: 0,
    totalVideoViews: 0,
    averageVideoViewRate: 0,
    campaigns: results.length
  }

  results.forEach((result: any) => {
    const campaign = result.campaign
    const metrics = result.metrics

    consolidated.totalSpend += (metrics.cost_micros || 0) / 1000000
    consolidated.totalImpressions += metrics.impressions || 0
    consolidated.totalClicks += metrics.clicks || 0
    consolidated.totalConversions += metrics.conversions || 0
    consolidated.totalConversionValue += metrics.conversions_value || 0
    consolidated.totalVideoViews += metrics.video_views || 0
  })

  // Calcular médias
  if (consolidated.totalClicks > 0) {
    consolidated.averageCtr = (consolidated.totalClicks / consolidated.totalImpressions) * 100
    consolidated.averageCpc = consolidated.totalSpend / consolidated.totalClicks
  }

  if (consolidated.totalImpressions > 0) {
    consolidated.averageCpm = (consolidated.totalSpend / consolidated.totalImpressions) * 1000
  }

  if (consolidated.totalClicks > 0) {
    consolidated.averageConversionRate = (consolidated.totalConversions / consolidated.totalClicks) * 100
  }

  if (consolidated.totalConversions > 0) {
    consolidated.averageCostPerConversion = consolidated.totalSpend / consolidated.totalConversions
    consolidated.averageValuePerConversion = consolidated.totalConversionValue / consolidated.totalConversions
  }

  if (consolidated.totalImpressions > 0) {
    consolidated.averageVideoViewRate = (consolidated.totalVideoViews / consolidated.totalImpressions) * 100
  }

  return consolidated
} 