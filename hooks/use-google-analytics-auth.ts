import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { PlatformConfigManager } from '@/lib/platform-config-manager'
import { useAuth } from '@/lib/auth'

export function useGoogleAnalyticsAuth() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  // Verificar status de conexão ao carregar
  useEffect(() => {
    if (user?.id) {
      checkConnectionStatus()
    }
  }, [user?.id])

  // Verificar parâmetros da URL para feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const googleAnalyticsConnected = urlParams.get('google_analytics_connected')
    const errorParam = urlParams.get('error')

    if (googleAnalyticsConnected === 'true') {
      toast({
        title: "Google Analytics Conectado!",
        description: "Sua conta do Google Analytics foi conectada com sucesso.",
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

  const checkConnectionStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user?.id) {
        setIsConnected(false)
        return
      }

      // Verificar se tem configuração válida do Google Analytics
      const hasConfig = await PlatformConfigManager.hasValidConfig(user.id, 'google_analytics')
      setIsConnected(hasConfig)
    } catch (err) {
      console.error('Erro ao verificar status de conexão:', err)
      setError('Erro ao verificar status de conexão')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const connectGoogleAnalytics = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)

      // Redirecionar para autorização do Google Analytics
      window.location.href = '/api/auth/google-analytics'
    } catch (err: any) {
      console.error('Erro ao conectar Google Analytics:', err)
      setError(err.message || 'Erro ao conectar com o Google Analytics')
      toast({
        title: "Erro na Conexão",
        description: err.message || 'Erro ao conectar com o Google Analytics',
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }, [toast])

  const disconnectGoogleAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      const success = await PlatformConfigManager.removeConfig(user.id, 'google_analytics')
      
      if (success) {
        setIsConnected(false)
        toast({
          title: "Google Analytics Desconectado",
          description: "Sua conta do Google Analytics foi desconectada com sucesso.",
          variant: "default",
        })
      } else {
        throw new Error('Erro ao desconectar')
      }
    } catch (err: any) {
      console.error('Erro ao desconectar Google Analytics:', err)
      setError(err.message || 'Erro ao desconectar do Google Analytics')
      toast({
        title: "Erro na Desconexão",
        description: err.message || 'Erro ao desconectar do Google Analytics',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  const refreshConnection = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      const success = await PlatformConfigManager.refreshToken(user.id, 'google_analytics')
      
      if (success) {
        toast({
          title: "Conexão Renovada",
          description: "Sua conexão com o Google Analytics foi renovada com sucesso.",
          variant: "default",
        })
        // Verificar status atualizado
        await checkConnectionStatus()
      } else {
        throw new Error('Erro ao renovar token')
      }
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
  }, [user?.id, toast, checkConnectionStatus])

  const generateState = () => {
    // Gerar um estado único para proteção CSRF
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'no_code': 'Código de autorização não recebido',
      'token_exchange_failed': 'Falha ao trocar código por token',
      'invalid_token': 'Token inválido',
      'google_analytics_access_denied': 'Acesso ao Google Analytics negado',
      'config_save_failed': 'Falha ao salvar configuração',
      'env_not_configured': 'Configuração do Google Analytics não encontrada',
      'google_analytics_auth_error': 'Erro na autorização do Google Analytics',
      'unknown_error': 'Erro desconhecido'
    }

    return errorMessages[errorCode] || `Erro: ${errorCode}`
  }

  return {
    isConnected,
    isConnecting,
    isLoading,
    error,
    connectGoogleAnalytics,
    disconnectGoogleAnalytics,
    refreshConnection
  }
} 