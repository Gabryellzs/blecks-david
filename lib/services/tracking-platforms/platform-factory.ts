// Factory para criar instâncias de plataformas de tracking
// Seguindo o princípio de responsabilidade única (SRP)

import type { TrackingPlatformType, TrackingPlatformConfig } from "./types"
import type { ITrackingPlatform } from "./base-platform"

// Importar implementações específicas
import { MetaAdsPlatform } from "./implementations/meta-ads-platform"
import { GoogleAnalyticsPlatform } from "./implementations/google-analytics-platform"
import { GoogleAnalytics4Platform } from "./implementations/google-analytics-4-platform"

// Registro de plataformas disponíveis
const PLATFORM_REGISTRY: Record<TrackingPlatformType, new (config: TrackingPlatformConfig) => ITrackingPlatform> = {
  meta_ads: MetaAdsPlatform,
  google_analytics: GoogleAnalyticsPlatform,
  google_analytics_4: GoogleAnalytics4Platform,
  pinterest_ads: MetaAdsPlatform, // Usar implementação do Meta Ads como base
  linkedin_ads: MetaAdsPlatform, // Usar implementação do Meta Ads como base
  twitter_ads: MetaAdsPlatform, // Usar implementação do Meta Ads como base
  snapchat_ads: MetaAdsPlatform, // Usar implementação do Meta Ads como base
  unknown: MetaAdsPlatform // Fallback
}

// Configurações padrão para cada plataforma
const DEFAULT_CONFIGS: Record<TrackingPlatformType, Partial<TrackingPlatformConfig>> = {
  meta_ads: {
    name: "Meta Ads",
    color: "#1877F2",
    baseUrl: "https://graph.facebook.com/v23.0",
    scopes: ["ads_read", "ads_management", "business_management"],
    rateLimit: { requestsPerMinute: 200, requestsPerHour: 10000 }
  },
  google_analytics: {
    name: "Google Analytics",
    color: "#F9AB00",
    baseUrl: "https://analytics.googleapis.com",
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 }
  },
  google_analytics_4: {
    name: "Google Analytics 4",
    color: "#F9AB00",
    baseUrl: "https://analyticsdata.googleapis.com",
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 }
  },
  pinterest_ads: {
    name: "Pinterest Ads",
    color: "#E60023",
    baseUrl: "https://api.pinterest.com/v5",
    scopes: ["ads:read", "ads:write"],
    rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 }
  },
  linkedin_ads: {
    name: "LinkedIn Ads",
    color: "#0A66C2",
    baseUrl: "https://api.linkedin.com/v2",
    scopes: ["r_ads", "rw_ads"],
    rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 }
  },
  twitter_ads: {
    name: "Twitter Ads",
    color: "#1DA1F2",
    baseUrl: "https://api.twitter.com/2",
    scopes: ["tweet.read", "users.read", "offline.access"],
    rateLimit: { requestsPerMinute: 300, requestsPerHour: 15000 }
  },
  snapchat_ads: {
    name: "Snapchat Ads",
    color: "#FFFC00",
    baseUrl: "https://adsapi.snapchat.com/v1",
    scopes: ["snapchat-marketing-api"],
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 }
  },
  unknown: {
    name: "Unknown Platform",
    color: "#6B7280",
    baseUrl: "",
    scopes: [],
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 100 }
  }
}

export class TrackingPlatformFactory {
  /**
   * Cria uma instância de plataforma de tracking
   */
  static createPlatform(
    platformType: TrackingPlatformType,
    config: Partial<TrackingPlatformConfig> = {}
  ): ITrackingPlatform {
    // Verificar se a plataforma está registrada
    if (!PLATFORM_REGISTRY[platformType]) {
      throw new Error(`Plataforma não suportada: ${platformType}`)
    }
    
    // Mesclar configuração padrão com configuração fornecida
    const defaultConfig = DEFAULT_CONFIGS[platformType]
    const mergedConfig: TrackingPlatformConfig = {
      id: platformType,
      enabled: true,
      color: "#000000",
      ...defaultConfig,
      ...config
    } as TrackingPlatformConfig
    
    // Criar instância da plataforma
    const PlatformClass = PLATFORM_REGISTRY[platformType]
    return new PlatformClass(mergedConfig)
  }
  
  /**
   * Lista todas as plataformas disponíveis
   */
  static getAvailablePlatforms(): TrackingPlatformType[] {
    return Object.keys(PLATFORM_REGISTRY) as TrackingPlatformType[]
  }
  
  /**
   * Verifica se uma plataforma é suportada
   */
  static isPlatformSupported(platformType: TrackingPlatformType): boolean {
    return platformType in PLATFORM_REGISTRY
  }
  
  /**
   * Obtém a configuração padrão de uma plataforma
   */
  static getDefaultConfig(platformType: TrackingPlatformType): Partial<TrackingPlatformConfig> {
    return DEFAULT_CONFIGS[platformType] || DEFAULT_CONFIGS.unknown
  }
  
  /**
   * Registra uma nova plataforma
   */
  static registerPlatform(
    platformType: TrackingPlatformType,
    platformClass: new (config: TrackingPlatformConfig) => ITrackingPlatform,
    defaultConfig?: Partial<TrackingPlatformConfig>
  ): void {
    PLATFORM_REGISTRY[platformType] = platformClass
    if (defaultConfig) {
      DEFAULT_CONFIGS[platformType] = defaultConfig
    }
  }
  
  /**
   * Cria múltiplas plataformas baseado em configurações
   */
  static createMultiplePlatforms(
    configs: Array<{ type: TrackingPlatformType; config?: Partial<TrackingPlatformConfig> }>
  ): ITrackingPlatform[] {
    return configs.map(({ type, config }) => 
      this.createPlatform(type, config)
    )
  }
  
  /**
   * Valida configuração de uma plataforma
   */
  static validateConfig(
    platformType: TrackingPlatformType,
    config: Partial<TrackingPlatformConfig>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Verificar se a plataforma é suportada
    if (!this.isPlatformSupported(platformType)) {
      errors.push(`Plataforma não suportada: ${platformType}`)
    }
    
    // Validar campos obrigatórios
    if (!config.name) {
      errors.push("Nome da plataforma é obrigatório")
    }
    
    if (!config.baseUrl) {
      errors.push("URL base é obrigatória")
    }
    
    // Validar configurações específicas por plataforma
    switch (platformType) {
      case "meta_ads":
        if (!config.accessToken && !config.apiKey) {
          errors.push("Meta Ads requer accessToken ou apiKey")
        }
        break
      case "google_ads":
        if (!config.clientId || !config.clientSecret) {
          errors.push("Google Ads requer clientId e clientSecret")
        }
        break
      case "tiktok_ads":
        if (!config.accessToken) {
          errors.push("TikTok Ads requer accessToken")
        }
        break
      case "kwai_ads":
        if (!config.apiKey) {
          errors.push("Kwai Ads requer apiKey")
        }
        break
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Função utilitária para criar plataforma com validação
export function createTrackingPlatform(
  platformType: TrackingPlatformType,
  config: Partial<TrackingPlatformConfig> = {}
): ITrackingPlatform {
  const validation = TrackingPlatformFactory.validateConfig(platformType, config)
  
  if (!validation.isValid) {
    throw new Error(`Configuração inválida: ${validation.errors.join(", ")}`)
  }
  
  return TrackingPlatformFactory.createPlatform(platformType, config)
} 