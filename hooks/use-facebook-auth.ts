// Hook personalizado para gerenciar autenticação do Facebook
// Seguindo o princípio de responsabilidade única (SRP)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { PlatformConfigManager } from '@/lib/platform-config-manager'

export function useFacebookAuth() {
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
    const facebookConnected = urlParams.get('facebook_connected')
    const errorParam = urlParams.get('error')

    if (facebookConnected === 'true') {
  toast({
    title: "Facebook Conectado!",
    description: "Sua conta do Facebook foi conectada com sucesso.",
    variant: "default",
  })
  setIsConnected(true)
  setError(null)

  // === 🔥 Adicione este trecho abaixo ===
  try {
    // 1️⃣ Obter usuário atual
    const { data: sessionData } = await fetch("/api/auth/user").then(r => r.json())
    const userId = sessionData?.user?.id

    // 2️⃣ Buscar token salvo (ou seu endpoint que troca o código)
    const tokenRes = await fetch("/api/facebook-ads/token")
    const tokenData = await tokenRes.json()

    // 3️⃣ Pegar conta ativa (exemplo simplificado)
    const accountId = tokenData?.account_id || "act_default"

    // 4️⃣ Salvar no Supabase
    const { savePlatformToken } = await import("@/lib/savePlatformToken")
    await savePlatformToken({
      userId,
      platform: "meta",
      accountId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
    })

    console.log("[META] Token salvo com sucesso")
  } catch (err) {
    console.error("[META] Erro ao salvar token:", err)
  }
  // =====================================

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

      // Verificar se tem configuração válida do Facebook
      const hasConfig = await PlatformConfigManager.hasValidConfig('current-user-id', 'facebook')
      setIsConnected(hasConfig)
    } catch (err) {
      console.error('Erro ao verificar status de conexão:', err)
      setError('Erro ao verificar status de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const connectFacebook = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      // Redirecionar para autorização do Facebook
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI

      if (!appId || !redirectUri) {
        throw new Error('Configuração do Facebook não encontrada')
      }

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_read,ads_management,business_management&response_type=code&state=${generateState()}`

      window.location.href = authUrl
    } catch (err: any) {
      console.error('Erro ao conectar Facebook:', err)
      setError(err.message || 'Erro ao conectar com o Facebook')
      toast({
        title: "Erro na Conexão",
        description: err.message || 'Erro ao conectar com o Facebook',
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectFacebook = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/facebook-ads/disconnect', {
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
        title: "Facebook Desconectado",
        description: "Sua conta do Facebook foi desconectada com sucesso.",
        variant: "default",
      })
    } catch (err: any) {
      console.error('Erro ao desconectar Facebook:', err)
      setError(err.message || 'Erro ao desconectar do Facebook')
      toast({
        title: "Erro na Desconexão",
        description: err.message || 'Erro ao desconectar do Facebook',
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

      const response = await fetch('/api/facebook-ads/refresh-token', {
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
          description: "Sua conexão com o Facebook foi renovada com sucesso.",
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
      'profile_error': 'Erro ao acessar perfil do usuário',
      'profile_creation_failed': 'Falha ao criar perfil',
      'profile_update_failed': 'Falha ao atualizar perfil',
      'config_save_failed': 'Falha ao salvar configuração',
      'env_not_configured': 'Configuração do Facebook não encontrada',
      'facebook_auth_error': 'Erro na autorização do Facebook',
      'unknown_error': 'Erro desconhecido'
    }

    return errorMessages[errorCode] || `Erro: ${errorCode}`
  }

  return {
    isConnected,
    isConnecting,
    isLoading,
    error,
    connectFacebook,
    disconnectFacebook,
    refreshConnection
  }
} 