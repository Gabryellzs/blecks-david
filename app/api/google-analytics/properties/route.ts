import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    // Obter token válido do Google Analytics usando o PlatformConfigManager
    const accessToken = await PlatformConfigManager.getValidToken(user.id, 'google_analytics')

    if (!accessToken) {
      console.error("Token de acesso do Google Analytics não encontrado para o usuário")
      return NextResponse.json(
        { error: "Token de acesso do Google Analytics não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    // Chamar a Google Analytics API para listar propriedades
    // Documentação: https://developers.google.com/analytics/devguides/reporting/data/v1
    const response = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/accounts?access_token=${accessToken}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na resposta da API do Google Analytics:", errorText)
      
      // Se o erro for de token inválido, sugerir reconexão
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

    // Para cada conta, buscar as propriedades
    const properties = []
    
    for (const account of data.accounts || []) {
      const propertiesResponse = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/${account.name}/properties?access_token=${accessToken}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json()
        
        for (const property of propertiesData.properties || []) {
          properties.push({
            id: property.name.split('/').pop(), // Extrair ID da propriedade
            name: property.displayName || `Propriedade ${property.name.split('/').pop()}`,
            accountId: account.name.split('/').pop(),
            accountName: account.displayName || `Conta ${account.name.split('/').pop()}`,
            status: property.deleted ? 'DELETED' : 'ACTIVE',
            currencyCode: property.currencyCode || 'BRL',
            timeZone: property.timeZone || 'America/Sao_Paulo',
            industryCategory: property.industryCategory || '',
            serviceLevel: property.serviceLevel || '',
            enhancedMeasurementSettings: property.enhancedMeasurementSettings || {},
            googleSignalsSettings: property.googleSignalsSettings || {},
            defaultUri: property.defaultUri || '',
            rawData: property
          })
        }
      }
    }

    return NextResponse.json({
      properties,
      totalCount: properties.length,
      accounts: data.accounts?.length || 0
    })
  } catch (error: any) {
    console.error("Erro inesperado ao buscar propriedades do Google Analytics:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 