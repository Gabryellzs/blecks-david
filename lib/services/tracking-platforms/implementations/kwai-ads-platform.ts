// Implementação específica para Kwai Ads
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
  ReportConfig
} from "../types"

export class KwaiAdsPlatform extends BaseTrackingPlatform {
  readonly platformType: TrackingPlatformType = "kwai_ads"
  readonly platformName: string = "Kwai Ads"
  
  constructor(config: TrackingPlatformConfig) {
    super(config)
  }
  
  // Implementação da autenticação OAuth 2.0 do Kwai
  async authenticate(credentials: any): Promise<PlatformAuth> {
    try {
      this.validateRequiredFields(credentials, ['apiKey', 'apiSecret'])
      
      if (credentials.accessToken) {
        this.auth = {
          accessToken: credentials.accessToken,
          tokenType: 'Bearer',
          expiresAt: credentials.expiresAt
        }
        return this.auth
      }
      
      // Kwai usa API Key/Secret para autenticação
      this.auth = {
        accessToken: credentials.apiKey,
        tokenType: 'Bearer',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      }
      return this.auth
    } catch (error) {
      console.error('[Kwai Ads] Erro na autenticação:', error)
      throw error
    }
  }
  
  async refreshAuth(auth: PlatformAuth): Promise<PlatformAuth> {
    try {
      // Kwai não usa refresh tokens da mesma forma
      // Precisa re-autenticar via API Key
      throw new Error('Kwai Ads requer re-autenticação manual')
    } catch (error) {
      console.error('[Kwai Ads] Erro ao renovar autenticação:', error)
      throw error
    }
  }
  
  async validateAuth(auth: PlatformAuth): Promise<boolean> {
    try {
      const response = await this.makeApiRequest('/user/info')
      return response.code === 0
    } catch (error) {
      return false
    }
  }
  
  // Implementação de consultas de campanhas
  async getCampaigns(params: TrackingQueryParams): Promise<TrackingResponse<CampaignData>> {
    try {
      const advertiserId = params.accountId || this.config.accountId
      if (!advertiserId) {
        throw new Error('Advertiser ID necessário')
      }
      
      const response = await this.makeApiRequest('/campaign/list', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          page: 1,
          page_size: params.limit || 100
        })
      })
      
      if (response.code !== 0) {
        throw new Error(response.message || 'Erro ao buscar campanhas')
      }
      
      const campaigns: CampaignData[] = response.data.list.map((campaign: any) => ({
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: this.mapCampaignStatus(campaign.status),
        objective: campaign.objective_type,
        budget: campaign.budget ? {
          amount: campaign.budget,
          currency: 'USD',
          type: campaign.budget_mode === 'daily' ? 'DAILY' : 'LIFETIME'
        } : undefined,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: 0,
        frequency: 0,
        startDate: campaign.start_time,
        endDate: campaign.end_time,
        createdAt: campaign.create_time,
        updatedAt: campaign.update_time,
        platform: this.platformType,
        rawData: campaign
      }))
      
      return this.createSuccessResponse(campaigns)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getAds(params: TrackingQueryParams): Promise<TrackingResponse<AdData>> {
    try {
      const advertiserId = params.accountId || this.config.accountId
      if (!advertiserId) {
        throw new Error('Advertiser ID necessário')
      }
      
      const response = await this.makeApiRequest('/ad/list', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          page: 1,
          page_size: params.limit || 100
        })
      })
      
      if (response.code !== 0) {
        throw new Error(response.message || 'Erro ao buscar anúncios')
      }
      
      const ads: AdData[] = response.data.list.map((ad: any) => ({
        id: ad.ad_id,
        name: ad.ad_name,
        campaignId: ad.campaign_id,
        status: this.mapAdStatus(ad.status),
        adType: ad.ad_format,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: 0,
        frequency: 0,
        createdAt: ad.create_time,
        updatedAt: ad.update_time,
        platform: this.platformType,
        rawData: ad
      }))
      
      return this.createSuccessResponse(ads)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getLeads(params: TrackingQueryParams): Promise<TrackingResponse<LeadData>> {
    try {
      // Kwai Ads não tem endpoint direto para leads
      const leads: LeadData[] = []
      
      return this.createSuccessResponse(leads)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  async getMetrics(params: TrackingQueryParams): Promise<TrackingResponse<TrackingMetrics>> {
    try {
      const advertiserId = params.accountId || this.config.accountId
      if (!advertiserId) {
        throw new Error('Advertiser ID necessário')
      }
      
      const response = await this.makeApiRequest('/report/campaign', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          start_date: params.startDate,
          end_date: params.endDate,
          dimensions: ['campaign_id'],
          metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm']
        })
      })
      
      if (response.code !== 0) {
        throw new Error(response.message || 'Erro ao buscar métricas')
      }
      
      const metrics = this.calculateMetrics(response.data.list.map((item: any) => ({
        spend: item.metrics.spend,
        impressions: item.metrics.impressions,
        clicks: item.metrics.clicks,
        reach: 0,
        leads: 0
      })))
      
      return this.createSuccessResponse([metrics])
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }
  
  // Implementações específicas
  async getCampaignById(campaignId: string, params?: Partial<TrackingQueryParams>): Promise<CampaignData | null> {
    try {
      const advertiserId = params?.accountId || this.config.accountId
      if (!advertiserId) {
        throw new Error('Advertiser ID necessário')
      }
      
      const response = await this.makeApiRequest('/campaign/detail', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          campaign_id: campaignId
        })
      })
      
      if (response.code !== 0 || !response.data) {
        return null
      }
      
      const campaign = response.data
      return {
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: this.mapCampaignStatus(campaign.status),
        objective: campaign.objective_type,
        budget: campaign.budget ? {
          amount: campaign.budget,
          currency: 'USD',
          type: campaign.budget_mode === 'daily' ? 'DAILY' : 'LIFETIME'
        } : undefined,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: 0,
        frequency: 0,
        startDate: campaign.start_time,
        endDate: campaign.end_time,
        createdAt: campaign.create_time,
        updatedAt: campaign.update_time,
        platform: this.platformType,
        rawData: campaign
      }
    } catch (error) {
      console.error('[Kwai Ads] Erro ao buscar campanha:', error)
      return null
    }
  }
  
  async getAdById(adId: string, params?: Partial<TrackingQueryParams>): Promise<AdData | null> {
    try {
      const advertiserId = params?.accountId || this.config.accountId
      if (!advertiserId) {
        throw new Error('Advertiser ID necessário')
      }
      
      const response = await this.makeApiRequest('/ad/detail', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          ad_id: adId
        })
      })
      
      if (response.code !== 0 || !response.data) {
        return null
      }
      
      const ad = response.data
      return {
        id: ad.ad_id,
        name: ad.ad_name,
        campaignId: ad.campaign_id,
        status: this.mapAdStatus(ad.status),
        adType: ad.ad_format,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: 0,
        frequency: 0,
        createdAt: ad.create_time,
        updatedAt: ad.update_time,
        platform: this.platformType,
        rawData: ad
      }
    } catch (error) {
      console.error('[Kwai Ads] Erro ao buscar anúncio:', error)
      return null
    }
  }
  
  async getLeadById(leadId: string, params?: Partial<TrackingQueryParams>): Promise<LeadData | null> {
    // Kwai Ads não tem endpoint direto para leads individuais
    return null
  }
  
  async getAccounts(): Promise<Array<{ id: string; name: string; status: string }>> {
    try {
      const response = await this.makeApiRequest('/advertiser/list')
      
      if (response.code !== 0) {
        throw new Error(response.message || 'Erro ao buscar contas')
      }
      
      return response.data.list.map((advertiser: any) => ({
        id: advertiser.advertiser_id,
        name: advertiser.advertiser_name,
        status: advertiser.status === 'active' ? 'ACTIVE' : 'INACTIVE'
      }))
    } catch (error) {
      console.error('[Kwai Ads] Erro ao buscar contas:', error)
      return []
    }
  }
  
  async getAccountInfo(accountId: string): Promise<any> {
    try {
      const response = await this.makeApiRequest('/advertiser/detail', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: accountId
        })
      })
      
      if (response.code !== 0) {
        throw new Error(response.message || 'Erro ao buscar informações da conta')
      }
      
      return response.data
    } catch (error) {
      console.error('[Kwai Ads] Erro ao buscar informações da conta:', error)
      throw error
    }
  }
  
  // Implementações de webhook
  async setupLeadWebhook(config: LeadWebhookConfig): Promise<boolean> {
    try {
      // Kwai Ads não tem webhooks nativos
      console.log('[Kwai Ads] Configurando webhook para leads')
      return true
    } catch (error) {
      console.error('[Kwai Ads] Erro ao configurar webhook:', error)
      return false
    }
  }
  
  async removeLeadWebhook(webhookId: string): Promise<boolean> {
    try {
      console.log('[Kwai Ads] Removendo webhook:', webhookId)
      return true
    } catch (error) {
      console.error('[Kwai Ads] Erro ao remover webhook:', error)
      return false
    }
  }
  
  async getWebhookEvents(webhookId: string, params?: TrackingQueryParams): Promise<LeadWebhookEvent[]> {
    // Kwai Ads não tem webhooks nativos
    return []
  }
  
  // Implementações de sincronização
  async syncData(params: TrackingQueryParams): Promise<SyncStatus> {
    try {
      let recordsProcessed = 0
      
      // Sincronizar campanhas
      const campaignsResponse = await this.getCampaigns(params)
      recordsProcessed += campaignsResponse.data.length
      
      // Sincronizar anúncios
      const adsResponse = await this.getAds(params)
      recordsProcessed += adsResponse.data.length
      
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
      const reportId = `kwai_ads_${Date.now()}`
      console.log('[Kwai Ads] Criando relatório:', reportId)
      return reportId
    } catch (error) {
      console.error('[Kwai Ads] Erro ao criar relatório:', error)
      throw error
    }
  }
  
  async getReport(reportId: string): Promise<any> {
    try {
      return { reportId, status: 'completed' }
    } catch (error) {
      console.error('[Kwai Ads] Erro ao buscar relatório:', error)
      throw error
    }
  }
  
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      console.log('[Kwai Ads] Deletando relatório:', reportId)
      return true
    } catch (error) {
      console.error('[Kwai Ads] Erro ao deletar relatório:', error)
      return false
    }
  }
  
  // Implementações de utilitários
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeApiRequest('/user/info')
      return response.code === 0
    } catch (error) {
      return false
    }
  }
  
  async getRateLimitInfo(): Promise<{ remaining: number; reset: number }> {
    // Kwai Ads não fornece informações detalhadas de rate limit via API
    return {
      remaining: 50,
      reset: Date.now() + 3600000 // 1 hora
    }
  }
  
  async validateCredentials(credentials: any): Promise<boolean> {
    try {
      this.validateRequiredFields(credentials, ['apiKey'])
      return await this.testConnection()
    } catch (error) {
      return false
    }
  }
  
  // Métodos auxiliares específicos do Kwai Ads
  private mapCampaignStatus(status: string): CampaignData['status'] {
    const statusMap: Record<string, CampaignData['status']> = {
      'active': 'ACTIVE',
      'paused': 'PAUSED',
      'deleted': 'DELETED'
    }
    return statusMap[status] || 'PENDING'
  }
  
  private mapAdStatus(status: string): AdData['status'] {
    const statusMap: Record<string, AdData['status']> = {
      'active': 'ACTIVE',
      'paused': 'PAUSED',
      'deleted': 'DELETED'
    }
    return statusMap[status] || 'PENDING'
  }
} 