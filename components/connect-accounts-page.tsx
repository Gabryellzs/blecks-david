"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getFacebookAdAccounts } from "@/lib/facebook-ads-service"
import type { FacebookAdAccount } from "@/lib/types/facebook-ads"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { useGoogleAdSenseAuth } from "@/hooks/use-google-adsense-auth"
import { useGoogleAnalyticsAuth } from "@/hooks/use-google-analytics-auth"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSearchParams } from "next/navigation"

interface ConnectAccountsPageProps {
  onBack: () => void
}

type Platform = "meta" | "google" | "analytics" | "tiktok" | "kwai" | null

interface ConnectedAccountsState {
  meta: { id: string; name: string; pictureUrl?: string | null }[]
  google: number[]
  analytics: number[]
  tiktok: number[]
  kwai: number[]
}

export function ConnectAccountsPage({ onBack }: ConnectAccountsPageProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null)

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccountsState>({
    meta: [],
    google: [],
    analytics: [],
    tiktok: [],
    kwai: [],
  })

  const [connectingAccount, setConnectingAccount] = useState<{ platform: Platform; id: number } | null>(null)

  // Ad accounts (Meta)
  const [facebookAdAccounts, setFacebookAdAccounts] = useState<FacebookAdAccount[] | any>([])
  const [adAccountStatuses, setAdAccountStatuses] = useState<Record<string, boolean>>({})
  const [loadingFacebookAdAccounts, setLoadingFacebookAdAccounts] = useState(false)
  const [facebookAdAccountsError, setFacebookAdAccountsError] = useState<string | null>(null)

  const [selectedMetaProfileId, setSelectedMetaProfileId] = useState<string | null>(null)

  // Google AdSense (Google Ads)
  const {
    isConnected: isGoogleAdSenseConnected,
    isLoading: isGoogleAdSenseLoading,
    isConnecting: isGoogleAdSenseConnecting,
    error: googleAdSenseError,
    connectGoogleAdSense,
  } = useGoogleAdSenseAuth()

  // Google Analytics
  const {
    isConnected: isGoogleAnalyticsConnected,
    isLoading: isGoogleAnalyticsLoading,
    isConnecting: isGoogleAnalyticsConnecting,
    error: googleAnalyticsError,
    connectGoogleAnalytics,
    disconnectGoogleAnalytics,
  } = useGoogleAnalyticsAuth()

  // ----------------------------
  // LocalStorage – hidratar com normalização
  // ----------------------------
  useEffect(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem("connectedAccounts")
    const parsed = stored
      ? (() => {
          try {
            return JSON.parse(stored)
          } catch {
            return null
          }
        })()
      : null

    const ensureArray = (v: any) => (Array.isArray(v) ? v : [])

    const metaNorm = ensureArray(parsed?.meta).map((p: any) => ({
      id: String(p?.id ?? ""),
      name: String(p?.name ?? "Sem nome"),
      pictureUrl: p?.pictureUrl ?? null,
    }))

    setConnectedAccounts({
      meta: metaNorm,
      google: ensureArray(parsed?.google),
      analytics: ensureArray(parsed?.analytics),
      tiktok: ensureArray(parsed?.tiktok),
      kwai: ensureArray(parsed?.kwai),
    })

    const sStatuses = localStorage.getItem("adAccountStatuses")
    if (sStatuses) {
      try {
        const parsedStatuses = JSON.parse(sStatuses)
        setAdAccountStatuses(typeof parsedStatuses === "object" && parsedStatuses ? parsedStatuses : {})
      } catch {
        setAdAccountStatuses({})
      }
    }
  }, [])

  // salvar no localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("connectedAccounts", JSON.stringify(connectedAccounts))
  }, [connectedAccounts])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("adAccountStatuses", JSON.stringify(adAccountStatuses))
  }, [adAccountStatuses])

  // ----------------------------
  // Helpers (tiktok/kwai + google/analytics)
  // ----------------------------
  const handleConnect = useCallback(
    async (platform: Platform, accountId: number) => {
      if (!platform) return

      if (platform === "google") {
        await connectGoogleAdSense()
        return
      }

      if (platform === "analytics") {
        await connectGoogleAnalytics()
        return
      }

      setConnectingAccount({ platform, id: accountId })
      await new Promise((r) => setTimeout(r, 1500))

      setConnectedAccounts((prev) => {
        const next = { ...prev }
        if (platform === "tiktok") {
          if (!next.tiktok.includes(accountId)) next.tiktok = [...next.tiktok, accountId]
        } else if (platform === "kwai") {
          if (!next.kwai.includes(accountId)) next.kwai = [...next.kwai, accountId]
        }
        return next
      })
      setConnectingAccount(null)
    },
    [connectGoogleAdSense, connectGoogleAnalytics],
  )

  const isAccountConnected = useCallback(
    (platform: Platform, accountId: number | string) => {
      if (!platform) return false
      if (platform === "meta") return connectedAccounts.meta.some((p) => p.id === accountId)
      if (platform === "google") return isGoogleAdSenseConnected
      if (platform === "analytics") return isGoogleAnalyticsConnected
      return (connectedAccounts[platform as keyof ConnectedAccountsState] as number[])?.includes(accountId as number)
    },
    [connectedAccounts, isGoogleAdSenseConnected, isGoogleAnalyticsConnected],
  )

  const isConnecting = useCallback(
    (platform: Platform, accountId: number) => {
      if (platform === "google") return isGoogleAdSenseConnecting
      if (platform === "analytics") return isGoogleAnalyticsConnecting
      return connectingAccount?.platform === platform && connectingAccount?.id === accountId
    },
    [connectingAccount, isGoogleAdSenseConnecting, isGoogleAnalyticsConnecting],
  )

  // ----------------------------
  // Meta – botão conectar
  // ----------------------------
  const [isFacebookConnecting, setIsFacebookConnecting] = useState(false)

  const handleConnectFacebook = useCallback(() => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive",
      })
      return
    }
    setIsFacebookConnecting(true)
    window.location.href = "/api/auth/facebook"
  }, [user?.id, toast])

  // ----------------------------
  // Meta – carregar perfis (accounts) ao abrir a aba
  // ----------------------------
  const metaProfilesLoadedRef = useRef(false)
  const metaCooldownUntilRef = useRef<number | null>(null)

  useEffect(() => {
    if (selectedPlatform !== "meta") return

    // se voltou do OAuth com sucesso, forçar reload
    const fbParam = searchParams?.get("fb")
    if (fbParam === "ok") {
      metaProfilesLoadedRef.current = false
      metaCooldownUntilRef.current = null
      if (isFacebookConnecting) setIsFacebookConnecting(false)
    }

    const now = Date.now()
    if (metaCooldownUntilRef.current && now < metaCooldownUntilRef.current) return
    if (metaProfilesLoadedRef.current) return

    const loadMetaProfiles = async () => {
      try {
        const res = await fetch("/api/facebook-ads/accounts", { credentials: "include" })

        // respeita rate limit (429)
        if (res.status === 429) {
          let cooldownSeconds = 60
          try {
            const body = await res.json()
            if (typeof body?.cooldownSeconds === "number" && body.cooldownSeconds > 0) {
              cooldownSeconds = body.cooldownSeconds
            }
          } catch {}
          metaCooldownUntilRef.current = Date.now() + cooldownSeconds * 1000
          setTimeout(() => {
            metaProfilesLoadedRef.current = false
            metaCooldownUntilRef.current = null
          }, cooldownSeconds * 1000)
          toast({
            title: "Aguarde um pouco",
            description: `Muitas chamadas ao Meta agora. Tentaremos novamente em ~${cooldownSeconds}s.`,
          })
          return
        }

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Falha ao buscar contas do Meta (${res.status})`)
        }

        const data = await res.json()
        const raw = Array.isArray(data?.accounts)
          ? data.accounts
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : []

        const profiles = raw.map((acc: any) => ({
          // Graph geralmente: { id: "act_123", account_id: "123", name: "..." }
          id: acc.id ?? (acc.account_id ? `act_${acc.account_id}` : String(acc.accountId ?? acc.account_id)),
          name: acc.name ?? acc.account_name ?? "Sem nome",
          pictureUrl: acc.pictureUrl ?? acc.picture_url ?? null,
        }))

        setConnectedAccounts((prev) => ({ ...prev, meta: profiles }))
        if (profiles.length && !selectedMetaProfileId) setSelectedMetaProfileId(profiles[0].id)
        metaProfilesLoadedRef.current = true
      } catch (err: any) {
        console.error(err)
        toast({
          title: "Erro",
          description: err?.message || "Não foi possível carregar seus perfis do Meta.",
          variant: "destructive",
        })
        setConnectedAccounts((prev) => ({ ...prev, meta: [] }))
      }
    }

    loadMetaProfiles()
  }, [selectedPlatform, toast, selectedMetaProfileId, searchParams, isFacebookConnecting])

  // reset guard ao trocar de aba
  useEffect(() => {
    if (selectedPlatform !== "meta") {
      metaProfilesLoadedRef.current = false
    }
  }, [selectedPlatform])

  // ----------------------------
  // Meta – carregar ad accounts quando houver perfis
  // ----------------------------
  const adAccountsLoadedRef = useRef(false)

  const fetchFacebookAdAccounts = useCallback(
    async (retry = 0) => {
      setLoadingFacebookAdAccounts(true)
      setFacebookAdAccountsError(null)
      try {
        const accountsResp = await getFacebookAdAccounts()

        // NORMALIZAÇÃO: garantir array
        const accounts: FacebookAdAccount[] = Array.isArray(accountsResp)
          ? accountsResp
          : Array.isArray((accountsResp as any)?.data)
          ? (accountsResp as any).data
          : []

        setFacebookAdAccounts(accounts)

        const initial: Record<string, boolean> = {}
        accounts.forEach((a) => {
          initial[a.id] = adAccountStatuses[a.id] ?? a.account_status === 1
        })
        setAdAccountStatuses(initial)
      } catch (error: any) {
        const msg = String(error?.message || "")
        if (msg.includes("#80004") && retry < 3) {
          const waitMs = 2000 * Math.pow(2, retry)
          setTimeout(() => fetchFacebookAdAccounts(retry + 1), waitMs)
          return
        }
        setFacebookAdAccountsError(msg || "Falha ao carregar contas de anúncio do Facebook.")
        toast({
          title: "Erro ao buscar contas de anúncio",
          description: msg.includes("#80004")
            ? "Muitas chamadas no momento. Tentaremos novamente em instantes."
            : msg || "Falha ao carregar contas de anúncio.",
          variant: "destructive",
        })
      } finally {
        setLoadingFacebookAdAccounts(false)
      }
    },
    [adAccountStatuses, toast],
  )

  useEffect(() => {
    if (selectedPlatform !== "meta") return
    if (connectedAccounts.meta.length === 0) return
    if (adAccountsLoadedRef.current) return
    if (metaCooldownUntilRef.current && Date.now() < metaCooldownUntilRef.current) return

    fetchFacebookAdAccounts()
    adAccountsLoadedRef.current = true
  }, [selectedPlatform, connectedAccounts.meta, fetchFacebookAdAccounts])

  // ----------------------------
  // Handlers de toggles (ad accounts)
  // ----------------------------
  const handleToggleAdAccount = useCallback(
    async (adAccountId: string, currentStatus: boolean) => {
      const newStatus = !currentStatus
      setAdAccountStatuses((prev) => ({ ...prev, [adAccountId]: newStatus }))
      try {
        // aqui você chamaria a API real para ativar/pausar a conta
        toast({
          title: "Status atualizado",
          description: `Conta ${adAccountId} ${newStatus ? "ativada" : "pausada"} (simulado).`,
        })
      } catch (e: any) {
        // reverte em caso de erro
        setAdAccountStatuses((prev) => ({ ...prev, [adAccountId]: currentStatus }))
        toast({
          title: "Erro ao atualizar",
          description: e?.message || "Falha ao atualizar status.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleToggleAllAdAccounts = useCallback(
    async (checked: boolean) => {
      setAdAccountStatuses((prev) => {
        const next = { ...prev }
        adAccountsSafe.forEach((acc) => {
          next[acc.id] = checked
        })
        return next
      })
      try {
        toast({
          title: "Status atualizado",
          description: `Todas as contas foram ${checked ? "ativadas" : "pausadas"} (simulado).`,
        })
      } catch (e: any) {
        toast({
          title: "Erro ao atualizar todas",
          description: e?.message || "Falha ao atualizar todas as contas.",
          variant: "destructive",
        })
      }
    },
    // adAccountsSafe é definido abaixo; em callbacks, tudo bem não pôr na deps aqui
    [toast],
  )

  // ----------------------------
  // UI
  // ----------------------------
  const metaProfiles = Array.isArray(connectedAccounts.meta) ? connectedAccounts.meta : []
  const adAccountsSafe: FacebookAdAccount[] = Array.isArray(facebookAdAccounts)
    ? facebookAdAccounts
    : Array.isArray((facebookAdAccounts as any)?.data)
    ? (facebookAdAccounts as any).data
    : []

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

      {/* META */}
      {selectedPlatform === "meta" && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center gap-4" />
          <p className="text-muted-foreground">Conecte seus perfis por aqui:</p>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onClick={handleConnectFacebook}
            disabled={isFacebookConnecting}
          >
            {isFacebookConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : metaProfiles.length > 0 ? (
              "Adicionar outro perfil"
            ) : (
              "Adicionar perfil"
            )}
          </Button>

          {/* Lista de perfis conectados */}
          {metaProfiles.length > 0 && (
            <div className="mt-4 space-y-3">
              {metaProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 border rounded-md bg-card text-card-foreground"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.pictureUrl ?? "/placeholder-user.jpg"} alt={profile.name ?? "Perfil"} />
                      <AvatarFallback>
                        {(profile.name ?? "US")
                          .split(" ")
                          .map((s: string) => s[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="font-medium leading-none">{profile.name ?? "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground mt-1">ID: {profile.id}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={selectedMetaProfileId === profile.id ? "default" : "outline"}
                      onClick={() => setSelectedMetaProfileId(profile.id)}
                    >
                      {selectedMetaProfileId === profile.id ? "Selecionado" : "Selecionar"}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-destructive/10"
                      onClick={() => {
                        setConnectedAccounts((prev) => ({
                          ...prev,
                          meta: prev.meta.filter((p) => p.id !== profile.id),
                        }))
                        if (selectedMetaProfileId === profile.id) setSelectedMetaProfileId(null)
                        toast({
                          title: "Perfil desconectado",
                          description: `O perfil ${profile.name ?? profile.id} foi desconectado.`,
                        })
                      }}
                      aria-label="Desconectar perfil"
                      title="Desconectar perfil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contas de anúncio (Meta) */}
          {metaProfiles.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Contas de Anúncio (Meta)</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="toggle-all-ad-accounts">Ativar todas:</Label>
                  <Switch
                    id="toggle-all-ad-accounts"
                    checked={
                      adAccountsSafe.every((account) => adAccountStatuses[account.id]) &&
                      adAccountsSafe.length > 0
                    }
                    onCheckedChange={async (checked) => {
                      await handleToggleAllAdAccounts(checked)
                    }}
                    disabled={loadingFacebookAdAccounts || adAccountsSafe.length === 0}
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
              ) : adAccountsSafe.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma conta de anúncio encontrada para este perfil.</p>
              ) : (
                <div className="space-y-4">
                  {adAccountsSafe.map((account) => (
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
                        onCheckedChange={() =>
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

      {/* GOOGLE ADS */}
      {selectedPlatform === "google" && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center gap-2" />
          <p className="text-muted-foreground">Conecte seus perfis por aqui:</p>

          {googleAdSenseError && (
            <Alert variant="destructive">
              <AlertTitle>Erro na Conexão</AlertTitle>
              <AlertDescription>{googleAdSenseError}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={() => connectGoogleAdSense()}
            disabled={isGoogleAdSenseLoading || isGoogleAdSenseConnecting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isGoogleAdSenseConnecting || isGoogleAdSenseLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              "Adicionar perfil"
            )}
          </Button>
        </div>
      )}

      {/* ANALYTICS */}
      {selectedPlatform === "analytics" && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center gap-2" />
          <p className="text-muted-foreground">Conecte seus perfis por aqui:</p>

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
                <Button variant="outline" size="sm" onClick={disconnectGoogleAnalytics} disabled={isGoogleAnalyticsLoading}>
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              onClick={() => handleConnect("analytics", 1)}
              disabled={isGoogleAnalyticsConnecting}
            >
              {isGoogleAnalyticsConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando...
                </>
              ) : (
                "Adicionar perfil"
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

      {/* TIKTOK */}
      {selectedPlatform === "tiktok" && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center gap-2" />
          <p className="text-muted-foreground">Conecte seus perfis por aqui:</p>
          {(() => {
            const connected = isAccountConnected("tiktok", 1)
            const connecting = isConnecting("tiktok", 1)
            return (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={() => handleConnect("tiktok", 1)}
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
                  "Adicionar perfil"
                )}
              </Button>
            )
          })()}
        </div>
      )}

      {/* KWAI */}
      {selectedPlatform === "kwai" && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center gap-2" />
          <p className="text-muted-foreground">Conecte seus perfis por aqui:</p>
          {(() => {
            const connected = isAccountConnected("kwai", 1)
            const connecting = isConnecting("kwai", 1)
            return (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={() => handleConnect("kwai", 1)}
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
                  "Adicionar perfil"
                )}
              </Button>
            )
          })()}
        </div>
      )}

      {selectedPlatform === null && <div className="h-[calc(100vh-250px)]" />}
    </div>
  )
}