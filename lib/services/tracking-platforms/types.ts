// Tipos base para plataformas de tracking de vendas

export type TrackingPlatformType = 
  | "meta_ads"
  | "google_ads" 
  | "tiktok_ads"
  | "kwai_ads"
  | "pinterest_ads"
  | "linkedin_ads"
  | "twitter_ads"
  | "snapchat_ads"
  | "google_analytics"
  | "google_analytics_4"
  | "unknown"

// Configuração base para qualquer plataforma
export interface TrackingPlatformConfig {
  id: TrackingPlatformType
  name: string
  enabled: boolean
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  accountId?: string
  managerId?: string
  propertyId?: string // Para Google Analytics
  viewId?: string // Para Google Analytics Universal
  measurementId?: string // Para Google Analytics 4
  color: string
  logo?: string
  baseUrl?: string
  scopes?: string[]
  rateLimit?: {
    requestsPerMinute: number
    requestsPerHour: number
  }
}

// Dados de autenticação
export interface PlatformAuth {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  tokenType?: string
}

// Parâmetros de consulta padronizados
export interface TrackingQueryParams {
  startDate: string
  endDate: string
  accountId?: string
  campaignId?: string
  adSetId?: string
  adId?: string
  propertyId?: string // Para Google Analytics
  viewId?: string // Para Google Analytics Universal
  measurementId?: string // Para Google Analytics 4
  fields?: string[]
  limit?: number
  offset?: number
  timeIncrement?: number // 1 = daily, 7 = weekly, 30 = monthly
  dimensions?: string[] // Para Google Analytics
  metrics?: string[] // Para Google Analytics
  filters?: string // Para Google Analytics
  sort?: string[] // Para Google Analytics
}

// Resposta base para qualquer consulta
export interface TrackingResponse<T = any> {
  success: boolean
  data: T[]
  pagination?: {
    next?: string
    previous?: string
    total?: number
    hasNext: boolean
  }
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    requestId?: string
    timestamp: number
    platform: TrackingPlatformType
  }
}

// Dados de campanha padronizados
export interface CampaignData {
  id: string
  name: string
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED" | "PENDING"
  objective?: string
  budget?: {
    amount: number
    currency: string
    type: "DAILY" | "LIFETIME" | "MONTHLY"
  }
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  reach: number
  frequency: number
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  platform: TrackingPlatformType
  rawData?: any // Dados originais da plataforma
}

// Dados de anúncio padronizados
export interface AdData {
  id: string
  name: string
  campaignId: string
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED" | "PENDING"
  adType: string
  creativeType?: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  reach: number
  frequency: number
  createdAt: string
  updatedAt: string
  platform: TrackingPlatformType
  rawData?: any
}

// Dados de lead padronizados
export interface LeadData {
  id: string
  campaignId?: string
  adId?: string
  adSetId?: string
  name?: string
  email?: string
  phone?: string
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST"
  source: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  landingPage?: string
  conversionValue?: number
  conversionCurrency?: string
  createdAt: string
  updatedAt: string
  platform: TrackingPlatformType
  rawData?: any
}

// Dados específicos do Google Analytics
export interface AnalyticsData {
  id: string
  date: string
  source: string
  medium: string
  campaign?: string
  content?: string
  term?: string
  landingPage?: string
  sessions: number
  users: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  goalCompletions?: number
  goalValue?: number
  ecommerceRevenue?: number
  ecommerceTransactions?: number
  platform: TrackingPlatformType
  rawData?: any
}

// Dados de evento do Google Analytics
export interface AnalyticsEvent {
  id: string
  eventName: string
  eventCategory: string
  eventAction: string
  eventLabel?: string
  eventValue?: number
  timestamp: string
  userId?: string
  sessionId?: string
  pagePath?: string
  referrer?: string
  platform: TrackingPlatformType
  rawData?: any
}

// Dados de conversão do Google Analytics
export interface AnalyticsConversion {
  id: string
  goalId: string
  goalName: string
  conversionValue: number
  conversionCurrency: string
  date: string
  source: string
  medium: string
  campaign?: string
  content?: string
  term?: string
  landingPage?: string
  platform: TrackingPlatformType
  rawData?: any
}

// Métricas consolidadas
export interface TrackingMetrics {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalReach: number
  averageCtr: number
  averageCpc: number
  averageCpm: number
  averageFrequency: number
  totalLeads: number
  leadCost: number
  conversionRate: number
  roi?: number
  roas?: number
  // Métricas específicas do Analytics
  totalSessions?: number
  totalUsers?: number
  totalPageViews?: number
  averageBounceRate?: number
  averageSessionDuration?: number
  totalConversions?: number
  totalRevenue?: number
}

// Configuração de webhook para leads
export interface LeadWebhookConfig {
  platform: TrackingPlatformType
  webhookUrl: string
  secretKey?: string
  events: string[]
  enabled: boolean
}

// Evento de lead recebido via webhook
export interface LeadWebhookEvent {
  platform: TrackingPlatformType
  eventType: string
  leadData: LeadData
  timestamp: number
  signature?: string
}

// Status de sincronização
export interface SyncStatus {
  platform: TrackingPlatformType
  lastSync: Date
  status: "SUCCESS" | "ERROR" | "IN_PROGRESS" | "PENDING"
  error?: string
  recordsProcessed?: number
  nextSync?: Date
}

// Configuração de relatórios
export interface ReportConfig {
  id: string
  name: string
  platform: TrackingPlatformType
  type: "CAMPAIGNS" | "ADS" | "LEADS" | "METRICS" | "ANALYTICS" | "EVENTS" | "CONVERSIONS"
  schedule?: {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY"
    time: string
    timezone: string
  }
  filters?: Record<string, any>
  recipients?: string[]
  enabled: boolean
}

// Configuração específica do Google Analytics
export interface AnalyticsConfig {
  propertyId: string
  viewId?: string // Para Universal Analytics
  measurementId?: string // Para GA4
  customDimensions?: string[]
  customMetrics?: string[]
  goals?: Array<{
    id: string
    name: string
    type: "URL_DESTINATION" | "VISIT_TIME_ON_SITE" | "EVENT" | "PAGES_PER_SESSION"
    value?: number
  }>
  ecommerceEnabled?: boolean
  enhancedEcommerceEnabled?: boolean
}

// Dados de propriedade do Google Analytics
export interface AnalyticsProperty {
  id: string
  name: string
  accountId: string
  type: "UNIVERSAL" | "GA4"
  viewId?: string
  measurementId?: string
  websiteUrl?: string
  timezone?: string
  currency?: string
  enhancedEcommerceEnabled?: boolean
  platform: TrackingPlatformType
  rawData?: any
} 