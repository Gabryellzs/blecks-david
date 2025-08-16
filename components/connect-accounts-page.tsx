"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react" // Adicionado Loader2 para o estado de carregamento
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getFacebookAdAccounts } from "@/lib/facebook-ads-service"
import type { FacebookAdAccount } from "@/lib/types/facebook-ads"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { useGoogleAdSenseAuth } from "@/hooks/use-google-adsense-auth"
import { useGoogleAnalyticsAuth } from "@/hooks/use-google-analytics-auth"

interface ConnectAccountsPageProps {
  onBack: () => void
}

type Platform = "meta" | "google" | "analytics" | "tiktok" | "kwai" | null

// Tipo para armazenar o estado de conexão de cada plataforma e conta
interface ConnectedAccountsState {
  meta: { id: string; name: string; accessToken: string }[] // Meta agora armazena perfis conectados
  google: number[]
  analytics: number[]
  tiktok: number[]
  kwai: number[]
}

export function ConnectAccountsPage({ onBack }: ConnectAccountsPageProps) {
  console.log("=== ConnectAccountsPage RENDERIZADO ===")
  const { user } = useAuth()
  console.log("user do useAuth:", user)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccountsState>({
    meta: [],
    google: [],
    analytics: [],
    tiktok: [],
    kwai: [],
  })
  const [connectingAccount, setConnectingAccount] = useState<{ platform: Platform; id: number } | null>(null)
  const [facebookAdAccounts, setFacebookAdAccounts] = useState<FacebookAdAccount[]>([])
  const [adAccountStatuses, setAdAccountStatuses] = useState<Record<string, boolean>>({})
  const [loadingFacebookAdAccounts, setLoadingFacebookAdAccounts] = useState(false)
  const [facebookAdAccountsError, setFacebookAdAccountsError] = useState<string | null>(null)
  const { toast } = useToast()

  // Hook para Google AdSense
  const {
    isConnected: isGoogleAdSenseConnected,
    isLoading: isGoogleAdSenseLoading,
    isConnecting: isGoogleAdSenseConnecting,
    error: googleAdSenseError,
    connectGoogleAdSense,
    disconnectGoogleAdSense
  } = useGoogleAdSenseAuth()

  // Hook para Google Analytics
  const {
    isConnected: isGoogleAnalyticsConnected,
    isLoading: isGoogleAnalyticsLoading,
    isConnecting: isGoogleAnalyticsConnecting,
    error: googleAnalyticsError,
    connectGoogleAnalytics,
    disconnectGoogleAnalytics
  } = useGoogleAnalyticsAuth()

  // Carregar estado de conexão do localStorage ao montar o componente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedConnectedAccounts = localStorage.getItem("connectedAccounts")
      if (storedConnectedAccounts) {
        setConnectedAccounts(JSON.parse(storedConnectedAccounts))
      }
      const storedAdAccountStatuses = localStorage.getItem("adAccountStatuses")
      if (storedAdAccountStatuses) {
        setAdAccountStatuses(JSON.parse(storedAdAccountStatuses))
      }
    }
  }, [])

  // Salvar estado de conexão no localStorage sempre que ele mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("connectedAccounts", JSON.stringify(connectedAccounts))
    }
  }, [connectedAccounts])

  // Salvar status das contas de anúncio no localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adAccountStatuses", JSON.stringify(adAccountStatuses))
    }
  }, [adAccountStatuses])

  const handleConnect = useCallback(async (platform: Platform, accountId: number) => {
    if (!platform) return

    // Se for Google ADS, usar o hook do Google AdSense
    if (platform === "google") {
      console.log("=== CONECTANDO GOOGLE ADSENSE ===")
      await connectGoogleAdSense()
      return
    }

    // Se for Analytics, usar o hook do Google Analytics
    if (platform === "analytics") {
      console.log("=== CONECTANDO GOOGLE ANALYTICS ===")
      await connectGoogleAnalytics()
      return
    }

    setConnectingAccount({ platform, id: accountId })

    // Simula uma chamada de API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setConnectedAccounts((prev) => {
      const newConnectedAccounts = { ...prev }
      
      if (platform === "tiktok") {
        if (!newConnectedAccounts.tiktok.includes(accountId)) {
          newConnectedAccounts.tiktok = [...newConnectedAccounts.tiktok, accountId]
        }
      } else if (platform === "kwai") {
        if (!newConnectedAccounts.kwai.includes(accountId)) {
          newConnectedAccounts.kwai = [...newConnectedAccounts.kwai, accountId]
        }
      }
      
      return newConnectedAccounts
    })
    setConnectingAccount(null)
  }, [connectGoogleAdSense, connectGoogleAnalytics])

  const isAccountConnected = useCallback(
    (platform: Platform, accountId: number | string) => {
      if (!platform) return false
      if (platform === "meta") {
        return connectedAccounts.meta.some((profile) => profile.id === accountId)
      }
      // Para Google ADS, usar o estado do hook
      if (platform === "google") {
        return isGoogleAdSenseConnected
      }
      // Para Google Analytics, usar o estado do hook
      if (platform === "analytics") {
        return isGoogleAnalyticsConnected
      }
      return (connectedAccounts[platform as keyof ConnectedAccountsState] as number[])?.includes(accountId as number)
    },
    [connectedAccounts, isGoogleAdSenseConnected, isGoogleAnalyticsConnected],
  )

  const isConnecting = useCallback(
    (platform: Platform, accountId: number) => {
      // Para Google ADS, usar o estado do hook
      if (platform === "google") {
        return isGoogleAdSenseConnecting
      }
      // Para Google Analytics, usar o estado do hook
      if (platform === "analytics") {
        return isGoogleAnalyticsConnecting
      }
      return connectingAccount?.platform === platform && connectingAccount?.id === accountId
    },
    [connectingAccount, isGoogleAdSenseConnecting, isGoogleAnalyticsConnecting],
  )

  const handleConnectFacebook = useCallback(() => {
    console.log("=== handleConnectFacebook CHAMADO ===")
    console.log("user:", user)
    
    if (!user?.id) {
      console.log("Usuário não autenticado")
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive",
      })
      return
    }
    
    console.log("Redirecionando para /api/auth/facebook")
    // Redireciona para a rota de autenticação do Facebook
    window.location.href = `/api/auth/facebook`
  }, [user?.id, toast])

  const fetchFacebookAdAccounts = useCallback(async () => {
    setLoadingFacebookAdAccounts(true)
    setFacebookAdAccountsError(null)
    try {
      // Para simplificar, vamos assumir que estamos buscando contas para o primeiro perfil conectado
      // Em um cenário real, você pode ter um seletor de perfil ou iterar sobre eles
      const firstMetaProfile = connectedAccounts.meta[0]
      if (firstMetaProfile) {
        const accounts = await getFacebookAdAccounts()
        setFacebookAdAccounts(accounts)
        // Inicializa os status dos toggles com base no que está salvo ou ativo por padrão
        const initialStatuses: Record<string, boolean> = {}
        accounts.forEach((account) => {
          initialStatuses[account.id] = adAccountStatuses[account.id] ?? account.account_status === 1 // 1 = ACTIVE
        })
        setAdAccountStatuses(initialStatuses)
      }
    } catch (error: any) {
      console.error("Erro ao buscar contas de anúncio do Facebook:", error)
      setFacebookAdAccountsError(error.message || "Falha ao carregar contas de anúncio do Facebook.")
      toast({
        title: "Erro",
        description: error.message || "Falha ao carregar contas de anúncio do Facebook.",
        variant: "destructive",
      })
    } finally {
      setLoadingFacebookAdAccounts(false)
    }
  }, [connectedAccounts.meta, adAccountStatuses, toast])

  useEffect(() => {
    if (selectedPlatform === "meta" && connectedAccounts.meta.length > 0) {
      fetchFacebookAdAccounts()
    }
  }, [selectedPlatform, connectedAccounts.meta, fetchFacebookAdAccounts])

  const handleToggleAdAccount = useCallback(
    async (adAccountId: string, currentStatus: boolean) => {
      const newStatus = !currentStatus
      setAdAccountStatuses((prev) => ({ ...prev, [adAccountId]: newStatus }))
      try {
        // Chamar a API para atualizar o status da conta de anúncio
        // Nota: A API atualiza status de campanha. Precisamos de uma para contas de anúncio.
        // Por enquanto, vamos simular o sucesso.
        // await updateFacebookAdAccountStatus(adAccountId, newStatus ? "ACTIVE" : "PAUSED");
        toast({
          title: "Status Atualizado",
          description: `Conta ${adAccountId} ${newStatus ? "ativada" : "pausada"} com sucesso (simulado).`,
        })
      } catch (error: any) {
        console.error("Erro ao atualizar status da conta de anúncio:", error)
        setAdAccountStatuses((prev) => ({ ...prev, [adAccountId]: currentStatus })) // Reverter em caso de erro
        toast({
          title: "Erro ao atualizar status",
          description: error.message || "Não foi possível atualizar o status da conta de anúncio.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleToggleAllAdAccounts = useCallback(
    async (checked: boolean) => {
      const newStatuses: Record<string, boolean> = {}
      const updates: Promise<any>[] = []

      facebookAdAccounts.forEach((account) => {
        newStatuses[account.id] = checked
        // updates.push(updateFacebookAdAccountStatus(account.id, checked ? "ACTIVE" : "PAUSED")); // Chamar API real
      })

      setAdAccountStatuses(newStatuses)

      try {
        // await Promise.all(updates);
        toast({
          title: "Status Atualizado",
          description: `Todas as contas foram ${checked ? "ativadas" : "pausadas"} (simulado).`,
        })
      } catch (error: any) {
        console.error("Erro ao atualizar todas as contas de anúncio:", error)
        // Reverter todos os status em caso de erro
        setAdAccountStatuses((prev) => {
          const revertedStatuses: Record<string, boolean> = {}
          facebookAdAccounts.forEach((account) => {
            revertedStatuses[account.id] = !checked // Reverte para o estado anterior
          })
          return revertedStatuses
        })
        toast({
          title: "Erro ao atualizar todos os status",
          description: error.message || "Não foi possível atualizar todas as contas de anúncio.",
          variant: "destructive",
        })
      }
    },
    [facebookAdAccounts, toast],
  )

  // Verificar status do Google AdSense quando a plataforma for selecionada
  // Removido: O hook useGoogleAdSenseAuth já verifica o status automaticamente

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">Conectar Contas</h1>
        </div>
      </div>
      <p className="text-muted-foreground mb-6">
        Conecte suas contas de plataformas de anúncios para visualizar seus dados em um só lugar.
      </p>
      <div className="flex flex-wrap gap-4">
        <Button
          variant={selectedPlatform === "meta" ? "default" : "outline"}
          className="flex items-center gap-2 px-4 py-2"
          onClick={() => setSelectedPlatform("meta")}
        >
          <Image src="/icons/meta-new.png" alt="Meta Ads Icon" width={20} height={20} />
          <span>Meta ADS</span>
        </Button>
        <Button
          variant={selectedPlatform === "google" ? "default" : "outline"}
          className="flex items-center gap-2 px-4 py-2"
          onClick={() => setSelectedPlatform("google")}
        >
          <Image src="/icons/google-ads-icon.png" alt="Google Ads Icon" width={24} height={24} />
          <span>Google ADS</span>
        </Button>
        <Button
          variant={selectedPlatform === "analytics" ? "default" : "outline"}
          className="flex items-center gap-2 px-4 py-2"
          onClick={() => setSelectedPlatform("analytics")}
        >
          <Image src="/icons/google-analytics-orange.png" alt="Analytics Icon" width={20} height={20} />
          <span>Analytics</span>
        </Button>
        <Button
          variant={selectedPlatform === "tiktok" ? "default" : "outline"}
          className="flex items-center gap-2 px-4 py-2"
          onClick={() => setSelectedPlatform("tiktok")}
        >
          <Image src="/icons/tiktok-new.png" alt="TikTok Ads Icon" width={20} height={20} />
          <span>TikTok ADS</span>
        </Button>
        <Button
          variant={selectedPlatform === "kwai" ? "default" : "outline"}
          className="flex items-center gap-2 px-4 py-2"
          onClick={() => setSelectedPlatform("kwai")}
        >
          <Image src="/icons/kwai-new.png" alt="Kwai Ads Icon" width={24} height={24} />
          <span>Kwai ADS</span>
        </Button>
      </div>

      {selectedPlatform === "meta" && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-4">
            <Image src="/icons/meta-new.png" alt="Meta Ads Icon" width={24} height={24} />
            <h2 className="text-2xl font-semibold">Meta Ads</h2>
          </div>
          <p className="text-muted-foreground">Conecte seus perfis por aqui:</p>

          {connectedAccounts.meta.length > 0 ? (
            <div className="space-y-4">
              {connectedAccounts.meta.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 border rounded-md bg-card text-card-foreground shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src="/placeholder-user.jpg"
                      alt="Profile Avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="font-medium">{profile.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          // Lógica para desconectar o perfil
                          setConnectedAccounts((prev) => ({
                            ...prev,
                            meta: prev.meta.filter((p) => p.id !== profile.id),
                          }))
                          toast({
                            title: "Perfil Desconectado",
                            description: `O perfil ${profile.name} foi desconectado.`,
                          })
                        }}
                      >
                        Desconectar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
                             <Button 
                 className="bg-blue-600 hover:bg-blue-700 text-white" 
                 onClick={() => {
                   console.log("=== BOTÃO 'ADICIONAR OUTRO PERFIL' CLICADO ===")
                   handleConnectFacebook()
                 }}
               >
                 Adicionar outro perfil
               </Button>
            </div>
          ) : (
                         <Button 
               className="bg-blue-600 hover:bg-blue-700 text-white" 
               onClick={() => {
                 console.log("=== BOTÃO CLICADO ===")
                 handleConnectFacebook()
               }}
             >
               Adicionar perfil
             </Button>
          )}

          {connectedAccounts.meta.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Contas de Anúncio (Meta)</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="toggle-all-ad-accounts">Ativar todas:</Label>
                  <Switch
                    id="toggle-all-ad-accounts"
                    checked={
                      facebookAdAccounts.every((account) => adAccountStatuses[account.id]) &&
                      facebookAdAccounts.length > 0
                    }
                    onCheckedChange={handleToggleAllAdAccounts}
                    disabled={loadingFacebookAdAccounts || facebookAdAccounts.length === 0}
                  />
                </div>
              </div>

              {loadingFacebookAdAccounts ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando contas de anúncio...
                </div>
              ) : facebookAdAccountsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar contas de anúncio</AlertTitle>
                  <AlertDescription>{facebookAdAccountsError}</AlertDescription>
                </Alert>
              ) : facebookAdAccounts.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma conta de anúncio encontrada para este perfil.</p>
              ) : (
                <div className="space-y-4">
                  {facebookAdAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-md bg-card text-card-foreground shadow-sm"
                    >
                      <div>
                        <h4 className="font-medium">{account.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          status: {account.account_status === 1 ? "Ativa" : "Inativa"}
                        </p>
                      </div>
                      <Switch
                        checked={adAccountStatuses[account.id] ?? account.account_status === 1}
                        onCheckedChange={(checked) =>
                          handleToggleAdAccount(
                            account.id,
                            adAccountStatuses[account.id] ?? account.account_status === 1,
                          )
                        }
                        disabled={loadingFacebookAdAccounts}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedPlatform === "google" && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-4">
            <Image src="/icons/google-ads-icon.png" alt="Google Ads Icon" width={24} height={24} />
            <h2 className="text-2xl font-semibold">Google AdSense</h2>
          </div>
          <p className="text-muted-foreground">Conecte sua conta do Google AdSense:</p>

          {googleAdSenseError && (
            <Alert variant="destructive">
              <AlertTitle>Erro na Conexão</AlertTitle>
              <AlertDescription>{googleAdSenseError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md bg-card text-card-foreground shadow-sm">
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/google-ads-icon.png"
                  alt="Google AdSense Icon"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <span className="font-medium">Google AdSense</span>
                  <p className="text-sm text-muted-foreground">
                    {isGoogleAdSenseConnected ? "Conta conectada" : "Conta não conectada"}
                  </p>
                </div>
              </div>
              <Button
                className={`${
                  isGoogleAdSenseConnected 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-yellow-500 hover:bg-yellow-600 text-black"
                }`}
                onClick={() => {
                  if (isGoogleAdSenseConnected) {
                    disconnectGoogleAdSense()
                  } else {
                    connectGoogleAdSense()
                  }
                }}
                disabled={isGoogleAdSenseLoading || isGoogleAdSenseConnecting}
              >
                {isGoogleAdSenseConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando...
                  </>
                ) : isGoogleAdSenseLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
                  </>
                ) : isGoogleAdSenseConnected ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Conectado
                  </>
                ) : (
                  "Conectar conta"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedPlatform === "analytics" && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-4">
            <Image src="/icons/google-analytics-orange.png" alt="Analytics Icon" width={24} height={24} />
            <h2 className="text-2xl font-semibold">Google Analytics</h2>
          </div>
          <p className="text-muted-foreground">Conecte sua conta do Google Analytics para acessar dados de tráfego e conversões.</p>

          {isGoogleAnalyticsLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando conexão...</span>
            </div>
          ) : isGoogleAnalyticsConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-3">
                  <Image
                    src="/icons/google-analytics-orange.png"
                    alt="Google Analytics Icon"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="font-medium">Google Analytics Conectado</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectGoogleAnalytics}
                  disabled={isGoogleAnalyticsLoading}
                >
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => handleConnect("analytics", 1)}
              disabled={isGoogleAnalyticsConnecting}
            >
              {isGoogleAnalyticsConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando...
                </>
              ) : (
                "Conectar com o Google Analytics"
              )}
            </Button>
          )}

          {googleAnalyticsError && (
            <Alert variant="destructive">
              <AlertTitle>Erro na Conexão</AlertTitle>
              <AlertDescription>{googleAnalyticsError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {selectedPlatform === "tiktok" && (
        <div className="mt-8 space-y-6">
          {[1].map((accountNum) => {
            const connected = isAccountConnected("tiktok", accountNum)
            const connecting = isConnecting("tiktok", accountNum)
            return (
              <div key={`tiktok-${accountNum}`} className="space-y-2">
                <div className="flex items-center gap-4">
                  <Image src="/icons/tiktok-new.png" alt="TikTok Ads Icon" width={24} height={24} />
                  <h3 className="text-xl font-semibold">{accountNum} TikTok ADS</h3>
                </div>
                <Button
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  onClick={() => handleConnect("tiktok", accountNum)}
                  disabled={connected || connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando...
                    </>
                  ) : connected ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Conectado
                    </>
                  ) : (
                    "Conectar conta"
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {selectedPlatform === "kwai" && (
        <div className="mt-8 space-y-6">
          {[1].map((accountNum) => {
            const connected = isAccountConnected("kwai", accountNum)
            const connecting = isConnecting("kwai", accountNum)
            return (
              <div key={`kwai-${accountNum}`} className="space-y-2">
                <div className="flex items-center gap-4">
                  <Image src="/icons/kwai-new.png" alt="Kwai Ads Icon" width={24} height={24} />
                  <h3 className="text-xl font-semibold">{accountNum} Kwai ADS</h3>
                </div>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => handleConnect("kwai", accountNum)}
                  disabled={connected || connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando...
                    </>
                  ) : connected ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Conectado
                    </>
                  ) : (
                    "Conectar conta"
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Render nothing if no platform is selected or if a platform is selected and its content is handled above */}
      {selectedPlatform === null && <div className="h-[calc(100vh-250px)]" />}
    </div>
  )
}
