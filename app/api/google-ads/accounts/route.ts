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
    // Obter token válido do Google Ads usando o PlatformConfigManager
    const accessToken = await PlatformConfigManager.getValidToken(user.id, 'google_ads')

    if (!accessToken) {
      console.error("Token de acesso do Google Ads não encontrado para o usuário")
      return NextResponse.json(
        { error: "Token de acesso do Google Ads não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    // Chamar a Google Ads API para listar contas de cliente
    // Documentação: https://developers.google.com/google-ads/api/reference/rpc/v14/GoogleAdsService
    const response = await fetch(
      `https://googleads.googleapis.com/v14/customers?access_token=${accessToken}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na resposta da API do Google Ads:", errorText)
      
      // Se o erro for de token inválido, sugerir reconexão
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
    const accounts = data.results?.map((customer: any) => ({
      id: customer.id,
      name: customer.descriptiveName || `Conta ${customer.id}`,
      status: customer.status || 'ACTIVE',
      currencyCode: customer.currencyCode || 'BRL',
      timeZone: customer.timeZone || 'America/Sao_Paulo',
      manager: customer.manager || false,
      testAccount: customer.testAccount || false,
      autoTaggingEnabled: customer.autoTaggingEnabled || false,
      trackingUrlTemplate: customer.trackingUrlTemplate || '',
      finalUrlSuffix: customer.finalUrlSuffix || '',
      hasPartnersBadge: customer.hasPartnersBadge || false,
      managerLinkId: customer.managerLinkId || '',
      optimizationScore: customer.optimizationScore || 0,
      rawData: customer
    })) || []

    return NextResponse.json({
      accounts,
      totalCount: accounts.length,
      nextPageToken: data.nextPageToken || null
    })
  } catch (error: any) {
    console.error("Erro inesperado ao buscar contas do Google Ads:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 