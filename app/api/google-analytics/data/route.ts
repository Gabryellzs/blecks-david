import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get("propertyId")
  const startDate = searchParams.get("startDate") || "30daysAgo"
  const endDate = searchParams.get("endDate") || "today"
  const metrics = searchParams.get("metrics") || "sessions,users,pageviews,bounceRate,avgSessionDuration"

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!propertyId) {
    return NextResponse.json({ error: "Property ID é obrigatório" }, { status: 400 })
  }

  try {
    // Obter token válido do Google Analytics
    const accessToken = await PlatformConfigManager.getValidToken(user.id, 'google_analytics')

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Google Analytics não encontrado." },
        { status: 400 },
      )
    }

    // Chamar a Google Analytics Data API
    // Documentação: https://developers.google.com/analytics/devguides/reporting/data/v1
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          dateRanges: [
            {
              startDate,
              endDate,
            },
          ],
          dimensions: [
            { name: "date" },
            { name: "source" },
            { name: "medium" },
            { name: "campaign" },
          ],
          metrics: metrics.split(',').map(metric => ({ name: metric.trim() })),
          limit: 1000,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na resposta da API do Google Analytics:", errorText)
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Token do Google Analytics expirado. Por favor, reconecte sua conta." },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `Erro na API do Google Analytics: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Transformar dados para formato padronizado
    const analyticsData = data.rows?.map((row: any, index: number) => {
      const dimensionValues = row.dimensionValues || []
      const metricValues = row.metricValues || []
      
      return {
        id: `ga_data_${index}`,
        date: dimensionValues[0]?.value || '',
        source: dimensionValues[1]?.value || 'direct',
        medium: dimensionValues[2]?.value || 'none',
        campaign: dimensionValues[3]?.value || '',
        sessions: parseInt(metricValues[0]?.value) || 0,
        users: parseInt(metricValues[1]?.value) || 0,
        pageViews: parseInt(metricValues[2]?.value) || 0,
        bounceRate: parseFloat(metricValues[3]?.value) || 0,
        avgSessionDuration: parseFloat(metricValues[4]?.value) || 0,
        platform: 'google_analytics',
        propertyId,
        rawData: {
          dimensions: dimensionValues,
          metrics: metricValues
        }
      }
    }) || []

    // Calcular métricas consolidadas
    const consolidatedMetrics = calculateConsolidatedMetrics(analyticsData)

    return NextResponse.json({
      data: analyticsData,
      metrics: consolidatedMetrics,
      period: { startDate, endDate },
      totalRows: analyticsData.length,
      propertyId
    })
  } catch (error: any) {
    console.error("Erro inesperado ao buscar dados do Google Analytics:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

function calculateConsolidatedMetrics(data: any[]) {
  const consolidated = {
    totalSessions: 0,
    totalUsers: 0,
    totalPageViews: 0,
    averageBounceRate: 0,
    averageSessionDuration: 0,
    totalSessionsBySource: {} as Record<string, number>,
    totalSessionsByMedium: {} as Record<string, number>,
    totalSessionsByCampaign: {} as Record<string, number>
  }

  data.forEach((row: any) => {
    consolidated.totalSessions += row.sessions
    consolidated.totalUsers += row.users
    consolidated.totalPageViews += row.pageViews
    
    // Agrupar por fonte
    if (row.source) {
      consolidated.totalSessionsBySource[row.source] = 
        (consolidated.totalSessionsBySource[row.source] || 0) + row.sessions
    }
    
    // Agrupar por meio
    if (row.medium) {
      consolidated.totalSessionsByMedium[row.medium] = 
        (consolidated.totalSessionsByMedium[row.medium] || 0) + row.sessions
    }
    
    // Agrupar por campanha
    if (row.campaign) {
      consolidated.totalSessionsByCampaign[row.campaign] = 
        (consolidated.totalSessionsByCampaign[row.campaign] || 0) + row.sessions
    }
  })

  // Calcular médias
  if (data.length > 0) {
    consolidated.averageBounceRate = data.reduce((sum, row) => sum + row.bounceRate, 0) / data.length
    consolidated.averageSessionDuration = data.reduce((sum, row) => sum + row.avgSessionDuration, 0) / data.length
  }

  return consolidated
} 