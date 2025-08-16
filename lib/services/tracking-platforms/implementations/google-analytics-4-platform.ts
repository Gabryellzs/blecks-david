// Implementação específica para Google Analytics 4
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

export class GoogleAnalytics4Platform extends BaseTrackingPlatform {
  readonly platformType: TrackingPlatformType = "google_analytics_4"
  readonly platformName: string = "Google Analytics 4"
  
  constructor(config: TrackingPlatformConfig) {
    super(config)
  }
  
  // Implementação da autenticação OAuth 2.0 do Google Analytics 4
  async authenticate(credentials: any): Promise<PlatformAuth> {
    try {
      this.validateRequiredFields(credentials, ['clientId', 'clientSecret', 'refreshToken'])
      
      // Google Analytics 4 usa OAuth 2.0 com refresh token
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
      console.error('[Google Analytics 4] Erro na autenticação:', error)
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
      console.error('[Google Analytics 4] Erro ao renovar autenticação:', error)
      throw error
    }
  }
  
  async validateAuth(auth: PlatformAuth): Promise<boolean> {
    try {
      const response = await this.makeApiRequest('/analyticsdata/v1beta/properties')
      return response.properties !== undefined
    } catch (error) {
      return false
    }
  }
  
  // Implementação de consultas de campanhas (traffic sources)
  async getCampaigns(params: TrackingQueryParams): Promise<TrackingResponse<CampaignData>> {
    try {
      const propertyId = params.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params.startDate,
              endDate: params.endDate
            }],
            dimensions: [
              { name: 'sessionSource' },
              { name: 'sessionMedium' },
              { name: 'sessionCampaign' }
            ],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'screenPageViews' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' }
            ],
            limit: params.limit || 100
          })
        }
      )
      
      const campaigns: CampaignData[] = response.rows?.map((row: any, index: number) => ({
        id: `ga4_${index}`,
        name: row.dimensionValues[2]?.value || 'Direct', // sessionCampaign
        status: 'ACTIVE',
        objective: 'TRAFFIC',
        spend: 0, // Google Analytics 4 não fornece dados de gastos
        impressions: 0,
        clicks: parseInt(row.metricValues[0]?.value) || 0, // sessions
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: parseInt(row.metricValues[1]?.value) || 0, // totalUsers
        frequency: parseInt(row.metricValues[0]?.value) > 0 ? parseInt(row.metricValues[0]?.value) / parseInt(row.metricValues[1]?.value) : 0,
        startDate: params.startDate,
        endDate: params.endDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: {
          source: row.dimensionValues[0]?.value,
          medium: row.dimensionValues[1]?.value,
          campaign: row.dimensionValues[2]?.value,
          sessions: row.metricValues[0]?.value,
          users: row.metricValues[1]?.value,
          pageviews: row.metricValues[2]?.value,
          bounceRate: row.metricValues[3]?.value,
          avgSessionDuration: row.metricValues[4]?.value
        }
      })) || []
      
      return this.createSuccessResponse(campaigns)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getAds(params: TrackingQueryParams): Promise<TrackingResponse<AdData>> {
    try {
      // Google Analytics 4 não tem conceito de "ads" da mesma forma
      // Retornar dados de landing pages como "ads"
      const propertyId = params.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params.startDate,
              endDate: params.endDate
            }],
            dimensions: [
              { name: 'landingPage' }
            ],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'screenPageViews' },
              { name: 'bounceRate' }
            ],
            limit: params.limit || 100
          })
        }
      )
      
      const ads: AdData[] = response.rows?.map((row: any, index: number) => ({
        id: `ga4_landing_${index}`,
        name: row.dimensionValues[0]?.value || '/', // landing page
        campaignId: 'organic',
        status: 'ACTIVE',
        adType: 'landing_page',
        spend: 0,
        impressions: 0,
        clicks: parseInt(row.metricValues[0]?.value) || 0, // sessions
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: parseInt(row.metricValues[1]?.value) || 0, // users
        frequency: parseInt(row.metricValues[0]?.value) > 0 ? parseInt(row.metricValues[0]?.value) / parseInt(row.metricValues[1]?.value) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: {
          landingPage: row.dimensionValues[0]?.value,
          sessions: row.metricValues[0]?.value,
          users: row.metricValues[1]?.value,
          pageviews: row.metricValues[2]?.value,
          bounceRate: row.metricValues[3]?.value
        }
      })) || []
      
      return this.createSuccessResponse(ads)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getLeads(params: TrackingQueryParams): Promise<TrackingResponse<LeadData>> {
    try {
      // Google Analytics 4 não tem leads diretos
      // Retornar dados de eventos de conversão como "leads"
      const propertyId = params.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params.startDate,
              endDate: params.endDate
            }],
            dimensions: [
              { name: 'eventName' },
              { name: 'sessionSource' },
              { name: 'sessionMedium' }
            ],
            metrics: [
              { name: 'eventCount' }
            ],
            dimensionFilter: {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'form_submit'
                }
              }
            },
            limit: params.limit || 100
          })
        }
      )
      
      const leads: LeadData[] = response.rows?.map((row: any, index: number) => ({
        id: `ga4_lead_${index}`,
        source: row.dimensionValues[1]?.value || 'direct',
        medium: row.dimensionValues[2]?.value || 'none',
        status: 'NEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: {
          eventName: row.dimensionValues[0]?.value,
          source: row.dimensionValues[1]?.value,
          medium: row.dimensionValues[2]?.value,
          eventCount: row.metricValues[0]?.value
        }
      })) || []
      
      return this.createSuccessResponse(leads)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getMetrics(params: TrackingQueryParams): Promise<TrackingResponse<TrackingMetrics>> {
    try {
      const propertyId = params.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params.startDate,
              endDate: params.endDate
            }],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'screenPageViews' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' },
              { name: 'conversions' },
              { name: 'totalRevenue' }
            ]
          })
        }
      )
      
      if (!response.rows || response.rows.length === 0) {
        return this.createSuccessResponse([this.calculateMetrics([])])
      }
      
      const row = response.rows[0]
      const metrics: TrackingMetrics = {
        totalSpend: 0, // Google Analytics 4 não fornece dados de gastos
        totalImpressions: 0,
        totalClicks: parseInt(row.metricValues[0]?.value) || 0, // sessions
        totalReach: parseInt(row.metricValues[1]?.value) || 0, // totalUsers
        averageCtr: 0,
        averageCpc: 0,
        averageCpm: 0,
        averageFrequency: parseInt(row.metricValues[0]?.value) > 0 ? parseInt(row.metricValues[0]?.value) / parseInt(row.metricValues[1]?.value) : 0,
        totalLeads: parseInt(row.metricValues[5]?.value) || 0, // conversions
        leadCost: 0,
        conversionRate: parseInt(row.metricValues[0]?.value) > 0 ? (parseInt(row.metricValues[5]?.value) / parseInt(row.metricValues[0]?.value)) * 100 : 0,
        totalSessions: parseInt(row.metricValues[0]?.value) || 0,
        totalUsers: parseInt(row.metricValues[1]?.value) || 0,
        totalPageViews: parseInt(row.metricValues[2]?.value) || 0,
        averageBounceRate: parseFloat(row.metricValues[3]?.value) || 0,
        averageSessionDuration: parseFloat(row.metricValues[4]?.value) || 0,
        totalConversions: parseInt(row.metricValues[5]?.value) || 0,
        totalRevenue: parseFloat(row.metricValues[6]?.value) || 0
      }
      
      return this.createSuccessResponse([metrics])
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  // Métodos específicos do Google Analytics 4
  async getAnalyticsData(params: TrackingQueryParams): Promise<TrackingResponse<AnalyticsData>> {
    try {
      const propertyId = params.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params.startDate,
              endDate: params.endDate
            }],
            dimensions: [
              { name: 'date' },
              { name: 'sessionSource' },
              { name: 'sessionMedium' },
              { name: 'sessionCampaign' }
            ],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'screenPageViews' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' },
              { name: 'conversions' },
              { name: 'totalRevenue' }
            ],
            limit: params.limit || 100
          })
        }
      )
      
      const analyticsData: AnalyticsData[] = response.rows?.map((row: any, index: number) => ({
        id: `ga4_data_${index}`,
        date: row.dimensionValues[0]?.value,
        source: row.dimensionValues[1]?.value || 'direct',
        medium: row.dimensionValues[2]?.value || 'none',
        campaign: row.dimensionValues[3]?.value || '',
        sessions: parseInt(row.metricValues[0]?.value) || 0,
        users: parseInt(row.metricValues[1]?.value) || 0,
        pageViews: parseInt(row.metricValues[2]?.value) || 0,
        bounceRate: parseFloat(row.metricValues[3]?.value) || 0,
        avgSessionDuration: parseFloat(row.metricValues[4]?.value) || 0,
        goalCompletions: parseInt(row.metricValues[5]?.value) || 0,
        goalValue: parseFloat(row.metricValues[6]?.value) || 0,
        ecommerceRevenue: parseFloat(row.metricValues[6]?.value) || 0,
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
      const propertyId = params.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params.startDate,
              endDate: params.endDate
            }],
            dimensions: [
              { name: 'eventName' },
              { name: 'date' }
            ],
            metrics: [
              { name: 'eventCount' }
            ],
            limit: params.limit || 100
          })
        }
      )
      
      const events: AnalyticsEvent[] = response.rows?.map((row: any, index: number) => ({
        id: `ga4_event_${index}`,
        eventName: row.dimensionValues[0]?.value || '',
        eventCategory: row.dimensionValues[0]?.value || '',
        eventAction: row.dimensionValues[0]?.value || '',
        eventLabel: '',
        eventValue: parseInt(row.metricValues[0]?.value) || 0,
        timestamp: row.dimensionValues[1]?.value || new Date().toISOString(),
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
      const propertyId = params.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params.startDate,
              endDate: params.endDate
            }],
            dimensions: [
              { name: 'sessionSource' },
              { name: 'sessionMedium' },
              { name: 'sessionCampaign' },
              { name: 'date' }
            ],
            metrics: [
              { name: 'conversions' },
              { name: 'totalRevenue' }
            ],
            limit: params.limit || 100
          })
        }
      )
      
      const conversions: AnalyticsConversion[] = response.rows?.map((row: any, index: number) => ({
        id: `ga4_conversion_${index}`,
        goalId: 'conversion',
        goalName: 'Conversion',
        conversionValue: parseFloat(row.metricValues[1]?.value) || 0,
        conversionCurrency: 'USD',
        date: row.dimensionValues[3]?.value || new Date().toISOString(),
        source: row.dimensionValues[0]?.value || 'direct',
        medium: row.dimensionValues[1]?.value || 'none',
        campaign: row.dimensionValues[2]?.value || '',
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
      const propertyId = params?.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params?.startDate || '30daysAgo',
              endDate: params?.endDate || 'today'
            }],
            dimensions: [
              { name: 'sessionSource' },
              { name: 'sessionMedium' },
              { name: 'sessionCampaign' }
            ],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'screenPageViews' }
            ],
            dimensionFilter: {
              filter: {
                fieldName: 'sessionCampaign',
                stringFilter: {
                  matchType: 'EXACT',
                  value: campaignId
                }
              }
            }
          })
        }
      )
      
      if (!response.rows || response.rows.length === 0) {
        return null
      }
      
      const row = response.rows[0]
      return {
        id: campaignId,
        name: row.dimensionValues[2]?.value || 'Direct',
        status: 'ACTIVE',
        objective: 'TRAFFIC',
        spend: 0,
        impressions: 0,
        clicks: parseInt(row.metricValues[0]?.value) || 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: parseInt(row.metricValues[1]?.value) || 0,
        frequency: parseInt(row.metricValues[0]?.value) > 0 ? parseInt(row.metricValues[0]?.value) / parseInt(row.metricValues[1]?.value) : 0,
        startDate: params?.startDate || '30daysAgo',
        endDate: params?.endDate || 'today',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: row
      }
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao buscar campanha:', error)
      return null
    }
  }
  
  async getAdById(adId: string, params?: Partial<TrackingQueryParams>): Promise<AdData | null> {
    try {
      const propertyId = params?.propertyId || this.config.propertyId
      if (!propertyId) {
        throw new Error('Property ID necessário')
      }
      
      const response = await this.makeApiRequest(
        `/analyticsdata/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{
              startDate: params?.startDate || '30daysAgo',
              endDate: params?.endDate || 'today'
            }],
            dimensions: [
              { name: 'landingPage' }
            ],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'screenPageViews' }
            ],
            dimensionFilter: {
              filter: {
                fieldName: 'landingPage',
                stringFilter: {
                  matchType: 'EXACT',
                  value: adId
                }
              }
            }
          })
        }
      )
      
      if (!response.rows || response.rows.length === 0) {
        return null
      }
      
      const row = response.rows[0]
      return {
        id: adId,
        name: row.dimensionValues[0]?.value || '/',
        campaignId: 'organic',
        status: 'ACTIVE',
        adType: 'landing_page',
        spend: 0,
        impressions: 0,
        clicks: parseInt(row.metricValues[0]?.value) || 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: parseInt(row.metricValues[1]?.value) || 0,
        frequency: parseInt(row.metricValues[0]?.value) > 0 ? parseInt(row.metricValues[0]?.value) / parseInt(row.metricValues[1]?.value) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platform: this.platformType,
        rawData: row
      }
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao buscar anúncio:', error)
      return null
    }
  }
  
  async getLeadById(leadId: string, params?: Partial<TrackingQueryParams>): Promise<LeadData | null> {
    // Google Analytics 4 não tem leads individuais
    return null
  }
  
  async getAccounts(): Promise<Array<{ id: string; name: string; status: string }>> {
    try {
      const response = await this.makeApiRequest('/analyticsadmin/v1beta/accounts')
      
      return response.accounts?.map((account: any) => ({
        id: account.name.split('/').pop(),
        name: account.displayName,
        status: 'ACTIVE'
      })) || []
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao buscar contas:', error)
      return []
    }
  }
  
  async getAccountInfo(accountId: string): Promise<any> {
    try {
      return await this.makeApiRequest(`/analyticsadmin/v1beta/accounts/${accountId}`)
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao buscar informações da conta:', error)
      throw error
    }
  }
  
  async getProperties(accountId: string): Promise<AnalyticsProperty[]> {
    try {
      const response = await this.makeApiRequest(`/analyticsadmin/v1beta/accounts/${accountId}/properties`)
      
      return response.properties?.map((property: any) => ({
        id: property.name.split('/').pop(),
        name: property.displayName,
        accountId: property.parent.split('/').pop(),
        type: 'GA4',
        measurementId: property.dataStreams?.[0]?.webStreamData?.measurementId,
        websiteUrl: property.dataStreams?.[0]?.webStreamData?.defaultUri,
        timezone: property.timeZone,
        currency: property.currencyCode,
        enhancedEcommerceEnabled: true,
        platform: this.platformType,
        rawData: property
      })) || []
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao buscar propriedades:', error)
      return []
    }
  }
  
  // Implementações de webhook
  async setupLeadWebhook(config: LeadWebhookConfig): Promise<boolean> {
    try {
      // Google Analytics 4 não tem webhooks nativos
      console.log('[Google Analytics 4] Configurando webhook para leads')
      return true
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao configurar webhook:', error)
      return false
    }
  }
  
  async removeLeadWebhook(webhookId: string): Promise<boolean> {
    try {
      console.log('[Google Analytics 4] Removendo webhook:', webhookId)
      return true
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao remover webhook:', error)
      return false
    }
  }
  
  async getWebhookEvents(webhookId: string, params?: TrackingQueryParams): Promise<LeadWebhookEvent[]> {
    // Google Analytics 4 não tem webhooks nativos
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
      const reportId = `google_analytics_4_${Date.now()}`
      console.log('[Google Analytics 4] Criando relatório:', reportId)
      return reportId
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao criar relatório:', error)
      throw error
    }
  }
  
  async getReport(reportId: string): Promise<any> {
    try {
      return { reportId, status: 'completed' }
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao buscar relatório:', error)
      throw error
    }
  }
  
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      console.log('[Google Analytics 4] Deletando relatório:', reportId)
      return true
    } catch (error) {
      console.error('[Google Analytics 4] Erro ao deletar relatório:', error)
      return false
    }
  }
  
  // Implementações de utilitários
  async testConnection(): Promise<boolean> {
    try {
      await this.makeApiRequest('/analyticsadmin/v1beta/accounts')
      return true
    } catch (error) {
      return false
    }
  }
  
  async getRateLimitInfo(): Promise<{ remaining: number; reset: number }> {
    // Google Analytics 4 não fornece informações detalhadas de rate limit via API
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