// Arquivo de índice para exportar todos os componentes do serviço de tracking

// Tipos e interfaces
export type {
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

// Interfaces e classes base
export type { ITrackingPlatform } from "./base-platform"
export { BaseTrackingPlatform } from "./base-platform"

// Factory e utilitários
export { TrackingPlatformFactory, createTrackingPlatform } from "./platform-factory"

// Serviço principal
export { TrackingService } from "./tracking-service"

// Implementações específicas
export { MetaAdsPlatform } from "./implementations/meta-ads-platform"
export { GoogleAdsPlatform } from "./implementations/google-ads-platform"
export { TikTokAdsPlatform } from "./implementations/tiktok-ads-platform"
export { KwaiAdsPlatform } from "./implementations/kwai-ads-platform"

// Utilitários para uso comum
export const TRACKING_PLATFORMS = {
  META_ADS: "meta_ads" as const,
  GOOGLE_ADS: "google_ads" as const,
  TIKTOK_ADS: "tiktok_ads" as const,
  KWAI_ADS: "kwai_ads" as const,
  PINTEREST_ADS: "pinterest_ads" as const,
  LINKEDIN_ADS: "linkedin_ads" as const,
  TWITTER_ADS: "twitter_ads" as const,
  SNAPCHAT_ADS: "snapchat_ads" as const
} as const

// Configurações padrão para cada plataforma
export const DEFAULT_PLATFORM_CONFIGS = {
  meta_ads: {
    name: "Meta Ads",
    color: "#1877F2",
    baseUrl: "https://graph.facebook.com/v23.0",
    scopes: ["ads_read", "ads_management", "business_management"],
    rateLimit: { requestsPerMinute: 200, requestsPerHour: 10000 }
  },
  google_ads: {
    name: "Google Ads",
    color: "#4285F4",
    baseUrl: "https://googleads.googleapis.com/v14",
    scopes: ["https://www.googleapis.com/auth/adwords"],
    rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 }
  },
  tiktok_ads: {
    name: "TikTok Ads",
    color: "#000000",
    baseUrl: "https://business-api.tiktok.com/open_api/v1.3",
    scopes: ["user.info.basic", "user.info.stats", "user.info.email"],
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 }
  },
  kwai_ads: {
    name: "Kwai Ads",
    color: "#FF6B35",
    baseUrl: "https://api.kwai.com/v1",
    scopes: ["ads_read", "ads_management"],
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 }
  }
} as const

// Função utilitária para criar serviço com múltiplas plataformas
export async function createTrackingService(
  platformConfigs: Array<{
    type: import("./types").TrackingPlatformType
    config: Partial<import("./types").TrackingPlatformConfig>
  }>
): Promise<import("./tracking-service").TrackingService> {
  const { TrackingService } = await import("./tracking-service")
  const service = new TrackingService()
  
  // Adicionar plataformas de forma assíncrona
  for (const { type, config } of platformConfigs) {
    await service.addPlatform(type, config)
  }
  
  return service
}

// Função utilitária para validar configuração de plataforma
export async function validatePlatformConfig(
  platformType: import("./types").TrackingPlatformType,
  config: Partial<import("./types").TrackingPlatformConfig>
): Promise<{ isValid: boolean; errors: string[] }> {
  const { TrackingPlatformFactory } = await import("./platform-factory")
  return TrackingPlatformFactory.validateConfig(platformType, config)
}

// Função utilitária para obter configuração padrão
export async function getDefaultPlatformConfig(
  platformType: import("./types").TrackingPlatformType
): Promise<Partial<import("./types").TrackingPlatformConfig>> {
  const { TrackingPlatformFactory } = await import("./platform-factory")
  return TrackingPlatformFactory.getDefaultConfig(platformType)
}

// Função utilitária para listar plataformas disponíveis
export async function getAvailablePlatforms(): Promise<import("./types").TrackingPlatformType[]> {
  const { TrackingPlatformFactory } = await import("./platform-factory")
  return TrackingPlatformFactory.getAvailablePlatforms()
}

// Função utilitária para verificar se plataforma é suportada
export async function isPlatformSupported(platformType: import("./types").TrackingPlatformType): Promise<boolean> {
  const { TrackingPlatformFactory } = await import("./platform-factory")
  return TrackingPlatformFactory.isPlatformSupported(platformType)
} 