import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation' 
import { useToast } from '@/components/ui/use-toast'
import { PlatformConfigManager } from '@/lib/platform-config-manager'
import { useAuth } from '@/lib/auth'

export function useGoogleAdSenseAuth() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const checkConnectionStatus = useCallback(async () => {
    if (!user?.id) {
      console.error('Usuário não autenticado')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Verificar se tem configuração válida do Google AdSense
      const hasConfig = await PlatformConfigManager.hasValidConfig(user.id, 'google_adsense')
      setIsConnected(hasConfig)
    } catch (err) {
      console.error('Erro ao verificar status de conexão:', err)
      setError('Erro ao verificar status de conexão')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      checkConnectionStatus()
    }
  }, [user?.id, checkConnectionStatus])

  const connectGoogleAdSense = useCallback(async () => {
    if (!user?.id) {
      setError('Usuário não autenticado')
      toast({
        title: "Erro na Conexão",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsConnecting(true)
      setError(null)

      // Redirecionar para autorização do Google AdSense
      window.location.href = '/api/auth/google-adsense'
    } catch (err: any) {
      console.error('Erro ao conectar Google AdSense:', err)
      setError(err.message || 'Erro ao conectar com o Google AdSense')
      toast({
        title: "Erro na Conexão",
        description: err.message || 'Erro ao conectar com o Google AdSense',
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }, [user?.id, toast])

  const disconnectGoogleAdSense = useCallback(async () => {
    if (!user?.id) {
      setError('Usuário não autenticado')
      toast({
        title: "Erro na Desconexão",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Remover configuração do Google AdSense
      const success = await PlatformConfigManager.removeConfig(user.id, 'google_adsense')
      
      if (success) {
        setIsConnected(false)
        toast({
          title: "Desconectado",
          description: "Google AdSense desconectado com sucesso",
        })
      } else {
        throw new Error('Erro ao desconectar Google AdSense')
      }
    } catch (err: any) {
      console.error('Erro ao desconectar Google AdSense:', err)
      setError(err.message || 'Erro ao desconectar Google AdSense')
      toast({
        title: "Erro na Desconexão",
        description: err.message || 'Erro ao desconectar Google AdSense',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  const getAdSenseData = useCallback(async () => {
    if (!user?.id) {
      setError('Usuário não autenticado')
      toast({
        title: "Erro ao Obter Dados",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive",
      })
      return null
    }

    try {
      setIsLoading(true)
      setError(null)

      // Obter token válido
      const token = await PlatformConfigManager.getValidToken(user.id, 'google_adsense')
      
      if (!token) {
        throw new Error('Token do Google AdSense não encontrado')
      }

      // Fazer requisição para a API do Google AdSense
      const response = await fetch('/api/google-adsense/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao obter dados do Google AdSense')
      }

      const data = await response.json()
      return data
    } catch (err: any) {
      console.error('Erro ao obter dados do Google AdSense:', err)
      setError(err.message || 'Erro ao obter dados do Google AdSense')
      toast({
        title: "Erro ao Obter Dados",
        description: err.message || 'Erro ao obter dados do Google AdSense',
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  return {
    isConnected,
    isLoading,
    isConnecting,
    error,
    connectGoogleAdSense,
    disconnectGoogleAdSense,
    getAdSenseData,
    checkConnectionStatus
  }
} 