"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Link, Play, Pause, RefreshCw, CheckCircle, AlertCircle, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { getFacebookAdAccounts, getFacebookCampaigns, updateFacebookCampaignStatus } from "@/lib/facebook-ads-service"
import type { FacebookAdAccount, FacebookCampaign } from "@/lib/types/facebook-ads"
import { useToast } from "@/components/ui/use-toast"
import { useFacebookAuth } from "@/hooks/use-facebook-auth"

export default function FacebookAdsManagerView() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const { 
    isConnected: facebookConnected, 
    isConnecting, 
    isLoading: authLoading, 
    error: authError,
    connectFacebook,
    disconnectFacebook,
    refreshConnection
  } = useFacebookAuth()

  const [adAccounts, setAdAccounts] = useState<FacebookAdAccount[]>([])
  const [selectedAdAccount, setSelectedAdAccount] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingCampaign, setIsUpdatingCampaign] = useState<string | null>(null)

  const fetchFacebookData = useCallback(async () => {
    if (!isAuthenticated || authLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const accounts = await getFacebookAdAccounts()
      setAdAccounts(accounts)
      if (accounts.length > 0) {
        // Se nenhuma conta está selecionada, usar a primeira
        if (!selectedAdAccount) {
          setSelectedAdAccount(accounts[0].id)
        }
      } else {
        setSelectedAdAccount(null)
        setCampaigns([])
      }
    } catch (err: any) {
      console.error("Erro ao buscar dados do Facebook:", err)
      setError(err.message || "Falha ao carregar dados do Facebook Ads.")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, authLoading, selectedAdAccount])

  useEffect(() => {
    if (facebookConnected) {
      fetchFacebookData()
    }
  }, [facebookConnected, fetchFacebookData])

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (selectedAdAccount) {
        setIsLoading(true)
        setError(null)
        try {
          const fetchedCampaigns = await getFacebookCampaigns(selectedAdAccount)
          setCampaigns(fetchedCampaigns)
        } catch (err: any) {
          console.error("Erro ao buscar campanhas:", err)
          setError(err.message || "Falha ao carregar campanhas.")
          setCampaigns([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setCampaigns([])
      }
    }
    fetchCampaigns()
  }, [selectedAdAccount])

  const handleUpdateCampaignStatus = async (campaignId: string, currentStatus: string) => {
    setIsUpdatingCampaign(campaignId)
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
    try {
      await updateFacebookCampaignStatus(campaignId, newStatus)
      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((campaign) => (campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign)),
      )
      toast({
        title: "Sucesso!",
        description: `Campanha ${newStatus === "ACTIVE" ? "ativada" : "pausada"} com sucesso.`,
      })
    } catch (err: any) {
      console.error("Erro ao atualizar status da campanha:", err)
      toast({
        title: "Erro",
        description: err.message || "Falha ao atualizar status da campanha.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingCampaign(null)
    }
  }

  const handleDisconnectFacebook = async () => {
    try {
      await disconnectFacebook()
      setAdAccounts([])
      setSelectedAdAccount(null)
      setCampaigns([])
    } catch (error) {
      console.error('Erro ao desconectar Facebook:', error)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Verificando autenticação...</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-500 mb-4">{authError}</p>
        <Button onClick={refreshConnection}>
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    )
  }

  if (!facebookConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center p-4">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Link className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Conectar com o Facebook</h3>
          <p className="text-muted-foreground mb-6">
            Conecte sua conta do Facebook para gerenciar seus anúncios e campanhas publicitárias.
          </p>
        </div>
        
        <Button 
          onClick={connectFacebook} 
          disabled={isConnecting}
          className="px-6 py-3"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Link className="mr-2 h-4 w-4" />
              Conectar com o Facebook
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4 max-w-md">
          Ao conectar, você autoriza o acesso aos dados de suas campanhas publicitárias do Facebook Ads.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header com status de conexão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h2 className="text-xl font-semibold">Facebook Ads Manager</h2>
            <p className="text-sm text-muted-foreground">Conectado ao Facebook</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchFacebookData} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleDisconnectFacebook} disabled={isLoading}>
            <LogOut className="mr-2 h-4 w-4" />
            Desconectar
          </Button>
        </div>
      </div>

      <Card className="border-0 bg-black shadow-lg shadow-blue-500/10 overflow-hidden">
        <CardHeader className="pb-2 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg flex items-center text-white">
                <Link className="h-5 w-5 mr-2 text-blue-400" />
                Contas de Anúncio do Facebook
              </CardTitle>
              <CardDescription className="text-blue-300">
                Selecione uma conta para visualizar as campanhas.
              </CardDescription>
            </div>
            <Select
              value={selectedAdAccount || ""}
              onValueChange={setSelectedAdAccount}
              disabled={adAccounts.length === 0 || isLoading}
            >
              <SelectTrigger className="h-8 w-[200px] text-xs bg-black border border-blue-500/30 text-white">
                <SelectValue placeholder="Selecionar Conta" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-blue-500/30">
                {adAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading && selectedAdAccount ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Carregando campanhas...</p>
            </div>
          ) : campaigns.length === 0 && selectedAdAccount ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Nenhuma campanha encontrada para esta conta.</p>
            </div>
          ) : !selectedAdAccount ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Selecione uma conta de anúncio para ver as campanhas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10">
                    <TableHead className="text-blue-300">Nome da Campanha</TableHead>
                    <TableHead className="text-blue-300">Status</TableHead>
                    <TableHead className="text-right text-blue-300">Gasto Total</TableHead>
                    <TableHead className="text-right text-blue-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="hover:bg-blue-900/30 transition-colors duration-200">
                      <TableCell className="font-medium text-white">{campaign.name}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === "ACTIVE"
                              ? "bg-emerald-950 text-emerald-400"
                              : "bg-rose-950 text-rose-400"
                          }`}
                        >
                          {campaign.status === "ACTIVE" ? "ATIVA" : "PAUSADA"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-white">
                        R${" "}
                        {Number.parseFloat(campaign.insights?.[0]?.spend || "0")
                          .toFixed(2)
                          .replace(".", ",")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateCampaignStatus(campaign.id, campaign.status)}
                          disabled={isUpdatingCampaign === campaign.id}
                          className="h-8 px-3 py-1.5 text-xs bg-black border border-blue-500/30 text-white hover:bg-blue-950"
                        >
                          {isUpdatingCampaign === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : campaign.status === "ACTIVE" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          <span className="ml-2">{campaign.status === "ACTIVE" ? "Pausar" : "Ativar"}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
