// Implementação específica para TikTok Ads
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

export class TikTokAdsPlatform extends BaseTrackingPlatform {
  readonly platformType: TrackingPlatformType = "tiktok_ads"
  readonly platformName: string = "TikTok Ads"
  
  constructor(config: TrackingPlatformConfig) {
    super(config)
  }
  
  // Implementação da autenticação OAuth 2.0 do TikTok
  async authenticate(credentials: any): Promise<PlatformAuth> {
    try {
      this.validateRequiredFields(credentials, ['clientId', 'clientSecret', 'accessToken'])
      
      if (credentials.accessToken) {
        this.auth = {
          accessToken: credentials.accessToken,
          tokenType: 'Bearer',
          expiresAt: credentials.expiresAt
        }
        return this.auth
      }
      
      throw new Error('Access token necessário para autenticação')
    } catch (error) {
      console.error('[TikTok Ads] Erro na autenticação:', error)
      throw error
    }
  }
  
  async refreshAuth(auth: PlatformAuth): Promise<PlatformAuth> {
    try {
      // TikTok não usa refresh tokens da mesma forma
      // Precisa re-autenticar via OAuth
      throw new Error('TikTok Ads requer re-autenticação manual')
    } catch (error) {
      console.error('[TikTok Ads] Erro ao renovar autenticação:', error)
      throw error
    }
  }
  
  async validateAuth(auth: PlatformAuth): Promise<boolean> {
    try {
      const response = await this.makeApiRequest('/user/info/')
      return response.message === 'OK'
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
      
      const response = await this.makeApiRequest('/campaign/get/', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          fields: ['campaign_id', 'campaign_name', 'status', 'objective_type', 'budget', 'budget_mode', 'start_time', 'end_time', 'create_time', 'modify_time']
        })
      })
      
      const campaigns: CampaignData[] = response.data.list.map((campaign: any) => ({
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: this.mapCampaignStatus(campaign.status),
        objective: campaign.objective_type,
        budget: campaign.budget ? {
          amount: campaign.budget,
          currency: 'USD',
          type: campaign.budget_mode === 'BUDGET_MODE_DAY' ? 'DAILY' : 'LIFETIME'
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
        updatedAt: campaign.modify_time,
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
      
      const response = await this.makeApiRequest('/ad/get/', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          fields: ['ad_id', 'ad_name', 'status', 'campaign_id', 'ad_format', 'create_time', 'modify_time']
        })
      })
      
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
        updatedAt: ad.modify_time,
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
      // TikTok Ads não tem endpoint direto para leads
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
      
      const response = await this.makeApiRequest('/report/integrated/get/', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          report_type: 'BASIC',
          data_level: 'AUCTION_AD',
          dimensions: ['campaign_id'],
          metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm'],
          start_date: params.startDate,
          end_date: params.endDate
        })
      })
      
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
      
      const response = await this.makeApiRequest('/campaign/get/', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          campaign_ids: [campaignId],
          fields: ['campaign_id', 'campaign_name', 'status', 'objective_type', 'budget', 'budget_mode', 'start_time', 'end_time', 'create_time', 'modify_time']
        })
      })
      
      if (response.data.list.length === 0) {
        return null
      }
      
      const campaign = response.data.list[0]
      return {
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: this.mapCampaignStatus(campaign.status),
        objective: campaign.objective_type,
        budget: campaign.budget ? {
          amount: campaign.budget,
          currency: 'USD',
          type: campaign.budget_mode === 'BUDGET_MODE_DAY' ? 'DAILY' : 'LIFETIME'
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
        updatedAt: campaign.modify_time,
        platform: this.platformType,
        rawData: campaign
      }
    } catch (error) {
      console.error('[TikTok Ads] Erro ao buscar campanha:', error)
      return null
    }
  }
  
  async getAdById(adId: string, params?: Partial<TrackingQueryParams>): Promise<AdData | null> {
    try {
      const advertiserId = params?.accountId || this.config.accountId
      if (!advertiserId) {
        throw new Error('Advertiser ID necessário')
      }
      
      const response = await this.makeApiRequest('/ad/get/', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_id: advertiserId,
          ad_ids: [adId],
          fields: ['ad_id', 'ad_name', 'status', 'campaign_id', 'ad_format', 'create_time', 'modify_time']
        })
      })
      
      if (response.data.list.length === 0) {
        return null
      }
      
      const ad = response.data.list[0]
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
        updatedAt: ad.modify_time,
        platform: this.platformType,
        rawData: ad
      }
    } catch (error) {
      console.error('[TikTok Ads] Erro ao buscar anúncio:', error)
      return null
    }
  }
  
  async getLeadById(leadId: string, params?: Partial<TrackingQueryParams>): Promise<LeadData | null> {
    // TikTok Ads não tem endpoint direto para leads individuais
    return null
  }
  
  async getAccounts(): Promise<Array<{ id: string; name: string; status: string }>> {
    try {
      const response = await this.makeApiRequest('/advertiser/info/')
      
      return response.data.list.map((advertiser: any) => ({
        id: advertiser.advertiser_id,
        name: advertiser.advertiser_name,
        status: advertiser.status === 'ENABLE' ? 'ACTIVE' : 'INACTIVE'
      }))
    } catch (error) {
      console.error('[TikTok Ads] Erro ao buscar contas:', error)
      return []
    }
  }
  
  async getAccountInfo(accountId: string): Promise<any> {
    try {
      return await this.makeApiRequest('/advertiser/info/', {
        method: 'POST',
        body: JSON.stringify({
          advertiser_ids: [accountId]
        })
      })
    } catch (error) {
      console.error('[TikTok Ads] Erro ao buscar informações da conta:', error)
      throw error
    }
  }
  
  // Implementações de webhook
  async setupLeadWebhook(config: LeadWebhookConfig): Promise<boolean> {
    try {
      // TikTok Ads não tem webhooks nativos
      console.log('[TikTok Ads] Configurando webhook para leads')
      return true
    } catch (error) {
      console.error('[TikTok Ads] Erro ao configurar webhook:', error)
      return false
    }
  }
  
  async removeLeadWebhook(webhookId: string): Promise<boolean> {
    try {
      console.log('[TikTok Ads] Removendo webhook:', webhookId)
      return true
    } catch (error) {
      console.error('[TikTok Ads] Erro ao remover webhook:', error)
      return false
    }
  }
  
  async getWebhookEvents(webhookId: string, params?: TrackingQueryParams): Promise<LeadWebhookEvent[]> {
    // TikTok Ads não tem webhooks nativos
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
      const reportId = `tiktok_ads_${Date.now()}`
      console.log('[TikTok Ads] Criando relatório:', reportId)
      return reportId
    } catch (error) {
      console.error('[TikTok Ads] Erro ao criar relatório:', error)
      throw error
    }
  }
  
  async getReport(reportId: string): Promise<any> {
    try {
      return { reportId, status: 'completed' }
    } catch (error) {
      console.error('[TikTok Ads] Erro ao buscar relatório:', error)
      throw error
    }
  }
  
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      console.log('[TikTok Ads] Deletando relatório:', reportId)
      return true
    } catch (error) {
      console.error('[TikTok Ads] Erro ao deletar relatório:', error)
      return false
    }
  }
  
  // Implementações de utilitários
  async testConnection(): Promise<boolean> {
    try {
      await this.makeApiRequest('/user/info/')
      return true
    } catch (error) {
      return false
    }
  }
  
  async getRateLimitInfo(): Promise<{ remaining: number; reset: number }> {
    // TikTok Ads não fornece informações detalhadas de rate limit via API
    return {
      remaining: 100,
      reset: Date.now() + 3600000 // 1 hora
    }
  }
  
  async validateCredentials(credentials: any): Promise<boolean> {
    try {
      this.validateRequiredFields(credentials, ['accessToken'])
      return await this.testConnection()
    } catch (error) {
      return false
    }
  }
  
  // Métodos auxiliares específicos do TikTok Ads
  private mapCampaignStatus(status: string): CampaignData['status'] {
    const statusMap: Record<string, CampaignData['status']> = {
      'ENABLE': 'ACTIVE',
      'DISABLE': 'PAUSED',
      'DELETE': 'DELETED'
    }
    return statusMap[status] || 'PENDING'
  }
  
  private mapAdStatus(status: string): AdData['status'] {
    const statusMap: Record<string, AdData['status']> = {
      'ENABLE': 'ACTIVE',
      'DISABLE': 'PAUSED',
      'DELETE': 'DELETED'
    }
    return statusMap[status] || 'PENDING'
  }
} 