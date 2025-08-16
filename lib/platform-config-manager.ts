// Utilitário para gerenciar configurações de plataformas
// Seguindo o princípio de responsabilidade única (SRP)

import { supabaseAdmin } from "./supabaseAdmin"

export type PlatformType = 'facebook' | 'google_ads' | 'google_analytics' | 'google_adsense' | 'tiktok' | 'kwai' | 'linkedin' | 'pinterest' | 'snapchat'

interface PlatformConfig { 
  id: string
  user_id: string
  platform: PlatformType
  access_token: string
  refresh_token?: string
  token_expires_at?: string
  platform_user_id?: string
  scopes?: string[]
  metadata?: any
  created_at: string
  updated_at: string
}

export class PlatformConfigManager {
  /**
   * Obter token válido para uma plataforma específica
   */
  static async getValidToken(userId: string, platform: PlatformType): Promise<string | null> {
    try {
      const { data: config, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single()

      if (error || !config?.access_token) {
        return null
      }

      // Verificar se o token está próximo de expirar (7 dias antes)
      if (config.token_expires_at) {
        const tokenExpiresAt = new Date(config.token_expires_at).getTime()
        const sevenDaysFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000)
        
        if (tokenExpiresAt <= sevenDaysFromNow) {
          // Tentar renovar o token
          const refreshedToken = await this.refreshToken(userId, platform)
          return refreshedToken
        }
      }

      return config.access_token
    } catch (error) {
      console.error(`Erro ao obter token válido para ${platform}:`, error)
      return null
    }
  }

  /**
   * Renovar token de uma plataforma específica
   */
  static async refreshToken(userId: string, platform: PlatformType): Promise<string | null> {
    try {
      switch (platform) {
        case 'facebook':
          return await this.refreshFacebookToken(userId)
        case 'google_ads':
          return await this.refreshGoogleAdsToken(userId)
        case 'google_analytics':
          return await this.refreshGoogleAnalyticsToken(userId)
        case 'google_adsense':
          return await this.refreshGoogleAdSenseToken(userId)
        case 'tiktok':
          return await this.refreshTikTokToken(userId)
        case 'kwai':
          return await this.refreshKwaiToken(userId)
        default:
          console.error(`Renovação de token não implementada para ${platform}`)
          return null
      }
    } catch (error) {
      console.error(`Erro ao renovar token do ${platform}:`, error)
      return null
    }
  }

  /**
   * Renovar token do Facebook
   */
  private static async refreshFacebookToken(userId: string): Promise<string | null> {
    try {
      const appId = process.env.FACEBOOK_APP_ID
      const appSecret = process.env.FACEBOOK_APP_SECRET

      if (!appId || !appSecret) {
        console.error("Configuração do Facebook não encontrada")
        return null
      }

      // Obter token atual do banco
      const { data: config, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .single()

      if (error || !config?.refresh_token) {
        console.error("Token do Facebook não encontrado ou inválido")
        return null
      }

      const currentToken = config.access_token

      const response = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "fb_exchange_token",
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: currentToken,
          }),
        }
      )

      if (!response.ok) {
        console.error("Erro ao renovar token do Facebook")
        return null
      }

      const data = await response.json()

      if (data.error) {
        console.error("Erro na resposta de renovação do Facebook:", data.error)
        return null
      }

      const newAccessToken = data.access_token
      const newExpiresIn = data.expires_in || 5184000
      const newExpiresAt = Date.now() + (newExpiresIn * 1000)

      // Atualizar o token no banco de dados
      const { error: updateError } = await supabaseAdmin
        .from('user_platform_configs')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(newExpiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('platform', 'facebook')

      if (updateError) {
        console.error("Erro ao atualizar token renovado do Facebook:", updateError)
        return null
      }

      console.log("Token do Facebook renovado com sucesso para usuário:", userId)
      return newAccessToken
    } catch (error) {
      console.error("Erro inesperado ao renovar token do Facebook:", error)
      return null
    }
  }

  /**
   * Renovar token do Google Ads
   */
  private static async refreshGoogleAdsToken(userId: string): Promise<string | null> {
    try {
      const clientId = process.env.GOOGLE_ADS_CLIENT_ID
      const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error("Configuração do Google Ads não encontrada")
        return null
      }

      // Obter refresh token do banco
      const { data: config, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'google_ads')
        .single()

      if (error || !config?.refresh_token) {
        console.error("Refresh token do Google Ads não encontrado")
        return null
      }

      // Renovar o token usando Google OAuth 2.0
      const response = await fetch(
        `https://oauth2.googleapis.com/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: config.refresh_token,
            grant_type: "refresh_token",
          }),
        }
      )

      if (!response.ok) {
        console.error("Erro ao renovar token do Google Ads")
        return null
      }

      const data = await response.json()

      if (data.error) {
        console.error("Erro na resposta de renovação do Google Ads:", data.error)
        return null
      }

      const newAccessToken = data.access_token
      const newExpiresIn = data.expires_in || 3600
      const newExpiresAt = Date.now() + (newExpiresIn * 1000)

      // Atualizar o token no banco de dados
      const { error: updateError } = await supabaseAdmin
        .from('user_platform_configs')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(newExpiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('platform', 'google_ads')

      if (updateError) {
        console.error("Erro ao atualizar token renovado do Google Ads:", updateError)
        return null
      }

      console.log("Token do Google Ads renovado com sucesso para usuário:", userId)
      return newAccessToken
    } catch (error) {
      console.error("Erro inesperado ao renovar token do Google Ads:", error)
      return null
    }
  }

  /**
   * Renovar token do Google Analytics
   */
  private static async refreshGoogleAnalyticsToken(userId: string): Promise<string | null> {
    try {
      const clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID
      const clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error("Configuração do Google Analytics não encontrada")
        return null
      }

      // Obter refresh token do banco
      const { data: config, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'google_analytics')
        .single()

      if (error || !config?.refresh_token) {
        console.error("Refresh token do Google Analytics não encontrado")
        return null
      }

      // Renovar o token usando Google OAuth 2.0
      const response = await fetch(
        `https://oauth2.googleapis.com/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: config.refresh_token,
            grant_type: "refresh_token",
          }),
        }
      )

      if (!response.ok) {
        console.error("Erro ao renovar token do Google Analytics")
        return null
      }

      const data = await response.json()

      if (data.error) {
        console.error("Erro na resposta de renovação do Google Analytics:", data.error)
        return null
      }

      const newAccessToken = data.access_token
      const newExpiresIn = data.expires_in || 3600
      const newExpiresAt = Date.now() + (newExpiresIn * 1000)

      // Atualizar o token no banco de dados
      const { error: updateError } = await supabaseAdmin
        .from('user_platform_configs')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(newExpiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('platform', 'google_analytics')

      if (updateError) {
        console.error("Erro ao atualizar token renovado do Google Analytics:", updateError)
        return null
      }

      console.log("Token do Google Analytics renovado com sucesso para usuário:", userId)
      return newAccessToken
    } catch (error) {
      console.error("Erro inesperado ao renovar token do Google Analytics:", error)
      return null
    }
  }

  /**
   * Renovar token do Google AdSense
   */
  private static async refreshGoogleAdSenseToken(userId: string): Promise<string | null> {
    try {
      const clientId = process.env.GOOGLE_ADS_CLIENT_ID
      const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error("Configuração do Google AdSense não encontrada")
        return null
      }

      // Obter refresh token do banco
      const { data: config, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'google_adsense')
        .single()

      if (error || !config?.refresh_token) {
        console.error("Refresh token do Google AdSense não encontrado")
        return null
      }

      // Renovar o token usando Google OAuth 2.0
      const response = await fetch(
        `https://oauth2.googleapis.com/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: config.refresh_token,
            grant_type: "refresh_token",
          }),
        }
      )

      if (!response.ok) {
        console.error("Erro ao renovar token do Google AdSense")
        return null
      }

      const data = await response.json()

      if (data.error) {
        console.error("Erro na resposta de renovação do Google AdSense:", data.error)
        return null
      }

      const newAccessToken = data.access_token
      const newExpiresIn = data.expires_in || 3600
      const newExpiresAt = Date.now() + (newExpiresIn * 1000)

      // Atualizar o token no banco de dados
      const { error: updateError } = await supabaseAdmin
        .from('user_platform_configs')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(newExpiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('platform', 'google_adsense')

      if (updateError) {
        console.error("Erro ao atualizar token renovado do Google AdSense:", updateError)
        return null
      }

      console.log("Token do Google AdSense renovado com sucesso para usuário:", userId)
      return newAccessToken
    } catch (error) {
      console.error("Erro inesperado ao renovar token do Google AdSense:", error)
      return null
    }
  }

  /**
   * Renovar token do TikTok
   */
  private static async refreshTikTokToken(userId: string): Promise<string | null> {
    try {
      const clientKey = process.env.TIKTOK_CLIENT_KEY
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET

      if (!clientKey || !clientSecret) {
        console.error("Configuração do TikTok não encontrada")
        return null
      }

      // Obter refresh token do banco
      const { data: config, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'tiktok')
        .single()

      if (error || !config?.refresh_token) {
        console.error("Refresh token do TikTok não encontrado")
        return null
      }

      // Renovar o token usando TikTok OAuth 2.0
      const response = await fetch(
        `https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            app_id: clientKey,
            secret: clientSecret,
            refresh_token: config.refresh_token,
            grant_type: "refresh_token",
          }),
        }
      )

      if (!response.ok) {
        console.error("Erro ao renovar token do TikTok")
        return null
      }

      const data = await response.json()

      if (data.code !== 0) {
        console.error("Erro na resposta de renovação do TikTok:", data)
        return null
      }

      const newAccessToken = data.data.access_token
      const newExpiresIn = data.data.expires_in || 7200
      const newExpiresAt = Date.now() + (newExpiresIn * 1000)

      // Atualizar o token no banco de dados
      const { error: updateError } = await supabaseAdmin
        .from('user_platform_configs')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(newExpiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('platform', 'tiktok')

      if (updateError) {
        console.error("Erro ao atualizar token renovado do TikTok:", updateError)
        return null
      }

      console.log("Token do TikTok renovado com sucesso para usuário:", userId)
      return newAccessToken
    } catch (error) {
      console.error("Erro inesperado ao renovar token do TikTok:", error)
      return null
    }
  }

  /**
   * Renovar token do Kwai
   */
  private static async refreshKwaiToken(userId: string): Promise<string | null> {
    try {
      const clientId = process.env.KWAI_CLIENT_ID
      const clientSecret = process.env.KWAI_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error("Configuração do Kwai não encontrada")
        return null
      }

      // Obter refresh token do banco
      const { data: config, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'kwai')
        .single()

      if (error || !config?.refresh_token) {
        console.error("Refresh token do Kwai não encontrado")
        return null
      }

      // Renovar o token usando Kwai OAuth 2.0
      const response = await fetch(
        `https://api.kwai.com/oauth2/refresh_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: config.refresh_token,
            grant_type: "refresh_token",
          }),
        }
      )

      if (!response.ok) {
        console.error("Erro ao renovar token do Kwai")
        return null
      }

      const data = await response.json()

      if (data.error) {
        console.error("Erro na resposta de renovação do Kwai:", data.error)
        return null
      }

      const newAccessToken = data.access_token
      const newExpiresIn = data.expires_in || 7200
      const newExpiresAt = Date.now() + (newExpiresIn * 1000)

      // Atualizar o token no banco de dados
      const { error: updateError } = await supabaseAdmin
        .from('user_platform_configs')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(newExpiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('platform', 'kwai')

      if (updateError) {
        console.error("Erro ao atualizar token renovado do Kwai:", updateError)
        return null
      }

      console.log("Token do Kwai renovado com sucesso para usuário:", userId)
      return newAccessToken
    } catch (error) {
      console.error("Erro inesperado ao renovar token do Kwai:", error)
      return null
    }
  }

  /**
   * Salvar configuração de uma plataforma
   */
  static async saveConfig(userId: string, platform: PlatformType, configData: {
    access_token: string
    refresh_token?: string
    expires_in?: number
    platform_user_id?: string
    scopes?: string[]
    metadata?: any
  }): Promise<boolean> {
    try {
      const expiresAt = configData.expires_in 
        ? new Date(Date.now() + (configData.expires_in * 1000)).toISOString()
        : null

      // Verificar se já existe uma configuração para este usuário e plataforma
      const { data: existingConfig, error: checkError } = await supabaseAdmin
        .from('user_platform_configs')
        .select('id')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, que é esperado se não existir
        console.error(`Erro ao verificar configuração existente do ${platform}:`, checkError)
        return false
      }

      const configDataToSave = {
        user_id: userId,
        platform,
        access_token: configData.access_token,
        refresh_token: configData.refresh_token,
        token_expires_at: expiresAt,
        platform_user_id: configData.platform_user_id,
        // scopes: configData.scopes,
        // metadata: configData.metadata,
        // updated_at: new Date().toISOString(),
      }

      let error
      if (existingConfig) {
        // Atualizar configuração existente
        const { error: updateError } = await supabaseAdmin
          .from('user_platform_configs')
          .update(configDataToSave)
          .eq('user_id', userId)
          .eq('platform', platform)
        error = updateError
      } else {
        // Criar nova configuração
        const { error: insertError } = await supabaseAdmin
          .from('user_platform_configs')
          .insert(configDataToSave)
        error = insertError
      }

      if (error) {
        console.error(`Erro ao salvar configuração do ${platform}:`, error)
        return false
      }

      console.log(`Configuração do ${platform} salva com sucesso para usuário:`, userId)
      return true
    } catch (error) {
      console.error(`Erro inesperado ao salvar configuração do ${platform}:`, error)
      return false
    }
  }

  /**
   * Remover configuração de uma plataforma
   */
  static async removeConfig(userId: string, platform: PlatformType): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('user_platform_configs')
        .delete()
        .eq('user_id', userId)
        .eq('platform', platform)

      if (error) {
        console.error(`Erro ao remover configuração do ${platform}:`, error)
        return false
      }

      console.log(`Configuração do ${platform} removida com sucesso para usuário:`, userId)
      return true
    } catch (error) {
      console.error(`Erro inesperado ao remover configuração do ${platform}:`, error)
      return false
    }
  }

  /**
   * Obter todas as configurações de um usuário
   */
  static async getUserConfigs(userId: string): Promise<PlatformConfig[]> {
    try {
      const { data: configs, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error("Erro ao obter configurações do usuário:", error)
        return []
      }

      return configs || []
    } catch (error) {
      console.error("Erro inesperado ao obter configurações do usuário:", error)
      return []
    }
  }

  /**
   * Verificar se usuário tem configuração válida para uma plataforma
   */
  static async hasValidConfig(userId: string, platform: PlatformType): Promise<boolean> {
    const token = await this.getValidToken(userId, platform)
    return token !== null
  }

  /**
   * Obter informações da configuração
   */
  static async getConfigInfo(userId: string, platform: PlatformType): Promise<{
    isValid: boolean
    expiresAt?: string
    daysUntilExpiry?: number
    platform: PlatformType
  } | null> {
    try {
      const { data: config, error } = await supabaseAdmin
        .from('user_platform_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single()

      if (error || !config) {
        return null
      }

      const isValid = await this.validateToken(platform, config.access_token)
      let daysUntilExpiry: number | undefined

      if (config.token_expires_at) {
        const expiresAt = new Date(config.token_expires_at).getTime()
        const now = Date.now()
        daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
      }

      return {
        isValid,
        expiresAt: config.token_expires_at,
        daysUntilExpiry,
        platform
      }
    } catch (error) {
      console.error(`Erro ao obter informações da configuração do ${platform}:`, error)
      return null
    }
  }

  /**
   * Validar token de uma plataforma
   */
  static async validateToken(platform: PlatformType, accessToken: string): Promise<boolean> {
    try {
      switch (platform) {
        case 'facebook':
          return await this.validateFacebookToken(accessToken)
        case 'google_ads':
          return await this.validateGoogleAdsToken(accessToken)
        case 'google_analytics':
          return await this.validateGoogleAnalyticsToken(accessToken)
        case 'google_adsense':
          return await this.validateGoogleAdSenseToken(accessToken)
        case 'tiktok':
          return await this.validateTikTokToken(accessToken)
        case 'kwai':
          return await this.validateKwaiToken(accessToken)
        default:
          console.error(`Validação de token não implementada para ${platform}`)
          return false
      }
    } catch (error) {
      console.error(`Erro ao validar token do ${platform}:`, error)
      return false
    }
  }

  /**
   * Validar token do Facebook
   */
  private static async validateFacebookToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id&access_token=${accessToken}`,
        { method: "GET" }
      )
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return !data.error
    } catch (error) {
      console.error("Erro ao validar token do Facebook:", error)
      return false
    }
  }

  /**
   * Validar token do Google Ads
   */
  private static async validateGoogleAdsToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://googleads.googleapis.com/v14/customers?access_token=${accessToken}`,
        { method: "GET" }
      )
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return !data.error
    } catch (error) {
      console.error("Erro ao validar token do Google Ads:", error)
      return false
    }
  }

  /**
   * Validar token do Google Analytics
   */
  private static async validateGoogleAnalyticsToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://analytics.googleapis.com/v1/data/ga?access_token=${accessToken}`,
        { method: "GET" }
      )
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return !data.error
    } catch (error) {
      console.error("Erro ao validar token do Google Analytics:", error)
      return false
    }
  }

  /**
   * Validar token do Google AdSense
   */
  private static async validateGoogleAdSenseToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/adsense/v1.4/adclients?access_token=${accessToken}`,
        { method: "GET" }
      )
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return !data.error
    } catch (error) {
      console.error("Erro ao validar token do Google AdSense:", error)
      return false
    }
  }

  /**
   * Validar token do TikTok
   */
  private static async validateTikTokToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://business-api.tiktok.com/open_api/v1.3/me?access_token=${accessToken}`,
        { method: "GET" }
      )
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return !data.error
    } catch (error) {
      console.error("Erro ao validar token do TikTok:", error)
      return false
    }
  }

  /**
   * Validar token do Kwai
   */
  private static async validateKwaiToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.kwai.com/open_api/v1.3/me?access_token=${accessToken}`,
        { method: "GET" }
      )
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return !data.error
    } catch (error) {
      console.error("Erro ao validar token do Kwai:", error)
      return false
    }
  }
} 