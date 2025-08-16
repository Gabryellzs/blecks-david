import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { PlatformConfigManager } from '@/lib/platform-config-manager'

export function useGoogleAdsAuth() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar status de conexão ao carregar
  useEffect(() => {
    checkConnectionStatus()
  }, [])

  // Verificar parâmetros da URL para feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const googleAdsConnected = urlParams.get('google_ads_connected')
    const errorParam = urlParams.get('error')

    if (googleAdsConnected === 'true') {
      toast({
        title: "Google Ads Conectado!",
        description: "Sua conta do Google Ads foi conectada com sucesso.",
        variant: "default",
      })
      setIsConnected(true)
      setError(null)
      // Limpar parâmetros da URL
      router.replace('/dashboard/ads')
    }

    if (errorParam) {
      const errorMessage = getErrorMessage(errorParam)
      setError(errorMessage)
      toast({
        title: "Erro na Conexão",
        description: errorMessage,
        variant: "destructive",
      })
      // Limpar parâmetros da URL
      router.replace('/dashboard/ads')
    }
  }, [router, toast])

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Verificar se tem configuração válida do Google Ads
      const hasConfig = await PlatformConfigManager.hasValidConfig('current-user-id', 'google_ads')
      setIsConnected(hasConfig)
    } catch (err) {
      console.error('Erro ao verificar status de conexão:', err)
      setError('Erro ao verificar status de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const connectGoogleAds = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      // Redirecionar para autorização do Google Ads
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID
      const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_ADS_REDIRECT_URI

      if (!clientId || !redirectUri) {
        throw new Error('Configuração do Google Ads não encontrada')
      }

      const scopes = [
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent&state=${generateState()}`

      window.location.href = authUrl
    } catch (err: any) {
      console.error('Erro ao conectar Google Ads:', err)
      setError(err.message || 'Erro ao conectar com o Google Ads')
      toast({
        title: "Erro na Conexão",
        description: err.message || 'Erro ao conectar com o Google Ads',
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectGoogleAds = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/google-ads/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao desconectar')
      }

      setIsConnected(false)
      toast({
        title: "Google Ads Desconectado",
        description: "Sua conta do Google Ads foi desconectada com sucesso.",
        variant: "default",
      })
    } catch (err: any) {
      console.error('Erro ao desconectar Google Ads:', err)
      setError(err.message || 'Erro ao desconectar do Google Ads')
      toast({
        title: "Erro na Desconexão",
        description: err.message || 'Erro ao desconectar do Google Ads',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshConnection = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/google-ads/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao renovar conexão')
      }

      const data = await response.json()
      
      if (data.message === 'Token renovado com sucesso') {
        toast({
          title: "Conexão Renovada",
          description: "Sua conexão com o Google Ads foi renovada com sucesso.",
          variant: "default",
        })
      }

      // Verificar status atualizado
      await checkConnectionStatus()
    } catch (err: any) {
      console.error('Erro ao renovar conexão:', err)
      setError(err.message || 'Erro ao renovar conexão')
      toast({
        title: "Erro na Renovação",
        description: err.message || 'Erro ao renovar conexão',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateState = () => {
    // Gerar um estado único para proteção CSRF
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'no_code': 'Código de autorização não recebido',
      'token_exchange_failed': 'Falha ao trocar código por token',
      'invalid_token': 'Token inválido',
      'google_ads_access_denied': 'Acesso ao Google Ads negado',
      'config_save_failed': 'Falha ao salvar configuração',
      'env_not_configured': 'Configuração do Google Ads não encontrada',
      'google_ads_auth_error': 'Erro na autorização do Google Ads',
      'unknown_error': 'Erro desconhecido'
    }

    return errorMessages[errorCode] || `Erro: ${errorCode}`
  }

  return {
    isConnected,
    isConnecting,
    isLoading,
    error,
    connectGoogleAds,
    disconnectGoogleAds,
    refreshConnection
  }
} 