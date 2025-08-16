// Implementação específica para Google Analytics Universal
// Seguindo o princípio de substituição de Liskov (LSP)

import { BaseTrackingPlatform } from "../base-platform"
import type {
  TrackingPlatformType,
  TrackingPlatformConfig,
  PlatformAuth,
  TrackingQueryParams,
  TrackingResponse,
  CampaignData,
  AdData,
  LeadData,
  TrackingMetrics,
  LeadWebhookConfig,
  LeadWebhookEvent,
  SyncStatus,
  ReportConfig,
  AnalyticsData,
  AnalyticsEvent,
  AnalyticsConversion,
  AnalyticsProperty
} from "../types"

export class GoogleAnalyticsPlatform extends BaseTrackingPlatform {
  readonly platformType: TrackingPlatformType = "google_analytics"
  readonly platformName: string = "Google Analytics"
  
  constructor(config: TrackingPlatformConfig) {
    super(config)
  }
  
  // Implementação da autenticação OAuth 2.0 do Google Analytics
  async authenticate(credentials: any): Promise<PlatformAuth> {
    try {
      this.validateRequiredFields(credentials, ['clientId', 'clientSecret', 'refreshToken'])
      
      // Google Analytics usa OAuth 2.0 com refresh token
      if (credentials.accessToken) {
        this.auth = {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          tokenType: 'Bearer',
          expiresAt: credentials.expiresAt
        }
        return this.auth
      }
      
      // Se não tem access token, usar refresh token para obter um novo
      if (credentials.refreshToken) {
        return await this.refreshAuth({
          accessToken: '',
          refreshToken: credentials.refreshToken
        })
      }
      
      throw new Error('Access token ou refresh token necessário')
    } catch (error) {
      console.error('[Google Analytics] Erro na autenticação:', error)
      throw error
    }
  }
  
  async refreshAuth(auth: PlatformAuth): Promise<PlatformAuth> {
    try {
      if (!auth.refreshToken) {
        throw new Error('Refresh token não disponível')
      }
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId!,
          client_secret: this.config.clientSecret!,
          refresh_token: auth.refreshToken,
          grant_type: 'refresh_token'
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao renovar token')
      }
      
      const data = await response.json()
      this.auth = {
        accessToken: data.access_token,
        refreshToken: auth.refreshToken, // Manter o refresh token original
        tokenType: 'Bearer',
        expiresAt: Date.now() + (data.expires_in * 1000)
      }
      
      return this.auth
    } catch (error) {
      console.error('[Google Analytics] Erro ao renovar autenticação:', error)
      throw error
    }
  }
  
  async validateAuth(auth: PlatformAuth): Promise<boolean> {
    try {
      const response = await this.makeApiRequest('/analytics/v3/management/accounts')
      return response.items !== undefined
    } catch (error) {
      return false
    }
  }
  
  // Implementação de consultas de campanhas (traffic sources)
  async getCampaigns(params: TrackingQueryParams): Promise<TrackingResponse<CampaignData>> {
    try {
      const viewId = params.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params.startDate}&end-date=${params.endDate}&metrics=ga:sessions,ga:users,ga:pageviews,ga:bounceRate,ga:avgSessionDuration&dimensions=ga:source,ga:medium,ga:campaign&sort=-ga:sessions&max-results=${params.limit || 100}`
      )
      
      const campaigns: CampaignData[] = response.rows?.map((row: any[], index: number) => ({
        id: `ga_${index}`,
        name: row[2] || 'Direct', // campaign
        status: 'ACTIVE',
        objective: 'TRAFFIC',
        spend: 0, // Google Analytics não fornece dados de gastos
        impressions: 0,
        clicks: parseInt(row[3]) || 0, // sessions
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: parseInt(row[4]) || 0, // users
        frequency: parseInt(row[3]) > 0 ? parseInt(row[3]) / parseInt(row[4]) : 0,
        startDate: params.startDate,
        endDate: params.endDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: {
          source: row[0],
          medium: row[1],
          campaign: row[2],
          sessions: row[3],
          users: row[4],
          pageviews: row[5],
          bounceRate: row[6],
          avgSessionDuration: row[7]
        }
      })) || []
      
      return this.createSuccessResponse(campaigns)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getAds(params: TrackingQueryParams): Promise<TrackingResponse<AdData>> {
    try {
      // Google Analytics não tem conceito de "ads" da mesma forma
      // Retornar dados de landing pages como "ads"
      const viewId = params.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params.startDate}&end-date=${params.endDate}&metrics=ga:sessions,ga:users,ga:pageviews,ga:bounceRate&dimensions=ga:landingPagePath&sort=-ga:sessions&max-results=${params.limit || 100}`
      )
      
      const ads: AdData[] = response.rows?.map((row: any[], index: number) => ({
        id: `ga_landing_${index}`,
        name: row[0] || '/', // landing page path
        campaignId: 'organic',
        status: 'ACTIVE',
        adType: 'landing_page',
        spend: 0,
        impressions: 0,
        clicks: parseInt(row[1]) || 0, // sessions
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: parseInt(row[2]) || 0, // users
        frequency: parseInt(row[1]) > 0 ? parseInt(row[1]) / parseInt(row[2]) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: {
          landingPagePath: row[0],
          sessions: row[1],
          users: row[2],
          pageviews: row[3],
          bounceRate: row[4]
        }
      })) || []
      
      return this.createSuccessResponse(ads)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getLeads(params: TrackingQueryParams): Promise<TrackingResponse<LeadData>> {
    try {
      // Google Analytics não tem leads diretos
      // Retornar dados de eventos de conversão como "leads"
      const viewId = params.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params.startDate}&end-date=${params.endDate}&metrics=ga:totalEvents&dimensions=ga:eventCategory,ga:eventAction,ga:source,ga:medium&filters=ga:eventCategory==form_submit&sort=-ga:totalEvents&max-results=${params.limit || 100}`
      )
      
      const leads: LeadData[] = response.rows?.map((row: any[], index: number) => ({
        id: `ga_lead_${index}`,
        source: row[2] || 'direct',
        medium: row[3] || 'none',
        status: 'NEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: {
          eventCategory: row[0],
          eventAction: row[1],
          source: row[2],
          medium: row[3],
          totalEvents: row[4]
        }
      })) || []
      
      return this.createSuccessResponse(leads)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getMetrics(params: TrackingQueryParams): Promise<TrackingResponse<TrackingMetrics>> {
    try {
      const viewId = params.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params.startDate}&end-date=${params.endDate}&metrics=ga:sessions,ga:users,ga:pageviews,ga:bounceRate,ga:avgSessionDuration,ga:goalCompletionsAll,ga:goalValueAll,ga:transactionRevenue`
      )
      
      if (!response.rows || response.rows.length === 0) {
        return this.createSuccessResponse([this.calculateMetrics([])])
      }
      
      const row = response.rows[0]
      const metrics: TrackingMetrics = {
        totalSpend: 0, // Google Analytics não fornece dados de gastos
        totalImpressions: 0,
        totalClicks: parseInt(row[0]) || 0, // sessions
        totalReach: parseInt(row[1]) || 0, // users
        averageCtr: 0,
        averageCpc: 0,
        averageCpm: 0,
        averageFrequency: parseInt(row[0]) > 0 ? parseInt(row[0]) / parseInt(row[1]) : 0,
        totalLeads: parseInt(row[5]) || 0, // goalCompletionsAll
        leadCost: 0,
        conversionRate: parseInt(row[0]) > 0 ? (parseInt(row[5]) / parseInt(row[0])) * 100 : 0,
        totalSessions: parseInt(row[0]) || 0,
        totalUsers: parseInt(row[1]) || 0,
        totalPageViews: parseInt(row[2]) || 0,
        averageBounceRate: parseFloat(row[3]) || 0,
        averageSessionDuration: parseFloat(row[4]) || 0,
        totalConversions: parseInt(row[5]) || 0,
        totalRevenue: parseFloat(row[7]) || 0
      }
      
      return this.createSuccessResponse([metrics])
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  // Métodos específicos do Google Analytics
  async getAnalyticsData(params: TrackingQueryParams): Promise<TrackingResponse<AnalyticsData>> {
    try {
      const viewId = params.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params.startDate}&end-date=${params.endDate}&metrics=ga:sessions,ga:users,ga:pageviews,ga:bounceRate,ga:avgSessionDuration,ga:goalCompletionsAll,ga:goalValueAll,ga:transactionRevenue&dimensions=ga:date,ga:source,ga:medium,ga:campaign&sort=ga:date&max-results=${params.limit || 100}`
      )
      
      const analyticsData: AnalyticsData[] = response.rows?.map((row: any[], index: number) => ({
        id: `ga_data_${index}`,
        date: row[0],
        source: row[1] || 'direct',
        medium: row[2] || 'none',
        campaign: row[3] || '',
        sessions: parseInt(row[4]) || 0,
        users: parseInt(row[5]) || 0,
        pageViews: parseInt(row[6]) || 0,
        bounceRate: parseFloat(row[7]) || 0,
        avgSessionDuration: parseFloat(row[8]) || 0,
        goalCompletions: parseInt(row[9]) || 0,
        goalValue: parseFloat(row[10]) || 0,
        ecommerceRevenue: parseFloat(row[11]) || 0,
        ecommerceTransactions: 0,
        platform: this.platformType,
        rawData: row
      })) || []
      
      return this.createSuccessResponse(analyticsData)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getAnalyticsEvents(params: TrackingQueryParams): Promise<TrackingResponse<AnalyticsEvent>> {
    try {
      const viewId = params.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params.startDate}&end-date=${params.endDate}&metrics=ga:totalEvents&dimensions=ga:eventCategory,ga:eventAction,ga:eventLabel,ga:date&sort=-ga:totalEvents&max-results=${params.limit || 100}`
      )
      
      const events: AnalyticsEvent[] = response.rows?.map((row: any[], index: number) => ({
        id: `ga_event_${index}`,
        eventName: row[0] || '',
        eventCategory: row[0] || '',
        eventAction: row[1] || '',
        eventLabel: row[2] || '',
        eventValue: parseInt(row[4]) || 0,
        timestamp: row[3] || new Date().toISOString(),
        platform: this.platformType,
        rawData: row
      })) || []
      
      return this.createSuccessResponse(events)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getAnalyticsConversions(params: TrackingQueryParams): Promise<TrackingResponse<AnalyticsConversion>> {
    try {
      const viewId = params.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params.startDate}&end-date=${params.endDate}&metrics=ga:goalCompletionsAll,ga:goalValueAll&dimensions=ga:goalPreviousStep1,ga:source,ga:medium,ga:campaign,ga:date&sort=-ga:goalCompletionsAll&max-results=${params.limit || 100}`
      )
      
      const conversions: AnalyticsConversion[] = response.rows?.map((row: any[], index: number) => ({
        id: `ga_conversion_${index}`,
        goalId: row[0] || 'goal1',
        goalName: row[0] || 'Goal 1',
        conversionValue: parseFloat(row[6]) || 0,
        conversionCurrency: 'USD',
        date: row[4] || new Date().toISOString(),
        source: row[1] || 'direct',
        medium: row[2] || 'none',
        campaign: row[3] || '',
        platform: this.platformType,
        rawData: row
      })) || []
      
      return this.createSuccessResponse(conversions)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  // Implementações específicas
  async getCampaignById(campaignId: string, params?: Partial<TrackingQueryParams>): Promise<CampaignData | null> {
    try {
      const viewId = params?.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params?.startDate || '30daysAgo'}&end-date=${params?.endDate || 'today'}&metrics=ga:sessions,ga:users,ga:pageviews&dimensions=ga:source,ga:medium,ga:campaign&filters=ga:campaign==${campaignId}`
      )
      
      if (!response.rows || response.rows.length === 0) {
        return null
      }
      
      const row = response.rows[0]
      return {
        id: campaignId,
        name: row[2] || 'Direct',
        status: 'ACTIVE',
        objective: 'TRAFFIC',
        spend: 0,
        impressions: 0,
        clicks: parseInt(row[3]) || 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: parseInt(row[4]) || 0,
        frequency: parseInt(row[3]) > 0 ? parseInt(row[3]) / parseInt(row[4]) : 0,
        startDate: params?.startDate || '30daysAgo',
        endDate: params?.endDate || 'today',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: row
      }
    } catch (error) {
      console.error('[Google Analytics] Erro ao buscar campanha:', error)
      return null
    }
  }
  
  async getAdById(adId: string, params?: Partial<TrackingQueryParams>): Promise<AdData | null> {
    try {
      const viewId = params?.viewId || this.config.viewId
      if (!viewId) {
        throw new Error('View ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${params?.startDate || '30daysAgo'}&end-date=${params?.endDate || 'today'}&metrics=ga:sessions,ga:users,ga:pageviews&dimensions=ga:landingPagePath&filters=ga:landingPagePath==${adId}`
      )
      
      if (!response.rows || response.rows.length === 0) {
        return null
      }
      
      const row = response.rows[0]
      return {
        id: adId,
        name: row[0] || '/',
        campaignId: 'organic',
        status: 'ACTIVE',
        adType: 'landing_page',
        spend: 0,
        impressions: 0,
        clicks: parseInt(row[1]) || 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: parseInt(row[2]) || 0,
        frequency: parseInt(row[1]) > 0 ? parseInt(row[1]) / parseInt(row[2]) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: row
      }
    } catch (error) {
      console.error('[Google Analytics] Erro ao buscar anúncio:', error)
      return null
    }
  }
  
  async getLeadById(leadId: string, params?: Partial<TrackingQueryParams>): Promise<LeadData | null> {
    // Google Analytics não tem leads individuais
    return null
  }
  
  async getAccounts(): Promise<Array<{ id: string; name: string; status: string }>> {
    try {
      const response = await this.makeApiRequest('/analytics/v3/management/accounts')
      
      return response.items?.map((account: any) => ({
        id: account.id,
        name: account.name,
        status: 'ACTIVE'
      })) || []
    } catch (error) {
      console.error('[Google Analytics] Erro ao buscar contas:', error)
      return []
    }
  }
  
  async getAccountInfo(accountId: string): Promise<any> {
    try {
      return await this.makeApiRequest(`/analytics/v3/management/accounts/${accountId}`)
    } catch (error) {
      console.error('[Google Analytics] Erro ao buscar informações da conta:', error)
      throw error
    }
  }
  
  async getProperties(accountId: string): Promise<AnalyticsProperty[]> {
    try {
      const response = await this.makeApiRequest(`/analytics/v3/management/accounts/${accountId}/webproperties`)
      
      return response.items?.map((property: any) => ({
        id: property.id,
        name: property.name,
        accountId: property.accountId,
        type: 'UNIVERSAL',
        viewId: property.defaultProfileId,
        websiteUrl: property.websiteUrl,
        timezone: property.timezone,
        currency: property.currency,
        enhancedEcommerceEnabled: property.eCommerceTracking,
        platform: this.platformType,
        rawData: property
      })) || []
    } catch (error) {
      console.error('[Google Analytics] Erro ao buscar propriedades:', error)
      return []
    }
  }
  
  async getViews(accountId: string, propertyId: string): Promise<any[]> {
    try {
      const response = await this.makeApiRequest(`/analytics/v3/management/accounts/${accountId}/webproperties/${propertyId}/profiles`)
      return response.items || []
    } catch (error) {
      console.error('[Google Analytics] Erro ao buscar views:', error)
      return []
    }
  }
  
  // Implementações de webhook
  async setupLeadWebhook(config: LeadWebhookConfig): Promise<boolean> {
    try {
      // Google Analytics não tem webhooks nativos
      console.log('[Google Analytics] Configurando webhook para leads')
      return true
    } catch (error) {
      console.error('[Google Analytics] Erro ao configurar webhook:', error)
      return false
    }
  }
  
  async removeLeadWebhook(webhookId: string): Promise<boolean> {
    try {
      console.log('[Google Analytics] Removendo webhook:', webhookId)
      return true
    } catch (error) {
      console.error('[Google Analytics] Erro ao remover webhook:', error)
      return false
    }
  }
  
  async getWebhookEvents(webhookId: string, params?: TrackingQueryParams): Promise<LeadWebhookEvent[]> {
    // Google Analytics não tem webhooks nativos
    return []
  }
  
  // Implementações de sincronização
  async syncData(params: TrackingQueryParams): Promise<SyncStatus> {
    try {
      let recordsProcessed = 0
      
      // Sincronizar dados de analytics
      const analyticsResponse = await this.getAnalyticsData(params)
      recordsProcessed += analyticsResponse.data.length
      
      // Sincronizar eventos
      const eventsResponse = await this.getAnalyticsEvents(params)
      recordsProcessed += eventsResponse.data.length
      
      // Sincronizar conversões
      const conversionsResponse = await this.getAnalyticsConversions(params)
      recordsProcessed += conversionsResponse.data.length
      
      return {
        platform: this.platformType,
        lastSync: new Date(),
        status: 'SUCCESS',
        recordsProcessed,
        nextSync: new Date(Date.now() + 3600000) // 1 hora
      }
    } catch (error) {
      return {
        platform: this.platformType,
        lastSync: new Date(),
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
  
  async getSyncStatus(): Promise<SyncStatus> {
    return {
      platform: this.platformType,
      lastSync: new Date(),
      status: 'PENDING'
    }
  }
  
  // Implementações de relatórios
  async createReport(config: ReportConfig): Promise<string> {
    try {
      const reportId = `google_analytics_${Date.now()}`
      console.log('[Google Analytics] Criando relatório:', reportId)
      return reportId
    } catch (error) {
      console.error('[Google Analytics] Erro ao criar relatório:', error)
      throw error
    }
  }
  
  async getReport(reportId: string): Promise<any> {
    try {
      return { reportId, status: 'completed' }
    } catch (error) {
      console.error('[Google Analytics] Erro ao buscar relatório:', error)
      throw error
    }
  }
  
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      console.log('[Google Analytics] Deletando relatório:', reportId)
      return true
    } catch (error) {
      console.error('[Google Analytics] Erro ao deletar relatório:', error)
      return false
    }
  }
  
  // Implementações de utilitários
  async testConnection(): Promise<boolean> {
    try {
      await this.makeApiRequest('/analytics/v3/management/accounts')
      return true
    } catch (error) {
      return false
    }
  }
  
  async getRateLimitInfo(): Promise<{ remaining: number; reset: number }> {
    // Google Analytics não fornece informações detalhadas de rate limit via API
    return {
      remaining: 1000,
      reset: Date.now() + 3600000 // 1 hora
    }
  }
  
  async validateCredentials(credentials: any): Promise<boolean> {
    try {
      this.validateRequiredFields(credentials, ['clientId', 'clientSecret'])
      return await this.testConnection()
    } catch (error) {
      return false
    }
  }
} 