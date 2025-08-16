import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { PlatformConfigManager } from '@/lib/platform-config-manager'
import { useAuth } from '@/lib/auth'

export function useKwaiAuth() {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar status de conexão ao carregar
  useEffect(() => {
    if (user?.id) {
      checkConnectionStatus()
    }
  }, [user?.id])

  // Verificar parâmetros da URL para feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const kwaiConnected = urlParams.get('kwai_connected')
    const errorParam = urlParams.get('error')

    if (kwaiConnected === 'true') {
      toast({
        title: "Kwai Conectado!",
        description: "Sua conta do Kwai foi conectada com sucesso.",
        variant: "default",
      })
      setIsConnected(true)
      setError(null)
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

      const hasConfig = await PlatformConfigManager.hasValidConfig(user.id, 'kwai')
      setIsConnected(hasConfig)
    } catch (err) {
      console.error('Erro ao verificar status de conexão:', err)
      setError('Erro ao verificar status de conexão')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const connectKwai = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)

      // Redirecionar para a rota de iniciação do OAuth
      window.location.href = '/api/auth/kwai'
    } catch (err: any) {
      console.error('Erro ao conectar Kwai:', err)
      setError(err.message || 'Erro ao conectar com o Kwai')
      toast({
        title: "Erro na Conexão",
        description: err.message || 'Erro ao conectar com o Kwai',
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }, [toast])

  const disconnectKwai = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      const success = await PlatformConfigManager.removeConfig(user.id, 'kwai')
      
      if (success) {
        setIsConnected(false)
        toast({
          title: "Kwai Desconectado",
          description: "Sua conta do Kwai foi desconectada com sucesso.",
          variant: "default",
        })
      } else {
        throw new Error('Erro ao desconectar')
      }
    } catch (err: any) {
      console.error('Erro ao desconectar Kwai:', err)
      setError(err.message || 'Erro ao desconectar do Kwai')
      toast({
        title: "Erro na Desconexão",
        description: err.message || 'Erro ao desconectar do Kwai',
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

      const success = await PlatformConfigManager.refreshToken(user.id, 'kwai')
      
      if (success) {
        toast({
          title: "Conexão Renovada",
          description: "Sua conexão com o Kwai foi renovada com sucesso.",
          variant: "default",
        })
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
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'no_code': 'Código de autorização não recebido',
      'token_exchange_failed': 'Falha ao trocar código por token',
      'invalid_token': 'Token inválido',
      'kwai_access_denied': 'Acesso ao Kwai negado',
      'config_save_failed': 'Falha ao salvar configuração',
      'env_not_configured': 'Configuração do Kwai não encontrada',
      'kwai_auth_error': 'Erro na autorização do Kwai',
      'unknown_error': 'Erro desconhecido'
    }

    return errorMessages[errorCode] || `Erro: ${errorCode}`
  }

  return {
    isConnected,
    isConnecting,
    isLoading,
    error,
    connectKwai,
    disconnectKwai,
    refreshConnection
  }
} 