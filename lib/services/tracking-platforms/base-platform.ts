// Interface base para plataformas de tracking
// Seguindo o princípio de inversão de dependência (DIP)

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
} from "./types"

// Interface base que define o contrato para todas as plataformas
export interface ITrackingPlatform {
  // Identificação da plataforma
  readonly platformType: TrackingPlatformType
  readonly platformName: string
  
  // Configuração
  getConfig(): TrackingPlatformConfig
  updateConfig(config: Partial<TrackingPlatformConfig>): Promise<boolean>
  
  // Autenticação
  authenticate(credentials: any): Promise<PlatformAuth>
  refreshAuth(auth: PlatformAuth): Promise<PlatformAuth>
  validateAuth(auth: PlatformAuth): Promise<boolean>
  
  // Consultas de dados
  getCampaigns(params: TrackingQueryParams): Promise<TrackingResponse<CampaignData>>
  getAds(params: TrackingQueryParams): Promise<TrackingResponse<AdData>>
  getLeads(params: TrackingQueryParams): Promise<TrackingResponse<LeadData>>
  getMetrics(params: TrackingQueryParams): Promise<TrackingResponse<TrackingMetrics>>
  
  // Consultas específicas
  getCampaignById(campaignId: string, params?: Partial<TrackingQueryParams>): Promise<CampaignData | null>
  getAdById(adId: string, params?: Partial<TrackingQueryParams>): Promise<AdData | null>
  getLeadById(leadId: string, params?: Partial<TrackingQueryParams>): Promise<LeadData | null>
  
  // Contas e configurações
  getAccounts(): Promise<Array<{ id: string; name: string; status: string }>>
  getAccountInfo(accountId: string): Promise<any>
  
  // Webhooks
  setupLeadWebhook(config: LeadWebhookConfig): Promise<boolean>
  removeLeadWebhook(webhookId: string): Promise<boolean>
  getWebhookEvents(webhookId: string, params?: TrackingQueryParams): Promise<LeadWebhookEvent[]>
  
  // Sincronização
  syncData(params: TrackingQueryParams): Promise<SyncStatus>
  getSyncStatus(): Promise<SyncStatus>
  
  // Relatórios
  createReport(config: ReportConfig): Promise<string>
  getReport(reportId: string): Promise<any>
  deleteReport(reportId: string): Promise<boolean>
  
  // Utilitários
  testConnection(): Promise<boolean>
  getRateLimitInfo(): Promise<{ remaining: number; reset: number }>
  validateCredentials(credentials: any): Promise<boolean>
}

// Classe base abstrata que implementa funcionalidades comuns
export abstract class BaseTrackingPlatform implements ITrackingPlatform {
  protected config: TrackingPlatformConfig
  protected auth: PlatformAuth | null = null
  
  constructor(config: TrackingPlatformConfig) {
    this.config = config
  }
  
  // Propriedades abstratas que devem ser implementadas
  abstract readonly platformType: TrackingPlatformType
  abstract readonly platformName: string
  
  // Implementações base com funcionalidades comuns
  getConfig(): TrackingPlatformConfig {
    return { ...this.config }
  }
  
  async updateConfig(newConfig: Partial<TrackingPlatformConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...newConfig }
      return true
    } catch (error) {
      console.error(`[${this.platformName}] Erro ao atualizar configuração:`, error)
      return false
    }
  }
  
  // Métodos que devem ser implementados pelas classes concretas
  abstract authenticate(credentials: any): Promise<PlatformAuth>
  abstract refreshAuth(auth: PlatformAuth): Promise<PlatformAuth>
  abstract validateAuth(auth: PlatformAuth): Promise<boolean>
  
  abstract getCampaigns(params: TrackingQueryParams): Promise<TrackingResponse<CampaignData>>
  abstract getAds(params: TrackingQueryParams): Promise<TrackingResponse<AdData>>
  abstract getLeads(params: TrackingQueryParams): Promise<TrackingResponse<LeadData>>
  abstract getMetrics(params: TrackingQueryParams): Promise<TrackingResponse<TrackingMetrics>>
  
  abstract getCampaignById(campaignId: string, params?: Partial<TrackingQueryParams>): Promise<CampaignData | null>
  abstract getAdById(adId: string, params?: Partial<TrackingQueryParams>): Promise<AdData | null>
  abstract getLeadById(leadId: string, params?: Partial<TrackingQueryParams>): Promise<LeadData | null>
  
  abstract getAccounts(): Promise<Array<{ id: string; name: string; status: string }>>
  abstract getAccountInfo(accountId: string): Promise<any>
  
  abstract setupLeadWebhook(config: LeadWebhookConfig): Promise<boolean>
  abstract removeLeadWebhook(webhookId: string): Promise<boolean>
  abstract getWebhookEvents(webhookId: string, params?: TrackingQueryParams): Promise<LeadWebhookEvent[]>
  
  abstract syncData(params: TrackingQueryParams): Promise<SyncStatus>
  abstract getSyncStatus(): Promise<SyncStatus>
  
  abstract createReport(config: ReportConfig): Promise<string>
  abstract getReport(reportId: string): Promise<any>
  abstract deleteReport(reportId: string): Promise<boolean>
  
  abstract testConnection(): Promise<boolean>
  abstract getRateLimitInfo(): Promise<{ remaining: number; reset: number }>
  abstract validateCredentials(credentials: any): Promise<boolean>
  
  // Métodos utilitários protegidos para uso nas implementações
  protected createErrorResponse<T>(error: any): TrackingResponse<T> {
    return {
      success: false,
      data: [],
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'Erro desconhecido',
        details: error
      },
      metadata: {
        timestamp: Date.now(),
        platform: this.platformType
      }
    }
  }
  
  protected createSuccessResponse<T>(data: T[], pagination?: any): TrackingResponse<T> {
    return {
      success: true,
      data,
      pagination,
      metadata: {
        timestamp: Date.now(),
        platform: this.platformType
      }
    }
  }
  
  protected async makeApiRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.auth?.accessToken) {
      throw new Error('Autenticação necessária')
    }
    
    const baseUrl = this.config.baseUrl
    if (!baseUrl) {
      throw new Error('URL base não configurada')
    }
    
    const url = `${baseUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.auth.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`[${this.platformName}] Erro na requisição API:`, error)
      throw error
    }
  }
  
  protected validateRequiredFields(fields: Record<string, any>, required: string[]): void {
    const missing = required.filter(field => !fields[field])
    if (missing.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`)
    }
  }
  
  protected formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }
  
  protected calculateMetrics(data: any[]): TrackingMetrics {
    if (data.length === 0) {
      return {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalReach: 0,
        averageCtr: 0,
        averageCpc: 0,
        averageCpm: 0,
        averageFrequency: 0,
        totalLeads: 0,
        leadCost: 0,
        conversionRate: 0
      }
    }
    
    const totals = data.reduce((acc, item) => ({
      spend: acc.spend + (item.spend || 0),
      impressions: acc.impressions + (item.impressions || 0),
      clicks: acc.clicks + (item.clicks || 0),
      reach: acc.reach + (item.reach || 0),
      leads: acc.leads + (item.leads || 0)
    }), {
      spend: 0,
      impressions: 0,
      clicks: 0,
      reach: 0,
      leads: 0
    })
    
    return {
      totalSpend: totals.spend,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalReach: totals.reach,
      averageCtr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      averageCpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      averageCpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      averageFrequency: totals.reach > 0 ? totals.impressions / totals.reach : 0,
      totalLeads: totals.leads,
      leadCost: totals.leads > 0 ? totals.spend / totals.leads : 0,
      conversionRate: totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0
    }
  }
} 