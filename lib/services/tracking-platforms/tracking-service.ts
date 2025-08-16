// Serviço principal para gerenciar plataformas de tracking
// Seguindo o princípio de responsabilidade única (SRP)

import type { ITrackingPlatform } from "./base-platform"
import type {
  TrackingPlatformType,
  TrackingPlatformConfig,
  TrackingQueryParams,
  TrackingResponse,
  CampaignData,
  AdData,
  LeadData,
  TrackingMetrics,
  SyncStatus,
  ReportConfig
} from "./types"
import { TrackingPlatformFactory } from "./platform-factory"

export class TrackingService {
  private platforms: Map<TrackingPlatformType, ITrackingPlatform> = new Map()
  private syncStatus: Map<TrackingPlatformType, SyncStatus> = new Map()
  
  constructor() {}
  
  /**
   * Adiciona uma plataforma ao serviço
   */
  async addPlatform(
    platformType: TrackingPlatformType,
    config: Partial<TrackingPlatformConfig>
  ): Promise<boolean> {
    try {
      const platform = TrackingPlatformFactory.createPlatform(platformType, config)
      this.platforms.set(platformType, platform)
      
      // Testar conexão
      const isConnected = await platform.testConnection()
      if (!isConnected) {
        console.warn(`[TrackingService] Falha na conexão com ${platformType}`)
      }
      
      return true
    } catch (error) {
      console.error(`[TrackingService] Erro ao adicionar plataforma ${platformType}:`, error)
      return false
    }
  }
  
  /**
   * Remove uma plataforma do serviço
   */
  removePlatform(platformType: TrackingPlatformType): boolean {
    const removed = this.platforms.delete(platformType)
    this.syncStatus.delete(platformType)
    return removed
  }
  
  /**
   * Obtém uma plataforma específica
   */
  getPlatform(platformType: TrackingPlatformType): ITrackingPlatform | undefined {
    return this.platforms.get(platformType)
  }
  
  /**
   * Lista todas as plataformas configuradas
   */
  getConfiguredPlatforms(): TrackingPlatformType[] {
    return Array.from(this.platforms.keys())
  }
  
  /**
   * Obtém dados de campanhas de todas as plataformas
   */
  async getAllCampaigns(params: TrackingQueryParams): Promise<TrackingResponse<CampaignData>> {
    const allCampaigns: CampaignData[] = []
    const errors: string[] = []
    
    for (const [platformType, platform] of this.platforms) {
      try {
        const response = await platform.getCampaigns(params)
        if (response.success) {
          allCampaigns.push(...response.data)
        } else {
          errors.push(`${platformType}: ${response.error?.message}`)
        }
      } catch (error) {
        errors.push(`${platformType}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      data: allCampaigns,
      error: errors.length > 0 ? {
        code: 'MULTIPLE_PLATFORM_ERRORS',
        message: `Erros em ${errors.length} plataforma(s)`,
        details: errors
      } : undefined,
      metadata: {
        timestamp: Date.now(),
        platform: 'multiple' as TrackingPlatformType
      }
    }
  }
  
  /**
   * Obtém dados de anúncios de todas as plataformas
   */
  async getAllAds(params: TrackingQueryParams): Promise<TrackingResponse<AdData>> {
    const allAds: AdData[] = []
    const errors: string[] = []
    
    for (const [platformType, platform] of this.platforms) {
      try {
        const response = await platform.getAds(params)
        if (response.success) {
          allAds.push(...response.data)
        } else {
          errors.push(`${platformType}: ${response.error?.message}`)
        }
      } catch (error) {
        errors.push(`${platformType}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      data: allAds,
      error: errors.length > 0 ? {
        code: 'MULTIPLE_PLATFORM_ERRORS',
        message: `Erros em ${errors.length} plataforma(s)`,
        details: errors
      } : undefined,
      metadata: {
        timestamp: Date.now(),
        platform: 'multiple' as TrackingPlatformType
      }
    }
  }
  
  /**
   * Obtém dados de leads de todas as plataformas
   */
  async getAllLeads(params: TrackingQueryParams): Promise<TrackingResponse<LeadData>> {
    const allLeads: LeadData[] = []
    const errors: string[] = []
    
    for (const [platformType, platform] of this.platforms) {
      try {
        const response = await platform.getLeads(params)
        if (response.success) {
          allLeads.push(...response.data)
        } else {
          errors.push(`${platformType}: ${response.error?.message}`)
        }
      } catch (error) {
        errors.push(`${platformType}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      data: allLeads,
      error: errors.length > 0 ? {
        code: 'MULTIPLE_PLATFORM_ERRORS',
        message: `Erros em ${errors.length} plataforma(s)`,
        details: errors
      } : undefined,
      metadata: {
        timestamp: Date.now(),
        platform: 'multiple' as TrackingPlatformType
      }
    }
  }
  
  /**
   * Obtém métricas consolidadas de todas as plataformas
   */
  async getAllMetrics(params: TrackingQueryParams): Promise<TrackingResponse<TrackingMetrics>> {
    const allMetrics: TrackingMetrics[] = []
    const errors: string[] = []
    
    for (const [platformType, platform] of this.platforms) {
      try {
        const response = await platform.getMetrics(params)
        if (response.success) {
          allMetrics.push(...response.data)
        } else {
          errors.push(`${platformType}: ${response.error?.message}`)
        }
      } catch (error) {
        errors.push(`${platformType}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }
    
    // Consolidar métricas de todas as plataformas
    const consolidatedMetrics = this.consolidateMetrics(allMetrics)
    
    return {
      success: errors.length === 0,
      data: [consolidatedMetrics],
      error: errors.length > 0 ? {
        code: 'MULTIPLE_PLATFORM_ERRORS',
        message: `Erros em ${errors.length} plataforma(s)`,
        details: errors
      } : undefined,
      metadata: {
        timestamp: Date.now(),
        platform: 'multiple' as TrackingPlatformType
      }
    }
  }
  
  /**
   * Sincroniza dados de todas as plataformas
   */
  async syncAllPlatforms(params: TrackingQueryParams): Promise<SyncStatus[]> {
    const syncResults: SyncStatus[] = []
    
    for (const [platformType, platform] of this.platforms) {
      try {
        const status = await platform.syncData(params)
        this.syncStatus.set(platformType, status)
        syncResults.push(status)
      } catch (error) {
        const errorStatus: SyncStatus = {
          platform: platformType,
          lastSync: new Date(),
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
        this.syncStatus.set(platformType, errorStatus)
        syncResults.push(errorStatus)
      }
    }
    
    return syncResults
  }
  
  /**
   * Obtém status de sincronização de todas as plataformas
   */
  async getAllSyncStatus(): Promise<SyncStatus[]> {
    const allStatus: SyncStatus[] = []
    
    for (const [platformType, platform] of this.platforms) {
      try {
        const status = await platform.getSyncStatus()
        allStatus.push(status)
      } catch (error) {
        allStatus.push({
          platform: platformType,
          lastSync: new Date(),
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }
    
    return allStatus
  }
  
  /**
   * Testa conexão com todas as plataformas
   */
  async testAllConnections(): Promise<Record<TrackingPlatformType, boolean>> {
    const results: Record<TrackingPlatformType, boolean> = {} as Record<TrackingPlatformType, boolean>
    
    for (const [platformType, platform] of this.platforms) {
      try {
        results[platformType] = await platform.testConnection()
      } catch (error) {
        results[platformType] = false
      }
    }
    
    return results
  }
  
  /**
   * Obtém informações de rate limit de todas as plataformas
   */
  async getAllRateLimitInfo(): Promise<Record<TrackingPlatformType, { remaining: number; reset: number }>> {
    const results: Record<TrackingPlatformType, { remaining: number; reset: number }> = {} as Record<TrackingPlatformType, { remaining: number; reset: number }>
    
    for (const [platformType, platform] of this.platforms) {
      try {
        results[platformType] = await platform.getRateLimitInfo()
      } catch (error) {
        results[platformType] = { remaining: 0, reset: Date.now() }
      }
    }
    
    return results
  }
  
  /**
   * Cria relatórios em todas as plataformas
   */
  async createReportsInAllPlatforms(config: ReportConfig): Promise<Record<TrackingPlatformType, string>> {
    const results: Record<TrackingPlatformType, string> = {} as Record<TrackingPlatformType, string>
    
    for (const [platformType, platform] of this.platforms) {
      try {
        const reportConfig = { ...config, platform: platformType }
        results[platformType] = await platform.createReport(reportConfig)
      } catch (error) {
        results[platformType] = `error: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
    
    return results
  }
  
  /**
   * Obtém dados de uma plataforma específica
   */
  async getPlatformData<T>(
    platformType: TrackingPlatformType,
    dataType: 'campaigns' | 'ads' | 'leads' | 'metrics',
    params: TrackingQueryParams
  ): Promise<TrackingResponse<T>> {
    const platform = this.platforms.get(platformType)
    
    if (!platform) {
      return {
        success: false,
        data: [],
        error: {
          code: 'PLATFORM_NOT_FOUND',
          message: `Plataforma ${platformType} não encontrada`
        },
        metadata: {
          timestamp: Date.now(),
          platform: platformType
        }
      }
    }
    
    try {
      switch (dataType) {
        case 'campaigns':
          return await platform.getCampaigns(params) as TrackingResponse<T>
        case 'ads':
          return await platform.getAds(params) as TrackingResponse<T>
        case 'leads':
          return await platform.getLeads(params) as TrackingResponse<T>
        case 'metrics':
          return await platform.getMetrics(params) as TrackingResponse<T>
        default:
          throw new Error(`Tipo de dados não suportado: ${dataType}`)
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: {
          code: 'PLATFORM_ERROR',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        metadata: {
          timestamp: Date.now(),
          platform: platformType
        }
      }
    }
  }
  
  /**
   * Filtra dados por plataforma
   */
  filterDataByPlatform<T>(data: T[], platform: TrackingPlatformType): T[] {
    return data.filter((item: any) => item.platform === platform)
  }
  
  /**
   * Agrupa dados por plataforma
   */
  groupDataByPlatform<T>(data: T[]): Record<TrackingPlatformType, T[]> {
    const grouped: Record<TrackingPlatformType, T[]> = {} as Record<TrackingPlatformType, T[]>
    
    for (const item of data) {
      const platform = (item as any).platform as TrackingPlatformType
      if (!grouped[platform]) {
        grouped[platform] = []
      }
      grouped[platform].push(item)
    }
    
    return grouped
  }
  
  /**
   * Consolida métricas de múltiplas plataformas
   */
  private consolidateMetrics(metrics: TrackingMetrics[]): TrackingMetrics {
    if (metrics.length === 0) {
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
    
    const totals = metrics.reduce((acc, metric) => ({
      spend: acc.spend + metric.totalSpend,
      impressions: acc.impressions + metric.totalImpressions,
      clicks: acc.clicks + metric.totalClicks,
      reach: acc.reach + metric.totalReach,
      leads: acc.leads + metric.totalLeads
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
  
  /**
   * Limpa recursos e desconecta plataformas
   */
  async cleanup(): Promise<void> {
    this.platforms.clear()
    this.syncStatus.clear()
  }
} 