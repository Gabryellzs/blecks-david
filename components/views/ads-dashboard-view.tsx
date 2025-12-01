"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BarChart, LineChart, DonutChart } from "@/components/ui/charts"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  BarChart3,
  TrendingUp,
  Users,
  MousePointer,
  Eye,
  DollarSign,
  Download,
  Target,
  ShoppingCart,
  Percent,
  Activity,
  Facebook,
  Music,
  Video,
  ArrowUp,
  ArrowDown,
  Star,
  Clock,
  ExternalLink,
  Heart,
  Play,
  Zap,
  Award,
  Globe,
  Sparkles,
  BarChart2,
  LineChartIcon,
  Smartphone,
  Monitor,
  Tablet,
  Settings,
  ChevronDown,
} from "lucide-react"
import { ConnectAccountsPage } from "@/components/connect-accounts-page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  PlusCircle,
  RefreshCw,
  ExternalLink as ExternalLinkIcon,
  PlayIcon,
  Pause,
  Trash2,
  Pencil,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import {
  getFacebookAdAccounts,
  getFacebookCampaigns,
  updateFacebookCampaignStatus,
  updateFacebookAdAccountStatus,
  getFacebookAds,
  updateFacebookCampaignName,
  updateFacebookCampaignBudget,
} from "@/lib/facebook-ads-service"
import type { FacebookAdAccount, FacebookCampaign } from "@/lib/types/facebook-ads"
import { Skeleton } from "@/components/ui/skeleton"
console.log("✅ RENDER AdsDashboardView atualizado")
import { getFacebookAdSets } from "@/lib/facebook-ads-service" 
import { createClient } from "@supabase/supabase-js"
import { getFacebookCampaignsWithInsights } from "@/lib/facebook-ads-service"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"






// Adicione este estilo para esconder a barra de rolagem
const scrollbarHideStyle = `
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`

// Tipos para métricas de anúncios
interface AdMetric {
  id: string
  name: string
  value: number
  change: number
  format: "number" | "currency" | "percent"
  icon: React.ReactNode
}

// Tipos para dados de gráficos
interface ChartData {
  date: string
  impressions?: number
  clicks?: number
  conversions?: number
  ctr?: number
  cpc?: number
  spend?: number
  revenue?: number
  roas?: number
  sessions?: number
  users?: number
  pageviews?: number
  bounceRate?: number
  videoViews?: number
  shares?: number
  comments?: number
  likes?: number
  completionRate?: number
  followers?: number
}

type AdPlatform = "facebook" | "google" | "analytics" | "tiktok" | "kwai"

const platformLogos: Record<AdPlatform, string> = {
  facebook: "/icons/meta-new.png",
  google: "/icons/google-analytics-new.png",
  analytics: "/icons/google-analytics-orange.png",
  tiktok: "/icons/tiktok-new.png",
  kwai: "/icons/kwai-logo.png",
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)


export default function AdsDashboardView() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<AdPlatform>("facebook")
  const [adAccounts, setAdAccounts] = useState<FacebookAdAccount[]>([])
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([])
  const [searchCampaigns, setSearchCampaigns] = useState("")
  const [statusCampaignsFilter, setStatusCampaignsFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL")
  const [campaignsPage, setCampaignsPage] = useState(1)
  const [campaignsPageSize, setCampaignsPageSize] = useState(25)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [dateRange, setDateRange] = useState("7d")
  const [isMenuOpen, setIsMenuOpen] = useLocalStorage("ads-menu-open", true)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [adSets, setAdSets] = useState<any[]>([])
  const [searchAdSets, setSearchAdSets] = useState("")
  const [statusAdSetsFilter, setStatusAdSetsFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL")
  const [adSetsPage, setAdSetsPage] = useState(1)
  const [adSetsPageSize, setAdSetsPageSize] = useState(25)
  const [loadingAdSets, setLoadingAdSets] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState("graficos")
  const [selectedAccount, setSelectedAccountInternal] = useState("") // Renamed to avoid conflict
  const [hasError, setHasError] = useState(false)
  const [isConnectView, setIsConnectView] = useState(false)
  const [ads, setAds] = useState<any[]>([])
  const [loadingAds, setLoadingAds] = useState(false)
  const [searchAds, setSearchAds] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL")
  const [adsPage, setAdsPage] = useState(1)
  const [adsPageSize, setAdsPageSize] = useState(25)
  const [totalAds, setTotalAds] = useState<number | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<{ id: string; name: string } | null>(null)
  const [editingCampaignName, setEditingCampaignName] = useState("")
  const [isSavingCampaignName, setIsSavingCampaignName] = useState(false)
  const [editingBudgetCampaign, setEditingBudgetCampaign] = useState<{ id: string; budget: number | null } | null>(null)
  const [editingBudgetValue, setEditingBudgetValue] = useState("")
  const [isSavingBudget, setIsSavingBudget] = useState(false)
  const selectedAccountName = useMemo(() => {
  if (!selectedAccountId) return "Contas"
  const acc = adAccounts?.find(a => a.id === selectedAccountId)
  return acc?.name || "Contas"
}, [adAccounts, selectedAccountId])

const mapDateRangeToMetaPreset = (range: string): string => {
  switch (range) {
    case "today":
      return "today"
    case "yesterday":
      return "yesterday"
    case "thisMonth":
      return "this_month"
    case "lastMonth":
      return "last_month"

    case "max":
      // "Máximo" -> no máximo 1 ano pra trás
      return "this_year"

    case "custom":
      // até ter seletor de datas manual, usa 7 dias como padrão
      return "last_7d"

    case "7d":
    default:
      return "last_7d"
  }
}



const filteredCampaigns = useMemo(() => {
  const byText = searchCampaigns.trim().toLowerCase()
  return (campaigns || []).filter((c: any) => {
    const passStatus =
      statusCampaignsFilter === "ALL" ? true : c.status === statusCampaignsFilter
    const passText =
      !byText || String(c.name || "").toLowerCase().includes(byText)
    return passStatus && passText
  })
}, [campaigns, searchCampaigns, statusCampaignsFilter])

// 🔹 RESUMO GERAL (soma/médias) – usado na linha de totais do cabeçalho
const campaignsSummary = useMemo(() => {
  const totals = (filteredCampaigns || []).reduce(
    (acc, c: any) => {
      const spend = Number(c.spend) || 0
      const results = Number(c.results) || 0
      const clicks = Number(c.inline_link_clicks) || 0
      const roas = c.roas != null ? Number(c.roas) : null
      const cpm = c.cpm != null ? Number(c.cpm) : null
      const ctr = c.ctr != null ? Number(c.ctr) : null

      acc.totalSpend += spend
      acc.totalResults += results
      acc.totalClicks += clicks

      // ROAS médio ponderado por gasto
      if (roas !== null && !Number.isNaN(roas) && spend > 0) {
        acc.weightedRoasSum += roas * spend
        acc.weightedRoasWeight += spend
      }

      // CPM médio ponderado por gasto
      if (cpm !== null && !Number.isNaN(cpm) && spend > 0) {
        acc.weightedCpmSum += cpm * spend
        acc.weightedCpmWeight += spend
      }

      // CTR médio ponderado por cliques
      if (ctr !== null && !Number.isNaN(ctr) && clicks > 0) {
        acc.weightedCtrSum += ctr * clicks
        acc.weightedCtrWeight += clicks
      }

      return acc
    },
    {
      totalSpend: 0,
      totalResults: 0,
      totalClicks: 0,
      weightedRoasSum: 0,
      weightedRoasWeight: 0,
      weightedCpmSum: 0,
      weightedCpmWeight: 0,
      weightedCtrSum: 0,
      weightedCtrWeight: 0,
    }
  )

  const avgCostPerResult =
    totals.totalResults > 0 ? totals.totalSpend / totals.totalResults : null

  const avgCpc =
    totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : null

  const avgRoas =
    totals.weightedRoasWeight > 0
      ? totals.weightedRoasSum / totals.weightedRoasWeight
      : null

  const avgCpm =
    totals.weightedCpmWeight > 0
      ? totals.weightedCpmSum / totals.weightedCpmWeight
      : null

  const avgCtr =
    totals.weightedCtrWeight > 0
      ? totals.weightedCtrSum / totals.weightedCtrWeight
      : null

  return {
    totalSpend: totals.totalSpend,
    totalResults: totals.totalResults,
    totalClicks: totals.totalClicks,
    avgCostPerResult,
    avgCpc,
    avgRoas,
    avgCpm,
    avgCtr,
  }
}, [filteredCampaigns])

// 🔹 LISTA PAGINADA – usada no {pagedCampaigns.map(...)} da tabela
const pagedCampaigns = useMemo(() => {
  const start = (campaignsPage - 1) * campaignsPageSize
  return filteredCampaigns.slice(start, start + campaignsPageSize)
}, [filteredCampaigns, campaignsPage, campaignsPageSize])




const filteredAdSets = useMemo(() => {
  const byText = searchAdSets.trim().toLowerCase()
  return (adSets || []).filter((s: any) => {
    const passStatus =
      statusAdSetsFilter === "ALL" ? true : s.status === statusAdSetsFilter
    const passText =
      !byText || String(s.name || "").toLowerCase().includes(byText)
    return passStatus && passText
  })
}, [adSets, searchAdSets, statusAdSetsFilter])

const pagedAdSets = useMemo(() => {
  const start = (adSetsPage - 1) * adSetsPageSize
  return filteredAdSets.slice(start, start + adSetsPageSize)
}, [filteredAdSets, adSetsPage, adSetsPageSize])


const handleSelectAccount = useCallback((accId: string) => {
  setSelectedAccountId(accId)

  // mantém o string interno sincronizado (se você ainda usa em outros lugares)
  const acc = adAccounts?.find(a => a.id === accId)
  setSelectedAccountInternal(acc?.name ?? "")

  // se quiser mudar de aba ao selecionar uma conta, descomente:
  // setActiveSubTab("campanhas")
}, [adAccounts])

  
  useEffect(() => {
    const styleId = "scrollbar-hide-style"
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement("style")
      styleElement.id = styleId
      styleElement.textContent = scrollbarHideStyle
      document.head.appendChild(styleElement)
    }

    const checkVisibility = () => {
      const element = document.getElementById("ads-dashboard-container")
      if (element && !element.offsetParent) {
        console.log("Dashboard ADS não está visível, tentando restaurar...")
        setActiveTab((prev) => prev)
      }
    }

    const visibilityInterval = setInterval(checkVisibility, 2000)

    return () => {
      clearInterval(visibilityInterval)
    }
  }, [])

  const fetchAdAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const accounts = await getFacebookAdAccounts()
      setAdAccounts(accounts)
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id)
      }
      toast({
        title: "Contas de Anúncios Carregadas",
        description: `Foram encontradas ${accounts.length} contas de anúncios.`,
      })
    } catch (error) {
      console.error("Erro ao buscar contas de anúncios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas de anúncios.",
        variant: "destructive",
      })
    } finally {
      setLoadingAccounts(false)
    }
  }

  const fetchCampaigns = async (accountId: string) => {
  setLoadingCampaigns(true)
  try {
    const { data } = await supabase.auth.getUser()
    const uuid = data?.user?.id || undefined

    // usa o filtro selecionado no topo (incluindo "Máximo" = 1 ano)
    const preset = mapDateRangeToMetaPreset(dateRange)

    const rows = await getFacebookCampaignsWithInsights(
      accountId, // ex: act_1283096579202144
      uuid,      // uuid do usuário
      preset     // agora é dinâmico
    )

    setCampaigns(rows as any[])
    toast({
      title: "Campanhas carregadas",
      description: `Foram carregadas ${rows.length} campanhas.`,
    })
  } catch (e) {
    console.error(e)
    toast({
      title: "Erro",
      description: "Não foi possível carregar as campanhas.",
      variant: "destructive",
    })
  } finally {
    setLoadingCampaigns(false)
  }
}


  const getCurrentUuid = async (): Promise<string | undefined> => {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.warn("Não foi possível obter o usuário via Supabase auth:", error)
    return undefined
  }
  return data?.user?.id
}


  const fetchAdSets = async (accountId: string) => {
  setLoadingAdSets(true)
  try {
    // pega o uuid do usuário logado no client
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    const uuid = userData?.user?.id || undefined
    if (userErr) {
      console.warn("Não foi possível obter o usuário via Supabase auth:", userErr)
    }

    const fetched = await getFacebookAdSets(accountId, uuid) // <-- passa o uuid
    setAdSets(fetched || [])

    toast({
      title: "Conjuntos Carregados",
      description: `Foram encontrados ${fetched?.length ?? 0} conjuntos para a conta ${accountId}.`,
    })
  } catch (error) {
    console.error(`Erro ao buscar conjuntos para a conta ${accountId}:`, error)
    toast({
      title: "Erro",
      description: `Não foi possível carregar os conjuntos para a conta ${accountId}.`,
      variant: "destructive",
    })
  } finally {
    setLoadingAdSets(false)
  }
}

const fetchAds = async (accountId: string) => {
  setLoadingAds(true)
  try {
    const uuid = await getCurrentUuid()
    const limit = adsPageSize
    const offset = (adsPage - 1) * adsPageSize

    const fetched = await getFacebookAds(accountId, uuid, {
      limit,
      offset,
      status: statusFilter,
      q: searchAds.trim() || undefined,
    })

    // Se sua API retornar { data, total }, ajuste:
    if ((fetched as any)?.data && typeof (fetched as any)?.total === "number") {
      setAds((fetched as any).data || [])
      setTotalAds((fetched as any).total)
    } else {
      // fallback se vier só array
      setAds(Array.isArray(fetched) ? fetched : [])
      setTotalAds(null)
    }

    toast({
      title: "Anúncios carregados",
      description: `Foram encontrados ${(Array.isArray(fetched) ? fetched.length : (fetched?.data?.length ?? 0))} anúncios para a conta ${accountId}.`,
    })
  } catch (err) {
    console.error(`Erro ao buscar anúncios da conta ${accountId}:`, err)
    toast({
      title: "Erro",
      description: `Não foi possível carregar os anúncios para a conta ${accountId}.`,
      variant: "destructive",
    })
  } finally {
    setLoadingAds(false)
  }
}


useEffect(() => {
  if (activeTab === "facebook" && activeSubTab === "anuncios" && selectedAccountId) {
    fetchAds(selectedAccountId)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, activeSubTab, selectedAccountId, searchAds, statusFilter, , dateRange, adsPage, adsPageSize])


  // 1) Carrega contas ao entrar na aba Facebook
useEffect(() => {
  if (activeTab === "facebook") {
    fetchAdAccounts()
  }
}, [activeTab]) // se usar useCallback no fetch, coloque-o nas deps também

// 2) Campanhas — só quando a sub-aba "campanhas" estiver ativa
useEffect(() => {
  if (
    activeTab === "facebook" &&
    activeSubTab === "campanhas" &&
    selectedAccountId
  ) {
    fetchCampaigns(selectedAccountId)
  }
}, [activeTab, activeSubTab, selectedAccountId, dateRange])

// 3) Conjuntos — só quando a sub-aba "conjuntos" estiver ativa
useEffect(() => {
  if (
    activeTab === "facebook" &&
    activeSubTab === "conjuntos" &&
    selectedAccountId
  ) {
    fetchAdSets(selectedAccountId)
  }
}, [activeTab, activeSubTab, selectedAccountId, dateRange])

// (opcional) Anúncios — se tiver a aba
useEffect(() => {
  if (
    activeTab === "facebook" &&
    activeSubTab === "anuncios" &&
    selectedAccountId
  ) {
    fetchAds(selectedAccountId)
  }
}, [activeTab, activeSubTab, selectedAccountId, dateRange])

useEffect(() => {
  if (activeSubTab === "anuncios") setAdsPage(1)
}, [selectedAccountId, activeSubTab])

useEffect(() => {
  setCampaignsPage(1)
}, [searchCampaigns, statusCampaignsFilter, selectedAccountId])

useEffect(() => {
  setAdSetsPage(1)
}, [searchAdSets, statusAdSetsFilter, selectedAccountId])


  const handleAccountStatusChange = async (accountId: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? "PAUSED" : "ACTIVE"
    try {
      await updateFacebookAdAccountStatus(accountId, newStatus)
      toast({
        title: "Status da Conta Atualizado",
        description: `A conta ${accountId} foi ${newStatus === "ACTIVE" ? "ativada" : "pausada"}.`,
      })
      fetchAdAccounts() // Refresh accounts
    } catch (error) {
      console.error("Erro ao atualizar status da conta:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da conta.",
        variant: "destructive",
      })
    }
  }

    const handleStartEditCampaignName = (campaign: any) => {
    setEditingCampaign({ id: campaign.id, name: campaign.name || "" })
    setEditingCampaignName(campaign.name || "")
  }

  const handleCancelEditCampaignName = () => {
    setEditingCampaign(null)
    setEditingCampaignName("")
    setIsSavingCampaignName(false)
  }

  const handleSaveCampaignName = async () => {
  if (!editingCampaign) return

  const newName = editingCampaignName.trim()
  if (!newName || newName === editingCampaign.name) {
    handleCancelEditCampaignName()
    return
  }

  try {
    setIsSavingCampaignName(true)

    // 1) Atualiza no Facebook via API
    await updateFacebookCampaignName(editingCampaign.id, newName)

    // 2) Atualiza na sua lista / ou recarrega do backend
    if (selectedAccountId) {
      await fetchCampaigns(selectedAccountId)
    } else {
      setCampaigns((prev) =>
        prev.map((c: any) =>
          c.id === editingCampaign.id ? { ...c, name: newName } : c,
        ),
      )
    }

    toast({
      title: "Nome da campanha atualizado",
      description: `Campanha renomeada para "${newName}".`,
    })
    handleCancelEditCampaignName()
  } catch (error) {
    console.error("Erro ao atualizar nome da campanha:", error)
    toast({
      title: "Erro",
      description: "Não foi possível atualizar o nome da campanha.",
      variant: "destructive",
    })
  } finally {
    setIsSavingCampaignName(false)
  }
}

  const handleStartEditCampaignBudget = (campaign: any) => {
    const currentBudget = campaign.budget != null ? Number(campaign.budget) : 0
    setEditingBudgetCampaign({ id: campaign.id, budget: campaign.budget ?? null })

    // transforma em string bonitinha em reais
    if (currentBudget > 0) {
      setEditingBudgetValue(currentBudget.toFixed(2).replace(".", ","))
    } else {
      setEditingBudgetValue("")
    }
  }

  const handleCancelEditCampaignBudget = () => {
    setEditingBudgetCampaign(null)
    setEditingBudgetValue("")
    setIsSavingBudget(false)
  }

  const handleSaveCampaignBudget = async () => {
    if (!editingBudgetCampaign) return

    const raw = editingBudgetValue.trim().replace("R$", "").replace(/\./g, "").replace(",", ".")
    const parsed = Number(raw)

    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um orçamento diário maior que zero.",
        variant: "destructive",
      })
      return
    }

    // valor em centavos, como o Facebook espera
    const dailyBudgetInCents = Math.round(parsed * 100)

    try {
      setIsSavingBudget(true)

      await updateFacebookCampaignBudget(editingBudgetCampaign.id, dailyBudgetInCents)

      // recarrega as campanhas pra refletir o novo orçamento
      if (selectedAccountId) {
        await fetchCampaigns(selectedAccountId)
      }

      toast({
        title: "Orçamento atualizado",
        description: `Novo orçamento diário: R$ ${parsed.toFixed(2).replace(".", ",")}`,
      })

      handleCancelEditCampaignBudget()
    } catch (error) {
      console.error("Erro ao atualizar orçamento da campanha:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o orçamento da campanha.",
        variant: "destructive",
      })
    } finally {
      setIsSavingBudget(false)
    }
  }



  const handleCampaignStatusChange = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
    try {
      await updateFacebookCampaignStatus(campaignId, newStatus)
      toast({
        title: "Status da Campanha Atualizado",
        description: `A campanha ${campaignId} foi ${newStatus === "ACTIVE" ? "ativada" : "pausada"}.`,
      })
      if (selectedAccountId) {
        fetchCampaigns(selectedAccountId) // Refresh campaigns for the current account
      }
    } catch (error) {
      console.error("Erro ao atualizar status da campanha:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da campanha.",
        variant: "destructive",
      })
    }
  }

  // Definição dos ícones com fallbacks
  const tabs = [
    {
      id: "facebook",
      name: "Meta ADS",
      icon: platformLogos.facebook,
      size: 24,
      fallbackIcon: <Facebook className="h-6 w-6 text-blue-600" />,
    },
    {
      id: "google",
      name: "Google ADS",
      icon: platformLogos.google,
      size: 24,
      fallbackIcon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.5 12.5c0-.69-.07-1.35-.2-2H12v4h6.02c-.26 1.3-1.04 2.4-2.22 3.14v2.61h3.59c2.1-1.93 3.31-4.78 3.31-7.75z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      ),
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: platformLogos.analytics,
      size: 24,
      fallbackIcon: <BarChart3 className="h-6 w-6 text-orange-500" />,
    },
    {
      id: "tiktok",
      name: "TikTok ADS",
      icon: platformLogos.tiktok,
      size: 24,
      fallbackIcon: <Music className="h-6 w-6 text-black" />,
    },
    {
      id: "kwai",
      name: "Kwai ADS",
      icon: platformLogos.kwai,
      size: 24,
      fallbackIcon: <Video className="h-6 w-6 text-orange-500" />,
    },
  ]

  // Função para lidar com erros de carregamento de imagem
  const handleImageError = (id: string) => {
    console.error(`Erro ao carregar a imagem para ${id}`)
    setImageErrors((prev) => ({
      ...prev,
      [id]: true,
    }))
  }

  const moneyBRL = (n?: number | null) =>
  `R$ ${Number(n ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`


  // Dados simulados para Meta Ads (valores zerados)
  const metaMetrics: AdMetric[] = [
    {
      id: "impressions",
      name: "Impressões",
      value: 0,
      change: 0,
      format: "number",
      icon: <Eye className="h-4 w-4" />,
    },
    {
      id: "clicks",
      name: "Cliques",
      value: 0,
      change: 0,
      format: "number",
      icon: <MousePointer className="h-4 w-4" />,
    },
    {
      id: "ctr",
      name: "CTR",
      value: 0,
      change: 0,
      format: "percent",
      icon: <Percent className="h-4 w-4" />,
    },
    {
      id: "cpc",
      name: "CPC",
      value: 0,
      change: 0,
      format: "currency",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      id: "spend",
      name: "Gasto",
      value: 0,
      change: 0,
      format: "currency",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      id: "conversions",
      name: "Conversões",
      value: 0,
      change: 0,
      format: "number",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      id: "cpa",
      name: "CPA",
      value: 0,
      change: 0,
      format: "currency",
      icon: <Target className="h-4 w-4" />,
    },
    {
      id: "roas",
      name: "ROAS",
      value: 0,
      change: 0,
      format: "number",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ]

  // Dados simulados para Google Ads (valores zerados)
  const googleMetrics: AdMetric[] = [
    {
      id: "impressions",
      name: "Impressões",
      value: 0,
      change: 0,
      format: "number",
      icon: <Eye className="h-4 w-4 text-red-500" />,
    },
    {
      id: "clicks",
      name: "Cliques",
      value: 0,
      change: 0,
      format: "number",
      icon: <MousePointer className="h-4 w-4 text-red-500" />,
    },
    {
      id: "ctr",
      name: "CTR",
      value: 0,
      change: 0,
      format: "percent",
      icon: <Percent className="h-4 w-4 text-red-500" />,
    },
    {
      id: "cpc",
      name: "CPC",
      value: 0,
      change: 0,
      format: "currency",
      icon: <DollarSign className="h-4 w-4 text-red-500" />,
    },
    {
      id: "spend",
      name: "Gasto",
      value: 0,
      change: 0,
      format: "currency",
      icon: <DollarSign className="h-4 w-4 text-red-500" />,
    },
    {
      id: "conversions",
      name: "Conversões",
      value: 0,
      change: 0,
      format: "number",
      icon: <ShoppingCart className="h-4 w-4 text-red-500" />,
    },
    {
      id: "quality",
      name: "Quality Score",
      value: 0,
      change: 0,
      format: "number",
      icon: <Star className="h-4 w-4 text-red-500" />,
    },
    {
      id: "position",
      name: "Posição Média",
      value: 0,
      change: 0,
      format: "number",
      icon: <Target className="h-4 w-4 text-red-500" />,
    },
  ]

  // Dados simulados para Analytics (valores zerados)
  const analyticsMetrics: AdMetric[] = [
    {
      id: "sessions",
      name: "Sessões",
      value: 0,
      change: 0,
      format: "number",
      icon: <Activity className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "users",
      name: "Usuários",
      value: 0,
      change: 0,
      format: "number",
      icon: <Users className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "pageviews",
      name: "Visualizações",
      value: 0,
      change: 0,
      format: "number",
      icon: <Eye className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "bounce",
      name: "Taxa de Rejeição",
      value: 0,
      change: 0,
      format: "percent",
      icon: <ExternalLink className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "avgtime",
      name: "Tempo Médio",
      value: 0,
      change: 0,
      format: "number",
      icon: <Clock className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "conversion",
      name: "Conversões",
      value: 0,
      change: 0,
      format: "number",
      icon: <Target className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "convrate",
      name: "Taxa de Conversão",
      value: 0,
      change: 0,
      format: "percent",
      icon: <Percent className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "revenue",
      name: "Receita",
      value: 0,
      change: 0,
      format: "currency",
      icon: <DollarSign className="h-4 w-4 text-orange-500" />,
    },
  ]

  // Dados simulados para TikTok Ads (valores zerados)
  const tiktokMetrics: AdMetric[] = [
    {
      id: "impressions",
      name: "Impressões",
      value: 0,
      change: 0,
      format: "number",
      icon: <Eye className="h-4 w-4 text-pink-500" />,
    },
    {
      id: "videoViews",
      name: "Visualizações",
      value: 0,
      change: 0,
      format: "number",
      icon: <Play className="h-4 w-4 text-pink-500" />,
    },
    {
      id: "clicks",
      name: "Cliques",
      value: 0,
      change: 0,
      format: "number",
      icon: <MousePointer className="h-4 w-4 text-pink-500" />,
    },
    {
      id: "ctr",
      name: "CTR",
      value: 0,
      change: 0,
      format: "percent",
      icon: <Percent className="h-4 w-4 text-pink-500" />,
    },
    {
      id: "engagement",
      name: "Engajamento",
      value: 0,
      change: 0,
      format: "number",
      icon: <Heart className="h-4 w-4 text-pink-500" />,
    },
    {
      id: "completionRate",
      name: "Taxa de Conclusão",
      value: 0,
      change: 0,
      format: "percent",
      icon: <Zap className="h-4 w-4 text-pink-500" />,
    },
    {
      id: "spend",
      name: "Gasto",
      value: 0,
      change: 0,
      format: "currency",
      icon: <DollarSign className="h-4 w-4 text-pink-500" />,
    },
    {
      id: "conversions",
      name: "Conversões",
      value: 0,
      change: 0,
      format: "number",
      icon: <ShoppingCart className="h-4 w-4 text-pink-500" />,
    },
  ]

  // Dados simulados para Kwai Ads (valores zerados)
  const kwaiMetrics: AdMetric[] = [
    {
      id: "impressions",
      name: "Impressões",
      value: 0,
      change: 0,
      format: "number",
      icon: <Eye className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "videoViews",
      name: "Visualizações",
      value: 0,
      change: 0,
      format: "number",
      icon: <Play className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "clicks",
      name: "Cliques",
      value: 0,
      change: 0,
      format: "number",
      icon: <MousePointer className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "ctr",
      name: "CTR",
      value: 0,
      change: 0,
      format: "percent",
      icon: <Percent className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "engagement",
      name: "Engajamento",
      value: 0,
      change: 0,
      format: "number",
      icon: <Heart className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "completionRate",
      name: "Taxa de Conclusão",
      value: 0,
      change: 0,
      format: "percent",
      icon: <Zap className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "spend",
      name: "Gasto",
      value: 0,
      change: 0,
      format: "currency",
      icon: <DollarSign className="h-4 w-4 text-orange-500" />,
    },
    {
      id: "conversions",
      name: "Conversões",
      value: 0,
      change: 0,
      format: "number",
      icon: <ShoppingCart className="h-4 w-4 text-orange-500" />,
    },
  ]

  // Dados de gráficos para cada plataforma (valores zerados)
  const metaChartData: ChartData[] = [
    { date: "01/05", impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, revenue: 0 },
    { date: "02/05", impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, revenue: 0 },
    { date: "03/05", impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, revenue: 0 },
    { date: "04/05", impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, revenue: 0 },
    { date: "05/05", impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, revenue: 0 },
    { date: "06/05", impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, revenue: 0 },
    { date: "07/05", impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, revenue: 0 },
  ]

  const googleChartData: ChartData[] = [
    { date: "01/05", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { date: "02/05", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { date: "03/05", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { date: "04/05", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { date: "05/05", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { date: "06/05", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { date: "07/05", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
  ]

  const analyticsChartData: ChartData[] = [
    { date: "01/05", sessions: 0, users: 0, pageviews: 0, conversions: 0, revenue: 0, bounceRate: 0 },
    { date: "02/05", sessions: 0, users: 0, pageviews: 0, conversions: 0, revenue: 0, bounceRate: 0 },
    { date: "03/05", sessions: 0, users: 0, pageviews: 0, conversions: 0, revenue: 0, bounceRate: 0 },
    { date: "04/05", sessions: 0, users: 0, pageviews: 0, conversions: 0, revenue: 0, bounceRate: 0 },
    { date: "05/05", sessions: 0, users: 0, pageviews: 0, conversions: 0, revenue: 0, bounceRate: 0 },
    { date: "06/05", sessions: 0, users: 0, pageviews: 0, conversions: 0, revenue: 0, bounceRate: 0 },
    { date: "07/05", sessions: 0, users: 0, pageviews: 0, conversions: 0, revenue: 0, bounceRate: 0 },
  ]

  const tiktokChartData: ChartData[] = [
    {
      date: "01/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
    },
    {
      date: "02/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
    },
    {
      date: "03/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
    },
    {
      date: "04/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
    },
    {
      date: "05/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
    },
    {
      date: "06/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
    },
    {
      date: "07/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
    },
  ]

  const kwaiChartData: ChartData[] = [
    {
      date: "01/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
      followers: 0,
    },
    {
      date: "02/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
      followers: 0,
    },
    {
      date: "03/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
      followers: 0,
    },
    {
      date: "04/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
      followers: 0,
    },
    {
      date: "05/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
      followers: 0,
    },
    {
      date: "06/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
      followers: 0,
    },
    {
      date: "07/05",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      videoViews: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      completionRate: 0,
      followers: 0,
    },
  ]

  // Dados adicionais para Meta Ads (valores zerados)
  const metaAdFormats = [
    { format: "Feed", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { format: "Stories", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { format: "Reels", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { format: "Marketplace", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
  ]

  const metaDemographics = [
    { age: "18-24", percentage: 0 },
    { age: "25-34", percentage: 0 },
    { age: "35-44", percentage: 0 },
    { age: "45-54", percentage: 0 },
    { age: "55+", percentage: 0 },
  ]

  const metaEngagementData = [
    { type: "Likes", value: 0 },
    { type: "Comentários", value: 0 },
    { type: "Compartilhamentos", value: 0 },
    { type: "Cliques no Link", value: 0 },
  ]

  const metaFunnelData = [
    { stage: "Impressões", value: 0 },
    { stage: "Alcance", value: 0 },
    { stage: "Engajamento", value: 0 },
    { stage: "Cliques", value: 0 },
    { stage: "Conversões", value: 0 },
  ]

  const metaDeviceData = [
    { device: "Mobile", percentage: 0 },
    { device: "Desktop", percentage: 0 },
    { device: "Tablet", percentage: 0 },
  ]

  const metaPlacementData = [
    { placement: "Facebook", value: 0 },
    { placement: "Instagram", value: 0 },
    { placement: "Audience Network", value: 0 },
  ]

  // Dados adicionais para Google Ads (valores zerados)
  const googleAdFormats = [
    { format: "Search", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { format: "Display", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { format: "Youtube", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    { format: "Shopping", impressions: 0, clicks: 0, conversions: 0, spend: 0 },
  ]

  const googleDemographics = [
    { age: "18-24", percentage: 0 },
    { age: "25-34", percentage: 0 },
    { age: "35-44", percentage: 0 },
    { age: "45-54", percentage: 0 },
    { age: "55+", percentage: 0 },
  ]

  const googleQualityScoreData = [
    { keyword: "melhores tênis corrida", score: 0 },
    { keyword: "tênis corrida promoção", score: 0 },
    { keyword: "tênis corrida barato", score: 0 },
    { keyword: "tênis corrida masculino", score: 0 },
    { keyword: "tênis corrida feminino", score: 0 },
  ]

  const googleDeviceData = [
    { device: "Mobile", percentage: 0 },
    { device: "Desktop", percentage: 0 },
    { device: "Tablet", percentage: 0 },
  ]

  const googleLocationData = [
    { location: "São Paulo", value: 0 },
    { location: "Rio de Janeiro", value: 0 },
    { location: "Belo Horizonte", value: 0 },
  ]

  // Dados adicionais para Analytics (valores zerados)
  const analyticsAudienceData = [
    { age: "18-24", percentage: 0 },
    { age: "25-34", percentage: 0 },
    { age: "35-44", percentage: 0 },
    { age: "45-54", percentage: 0 },
    { age: "55+", percentage: 0 },
  ]

  const analyticsTrafficSources = [
    { source: "Organic Search", sessions: 0 },
    { source: "Direct", sessions: 0 },
    { source: "Referral", sessions: 0 },
    { source: "Social", sessions: 0 },
    { source: "Email", sessions: 0 },
  ]

  const analyticsBounceRateData = [
    { page: "/home", rate: 0 },
    { page: "/products", rate: 0 },
    { page: "/blog", rate: 0 },
    { page: "/contact", rate: 0 },
    { page: "/about", rate: 0 },
  ]

  const analyticsConversionGoals = [
    { goal: "Contact Form", completions: 0 },
    { goal: "Newsletter Sign-up", completions: 0 },
    { goal: "Product Purchase", completions: 0 },
    { goal: "Account Creation", completions: 0 },
  ]

  const analyticsDeviceData = [
    { device: "Mobile", percentage: 0 },
    { device: "Desktop", percentage: 0 },
    { device: "Tablet", percentage: 0 },
  ]

  // Dados adicionais para TikTok Ads (valores zerados)
  const tiktokAdFormats = [
    { format: "In-Feed Ads", impressions: 0, clicks: 0, videoViews: 0, spend: 0 },
    { format: "TopView Ads", impressions: 0, clicks: 0, videoViews: 0, spend: 0 },
    { format: "Branded Hashtag Challenge", impressions: 0, clicks: 0, videoViews: 0, spend: 0 },
    { format: "Branded Effects", impressions: 0, clicks: 0, videoViews: 0, spend: 0 },
  ]

  const tiktokDemographics = [
    { age: "13-17", percentage: 0 },
    { age: "18-24", percentage: 0 },
    { age: "25-34", percentage: 0 },
    { age: "35-44", percentage: 0 },
    { age: "45+", percentage: 0 },
  ]

  const tiktokEngagementData = [
    { type: "Likes", value: 0 },
    { type: "Comentários", value: 0 },
    { type: "Compartilhamentos", value: 0 },
    { type: "Cliques no Perfil", value: 0 },
  ]

  const tiktokTopVideos = [
    { video: "Vídeo #1", views: 0 },
    { video: "Vídeo #2", views: 0 },
    { video: "Vídeo #3", views: 0 },
    { video: "Vídeo #4", views: 0 },
    { video: "Vídeo #5", views: 0 },
  ]

  const tiktokDeviceData = [
    { device: "Mobile", percentage: 0 },
    { device: "Tablet", percentage: 0 },
    { device: "Other", percentage: 0 },
  ]

  // Dados adicionais para Kwai Ads (valores zerados)
  const kwaiAdFormats = [
    { format: "In-Feed Ads", impressions: 0, clicks: 0, videoViews: 0, spend: 0 },
    { format: "TopView Ads", impressions: 0, clicks: 0, videoViews: 0, spend: 0 },
    { format: "Promoted Hashtag", impressions: 0, clicks: 0, videoViews: 0, spend: 0 },
    { format: "Challenges", impressions: 0, clicks: 0, videoViews: 0, spend: 0 },
  ]

  const kwaiDemographics = [
    { age: "13-17", percentage: 0 },
    { age: "18-24", percentage: 0 },
    { age: "25-34", percentage: 0 },
    { age: "35-44", percentage: 0 },
    { age: "45+", percentage: 0 },
  ]

  const kwaiEngagementData = [
    { type: "Likes", value: 0 },
    { type: "Comentários", value: 0 },
    { type: "Compartilhamentos", value: 0 },
    { type: "Cliques no Perfil", value: 0 },
  ]

  const kwaiTopVideos = [
    { video: "Vídeo Kwai #1", views: 0 },
    { video: "Vídeo Kwai #2", views: 0 },
    { video: "Vídeo Kwai #3", views: 0 },
    { video: "Vídeo Kwai #4", views: 0 },
    { video: "Vídeo Kwai #5", views: 0 },
  ]

  const kwaiDeviceData = [
    { device: "Mobile", percentage: 0 },
    { device: "Other", percentage: 0 },
  ]

  // Função segura para usar toFixed em valores que podem ser undefined
  const safeToFixed = (value: number | undefined, digits = 2): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.00"
    }
    return value.toFixed(digits)
  }

  // Função para formatar valores de acordo com o tipo
  const formatValue = (value: number, format: AdMetric["format"]): string => {
    switch (format) {
      case "currency":
        return `R$ ${safeToFixed(value).replace(".", ",")}`
      case "percent":
        return `${safeToFixed(value).replace(".", ",")} %`
      default:
        return value.toLocaleString("pt-BR")
    }
  }

  // Função para renderizar o indicador de mudança
  const renderChangeIndicator = (change: number) => {
    const isPositive = change >= 0
    return (
      <div className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
        {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    )
  }

  // Função para renderizar os cartões de métricas
  const renderMetricCards = (metrics: AdMetric[]) => {
    // Se não houver métricas, exibe uma mensagem
    if (metrics.length === 0) {
      return (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Nenhum dado de métrica disponível.</p>
        </div>
      )
    }

    // A lógica de renderização dos cartões permanece a mesma, mas com valores zerados
    // e cores baseadas na plataforma ativa.
    const getCardColors = (metricId: string, change: number) => {
      let iconColor = ""
      let borderColor = ""
      let glowColor = ""

      switch (activeTab) {
        case "facebook":
          if (metricId === "impressions") {
            iconColor = "text-purple-400"
            borderColor = "border-purple-500"
            glowColor = "shadow-purple-500/30"
          } else if (metricId === "clicks") {
            iconColor = "text-blue-400"
            borderColor = "border-blue-500"
            glowColor = "shadow-blue-500/30"
          } else if (metricId === "conversions") {
            iconColor = "text-indigo-400"
            borderColor = "border-indigo-500"
            glowColor = "shadow-indigo-500/30"
          } else if (metricId === "roas") {
            iconColor = "text-cyan-400"
            borderColor = "border-cyan-500"
            glowColor = "shadow-cyan-500/30"
          } else if (change >= 0) {
            iconColor = "text-emerald-400"
            borderColor = "border-emerald-500"
            glowColor = "shadow-emerald-500/30"
          } else {
            iconColor = "text-rose-400"
            borderColor = "border-rose-500"
            glowColor = "shadow-rose-500/30"
          }
          break
        case "google":
          if (metricId === "impressions") {
            iconColor = "text-red-400"
            borderColor = "border-red-500"
            glowColor = "shadow-red-500/30"
          } else if (metricId === "clicks") {
            iconColor = "text-blue-400"
            borderColor = "border-blue-500"
            glowColor = "shadow-blue-500/30"
          } else if (metricId === "conversions") {
            iconColor = "text-green-400"
            borderColor = "border-green-500"
            glowColor = "shadow-green-500/30"
          } else if (metricId === "quality") {
            iconColor = "text-yellow-400"
            borderColor = "border-yellow-500"
            glowColor = "shadow-yellow-500/30"
          } else if (change >= 0) {
            iconColor = "text-emerald-400"
            borderColor = "border-emerald-500"
            glowColor = "shadow-emerald-500/30"
          } else {
            iconColor = "text-rose-400"
            borderColor = "border-rose-500"
            glowColor = "shadow-rose-500/30"
          }
          break
        case "analytics":
          if (metricId === "sessions") {
            iconColor = "text-orange-400"
            borderColor = "border-orange-500"
            glowColor = "shadow-orange-500/30"
          } else if (metricId === "users") {
            iconColor = "text-amber-400"
            borderColor = "border-amber-500"
            glowColor = "shadow-amber-500/30"
          } else if (metricId === "conversion" || metricId === "revenue") {
            iconColor = "text-yellow-400"
            borderColor = "border-yellow-500"
            glowColor = "shadow-yellow-500/30"
          } else if (change >= 0) {
            iconColor = "text-emerald-400"
            borderColor = "border-emerald-500"
            glowColor = "shadow-emerald-500/30"
          } else {
            iconColor = "text-rose-400"
            borderColor = "border-rose-500"
            glowColor = "shadow-rose-500/30"
          }
          break
        case "tiktok":
          if (metricId === "impressions") {
            iconColor = "text-pink-400"
            borderColor = "border-pink-500"
            glowColor = "shadow-pink-500/30"
          } else if (metricId === "clicks") {
            iconColor = "text-purple-400"
            borderColor = "border-purple-500"
            glowColor = "shadow-purple-500/30"
          } else if (metricId === "conversions" || metricId === "videoViews") {
            iconColor = "text-fuchsia-400"
            borderColor = "border-fuchsia-500"
            glowColor = "shadow-fuchsia-500/30"
          } else if (metricId === "engagement" || metricId === "completionRate") {
            iconColor = "text-rose-400"
            borderColor = "border-rose-500"
            glowColor = "shadow-rose-500/30"
          } else if (change >= 0) {
            iconColor = "text-emerald-400"
            borderColor = "border-emerald-500"
            glowColor = "shadow-emerald-500/30"
          } else {
            iconColor = "text-red-400"
            borderColor = "border-red-500"
            glowColor = "shadow-red-500/30"
          }
          break
        case "kwai":
          if (metricId === "impressions") {
            iconColor = "text-orange-400"
            borderColor = "border-orange-500"
            glowColor = "shadow-orange-500/30"
          } else if (metricId === "clicks") {
            iconColor = "text-amber-400"
            borderColor = "border-amber-500"
            glowColor = "shadow-amber-500/30"
          } else if (metricId === "conversions" || metricId === "videoViews") {
            iconColor = "text-yellow-400"
            borderColor = "border-yellow-500"
            glowColor = "shadow-yellow-500/30"
          } else if (metricId === "engagement" || metricId === "completionRate") {
            iconColor = "text-red-400"
            borderColor = "border-red-500"
            glowColor = "shadow-red-500/30"
          } else if (change >= 0) {
            iconColor = "text-emerald-400"
            borderColor = "border-emerald-500"
            glowColor = "shadow-emerald-500/30"
          } else {
            iconColor = "text-rose-400"
            borderColor = "border-rose-500"
            glowColor = "shadow-rose-500/30"
          }
          break
      }

      return { iconColor, borderColor, glowColor }
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const { iconColor, borderColor, glowColor } = getCardColors(metric.id, metric.change)
          return (
            <Card
              key={metric.id}
              className={`overflow-hidden border border-t-0 border-l-0 border-r-0 border-b-2 ${borderColor} bg-black shadow-lg ${glowColor} hover:shadow-xl transition-all duration-300`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-white">
                  <div className="flex items-center">
                    <div className={`p-1.5 rounded-full bg-black/40 ${iconColor}`}>{metric.icon}</div>
                    <span className="ml-2">{metric.name}</span>
                  </div>
                </CardTitle>
                <div
                  className={`px-2 py-1 rounded-full ${
                    metric.change >= 0 ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                  } text-xs font-medium flex items-center`}
                >
                  {metric.change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  <span>{Math.abs(metric.change).toFixed(1)}%</span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="text-2xl font-bold text-white flex items-baseline">
                  {formatValue(metric.value, metric.format)}
                  <div className={`ml-2 h-1 w-1 rounded-full ${iconColor} animate-pulse`}></div>
                </div>
                <CardDescription className="text-xs text-white/70 mt-1">
                  {metric.id === "impressions" && "Total no período"}
                  {metric.id === "clicks" && "Total de interações"}
                  {metric.id === "ctr" && "Taxa de cliques"}
                  {metric.id === "cpc" && "Custo por clique"}
                  {metric.id === "spend" && "Investimento total"}
                  {metric.id === "conversions" && "Vendas realizadas"}
                  {metric.id === "cpa" && "Custo por aquisição"}
                  {metric.id === "roas" && "Retorno sobre investimento"}
                  {metric.id === "quality" && "Média das campanhas"}
                  {metric.id === "position" && "Posição média dos anúncios"}
                  {metric.id === "sessions" && "Total de visitas"}
                  {metric.id === "users" && "Visitantes únicos"}
                  {metric.id === "pageviews" && "Total de páginas vistas"}
                  {metric.id === "bounce" && "Saídas sem interação"}
                  {metric.id === "avgtime" && "Minutos por sessão"}
                  {metric.id === "conversion" && "Objetivos concluídos"}
                  {metric.id === "convrate" && "Conversões por sessão"}
                  {metric.id === "revenue" && "Valor gerado"}
                  {metric.id === "videoViews" && "Total de visualizações"}
                  {metric.id === "engagement" && "Likes, shares e comentários"}
                  {metric.id === "completionRate" && "Vídeos assistidos até o fim"}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Função para renderizar os gráficos
  const renderCharts = (data: ChartData[], platform: AdPlatform) => {
    // Definir cores com base na plataforma
    const getColors = () => {
      switch (platform) {
        case "facebook":
          return ["#A78BFA", "#60A5FA", "#818CF8", "#7DD3FC", "#8B5CF6"]
        case "google":
          return ["#EA4335", "#FBBC05", "#34A853", "#4285F4"]
        case "analytics":
          return ["#F9AB00", "#E37400", "#FF6D00", "#FF9E01", "#FFA700"]
        case "tiktok":
          return ["#FE2C55", "#25F4EE", "#000000", "#69C9D0", "#EE1D52"]
        case "kwai":
          return ["#FF5000", "#FF7E00", "#FF3300", "#FF9248", "#FFB280"]
        default:
          return ["#4F46E5", "#0EA5E9", "#10B981"]
      }
    }

    const colors = getColors()

    if (platform === "facebook") {
      return (
        <div className="space-y-6">
          {/* Primeira linha de gráficos para Meta Ads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <LineChartIcon className="h-5 w-5 mr-2 text-purple-400" />
                    Desempenho ao Longo do Tempo
                  </CardTitle>
                  <CardDescription className="text-purple-300">Impressões, cliques e conversões</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <div className="absolute top-12 right-12 flex space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-400 mr-1"></div>
                    <span className="text-xs text-purple-300">Impressões</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
                    <span className="text-xs text-blue-300">Cliques</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-400 mr-1"></div>
                    <span className="text-xs text-indigo-300">Conversões</span>
                  </div>
                </div>
                <LineChart
                  data={data}
                  index="date"
                  categories={["impressions", "clicks", "conversions"]}
                  colors={["#A78BFA", "#60A5FA", "#818CF8"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-blue-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <BarChart2 className="h-5 w-5 mr-2 text-blue-400" />
                      Desempenho por Formato
                    </CardTitle>
                    <CardDescription className="text-blue-300">Métricas por tipo de anúncio</CardDescription>
                  </div>
                  <Select defaultValue="clicks" className="w-32 sm:w-32">
                    <SelectTrigger className="h-8 text-xs bg-black border border-blue-500/30 text-white">
                      <SelectValue placeholder="Métrica" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-blue-500/30">
                      <SelectItem value="clicks">Cliques</SelectItem>
                      <SelectItem value="impressions">Impressões</SelectItem>
                      <SelectItem value="conversions">Conversões</SelectItem>
                      <SelectItem value="spend">Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <BarChart
                  data={metaAdFormats}
                  index="format"
                  categories={["clicks", "conversions"]}
                  colors={["#60A5FA", "#818CF8"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de gráficos para Meta Ads */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-indigo-500/10 overflow-hidden lg:col-span-2">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <DollarSign className="h-5 w-5 mr-2 text-indigo-400" />
                      Gastos e Resultados
                    </CardTitle>
                    <CardDescription className="text-indigo-300">Investimento e conversões</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="h-8 px-3 py-1.5 text-xs bg-black border border-blue-500/30 text-white hover:bg-blue-950"
                  >
                    <Download className="h-4 w-4 mr-1 text-blue-300" /> Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4 relative">
                <BarChart
                  data={data}
                  index="date"
                  categories={["spend"]}
                  colors={["#60A5FA"]}
                  valueFormatter={(value) => `R$ ${safeToFixed(value)}`}
                  className="h-full"
                />
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm p-3 rounded-md shadow-lg border border-indigo-500/20">
                  <div className="text-sm font-medium text-indigo-300">CPA Médio</div>
                  <div className="text-2xl font-bold text-white">R$ {safeToFixed(0).replace(".", ",")}</div>
                  <div className="text-sm text-emerald-400 flex items-center mt-1">
                    <ArrowDown className="h-3 w-3 mr-1" /> 0.0% vs. período anterior
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Users className="h-5 w-5 mr-2 text-purple-400" />
                  Demografia
                </CardTitle>
                <CardDescription className="text-purple-300">Distribuição por idade</CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <DonutChart
                  data={metaDemographics}
                  index="age"
                  category="percentage"
                  colors={["#A78BFA", "#60A5FA", "#818CF8", "#7DD3FC", "#8B5CF6"]}
                  valueFormatter={(value) => `${value}%`}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha de gráficos para Meta Ads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-blue-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Award className="h-5 w-5 mr-2 text-blue-400" />
                  Tipos de Engajamento
                </CardTitle>
                <CardDescription className="text-blue-300">Distribuição por tipo de interação</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <DonutChart
                  data={metaEngagementData}
                  index="type"
                  category="value"
                  colors={["#A78BFA", "#60A5FA", "#818CF8", "#7DD3FC"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
                  Distribuição por Dispositivo
                </CardTitle>
                <CardDescription className="text-purple-300">Tráfego por tipo de dispositivo</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                      {metaDeviceData.map((item) => (
                        <div
                          key={item.device}
                          className="flex flex-col items-center justify-center p-4 rounded-lg border border-purple-500/20 bg-black relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent"></div>
                          <div className="relative z-10">
                            {item.device === "Mobile" ? (
                              <Smartphone className="h-8 w-8 mb-2 text-purple-400" />
                            ) : item.device === "Desktop" ? (
                              <Monitor className="h-8 w-8 mb-2 text-blue-400" />
                            ) : (
                              <Tablet className="h-8 w-8 mb-2 text-red-400" />
                            )}
                            <div className="text-2xl font-bold text-white">{item.percentage}%</div>
                            <div className="text-xs text-white/70">{item.device}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-1/3 mt-4">
                    <div className="w-full bg-gray-900 rounded-full h-6 overflow-hidden flex">
                      {metaDeviceData.map((item) => (
                        <div
                          key={item.device}
                          className="h-full flex items-center justify-center text-xs font-medium text-white"
                          style={{
                            width: `${item.percentage}%`,
                            background:
                              item.device === "Mobile"
                                ? "linear-gradient(90deg, #A78BFA 0%, #8B5CF6 100%)"
                                : item.device === "Desktop"
                                  ? "linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)"
                                  : "linear-gradient(90deg, #EA4335 0%, #D32F2F 100%)",
                          }}
                        >
                          {item.device === "Mobile" ? (
                            <Smartphone className="h-3 w-3 mr-1" />
                          ) : item.device === "Desktop" ? (
                            <Monitor className="h-3 w-3 mr-1" />
                          ) : (
                            <Tablet className="h-3 w-3 mr-1" />
                          )}{" "}
                          {item.percentage}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quarta linha de gráficos para Meta Ads */}
          <Card className="border-0 bg-black shadow-lg shadow-indigo-500/10 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <Globe className="h-5 w-5 mr-2 text-indigo-400" />
                    Funil de Conversão
                  </CardTitle>
                  <CardDescription className="text-indigo-300">Etapas do funil de anúncios</CardDescription>
                </div>
                <Select defaultValue="value" className="w-32 sm:w-32">
                  <SelectTrigger className="h-8 text-xs bg-black border border-indigo-500/30 text-white">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-indigo-500/30">
                    <SelectItem value="value">Valor</SelectItem>
                    <SelectItem value="stage">Etapa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-72 overflow-auto pt-4">
              <div className="w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 font-medium text-sm text-indigo-300">Etapa</th>
                      <th className="text-right py-2 font-medium text-sm text-indigo-300">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metaFunnelData.map((item) => (
                      <TableRow key={item.stage} className="hover:bg-indigo-900/30 transition-colors duration-200">
                        <TableCell className="py-2 text-sm text-white">{item.stage}</TableCell>
                        <TableCell className="py-2 text-right text-sm text-white">
                          {item.value.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <Globe className="h-5 w-5 mr-2 text-purple-400" />
                    Distribuição por Posicionamento
                  </CardTitle>
                  <CardDescription className="text-purple-300">Impressões por posicionamento</CardDescription>
                </div>
                <Select defaultValue="value" className="w-32 sm:w-32">
                  <SelectTrigger className="h-8 text-xs bg-black border border-purple-500/30 text-white">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-purple-500/30">
                    <SelectItem value="value">Valor</SelectItem>
                    <SelectItem value="placement">Posicionamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-72 overflow-auto pt-4">
              <div className="w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 font-medium text-sm text-purple-300">Posicionamento</th>
                      <th className="text-right py-2 font-medium text-sm text-purple-300">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metaPlacementData.map((item) => (
                      <TableRow key={item.placement} className="hover:bg-purple-900/30 transition-colors duration-200">
                        <TableCell className="py-2 text-sm text-white">{item.placement}</TableCell>
                        <TableCell className="py-2 text-right text-sm text-white">
                          {item.value.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (platform === "google") {
      return (
        <div className="space-y-6">
          {/* Primeira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-red-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <LineChartIcon className="h-5 w-5 mr-2 text-red-400" />
                    Desempenho ao Longo do Tempo
                  </CardTitle>
                  <CardDescription className="text-red-300">Impressões, cliques e conversões</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <div className="absolute top-12 right-12 flex space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-400 mr-1"></div>
                    <span className="text-xs text-red-300">Impressões</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
                    <span className="text-xs text-blue-300">Cliques</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
                    <span className="text-xs text-green-300">Conversões</span>
                  </div>
                </div>
                <LineChart
                  data={data}
                  index="date"
                  categories={["impressions", "clicks", "conversions"]}
                  colors={["#EA4335", "#4285F4", "#34A853"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-blue-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <BarChart2 className="h-5 w-5 mr-2 text-blue-400" />
                      Desempenho por Formato
                    </CardTitle>
                    <CardDescription className="text-blue-300">Métricas por tipo de anúncio</CardDescription>
                  </div>
                  <Select defaultValue="clicks" className="w-32 sm:w-32">
                    <SelectTrigger className="h-8 text-xs bg-black border border-blue-500/30 text-white">
                      <SelectValue placeholder="Métrica" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-blue-500/30">
                      <SelectItem value="clicks">Cliques</SelectItem>
                      <SelectItem value="impressions">Impressões</SelectItem>
                      <SelectItem value="conversions">Conversões</SelectItem>
                      <SelectItem value="spend">Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <BarChart
                  data={googleAdFormats}
                  index="format"
                  categories={["clicks", "conversions"]}
                  colors={["#4285F4", "#34A853"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-indigo-500/10 overflow-hidden lg:col-span-2">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <DollarSign className="h-5 w-5 mr-2 text-indigo-400" />
                      Gastos e Resultados
                    </CardTitle>
                    <CardDescription className="text-indigo-300">Investimento e conversões</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="h-8 px-3 py-1.5 text-xs bg-black border border-blue-500/30 text-white hover:bg-blue-950"
                  >
                    <Download className="h-4 w-4 mr-1 text-blue-300" /> Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4 relative">
                <BarChart
                  data={data}
                  index="date"
                  categories={["spend"]}
                  colors={["#4285F4"]}
                  valueFormatter={(value) => `R$ ${safeToFixed(value)}`}
                  className="h-full"
                />
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm p-3 rounded-md shadow-lg border border-indigo-500/20">
                  <div className="text-sm font-medium text-indigo-300">CPA Médio</div>
                  <div className="text-2xl font-bold text-white">R$ {safeToFixed(0).replace(".", ",")}</div>
                  <div className="text-sm text-emerald-400 flex items-center mt-1">
                    <ArrowDown className="h-3 w-3 mr-1" /> 0.0% vs. período anterior
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Users className="h-5 w-5 mr-2 text-purple-400" />
                  Demografia
                </CardTitle>
                <CardDescription className="text-purple-300">Distribuição por idade</CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <DonutChart
                  data={googleDemographics}
                  index="age"
                  category="percentage"
                  colors={["#EA4335", "#FBBC05", "#34A853", "#4285F4", "#A78BFA"]}
                  valueFormatter={(value) => `${value}%`}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-blue-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Award className="h-5 w-5 mr-2 text-blue-400" />
                  Índice de Qualidade
                </CardTitle>
                <CardDescription className="text-blue-300">Média por palavra-chave</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <BarChart
                  data={googleQualityScoreData}
                  index="keyword"
                  categories={["score"]}
                  colors={["#4285F4"]}
                  valueFormatter={(value) => safeToFixed(value, 1)}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
                  Distribuição por Dispositivo
                </CardTitle>
                <CardDescription className="text-purple-300">Tráfego por tipo de dispositivo</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                      {googleDeviceData.map((item) => (
                        <div
                          key={item.device}
                          className="flex flex-col items-center justify-center p-4 rounded-lg border border-purple-500/20 bg-black relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent"></div>
                          <div className="relative z-10">
                            {item.device === "Mobile" ? (
                              <Smartphone className="h-8 w-8 mb-2 text-purple-400" />
                            ) : item.device === "Desktop" ? (
                              <Monitor className="h-8 w-8 mb-2 text-blue-400" />
                            ) : (
                              <Tablet className="h-8 w-8 mb-2 text-red-400" />
                            )}
                            <div className="text-2xl font-bold text-white">{item.percentage}%</div>
                            <div className="text-xs text-white/70">{item.device}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-1/3 mt-4">
                    <div className="w-full bg-gray-900 rounded-full h-6 overflow-hidden flex">
                      {googleDeviceData.map((item) => (
                        <div
                          key={item.device}
                          className="h-full flex items-center justify-center text-xs font-medium text-white"
                          style={{
                            width: `${item.percentage}%`,
                            background:
                              item.device === "Mobile"
                                ? "linear-gradient(90deg, #A78BFA 0%, #8B5CF6 100%)"
                                : item.device === "Desktop"
                                  ? "linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)"
                                  : "linear-gradient(90deg, #EA4335 0%, #D32F2F 100%)",
                          }}
                        >
                          {item.device === "Mobile" ? (
                            <Smartphone className="h-3 w-3 mr-1" />
                          ) : item.device === "Desktop" ? (
                            <Monitor className="h-3 w-3 mr-1" />
                          ) : (
                            <Tablet className="h-3 w-3 mr-1" />
                          )}{" "}
                          {item.percentage}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quarta linha - Tabela de campanhas */}
          <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <Globe className="h-5 w-5 mr-2 text-purple-400" />
                    Distribuição Geográfica
                  </CardTitle>
                  <CardDescription className="text-purple-300">Impressões por local</CardDescription>
                </div>
                <Select defaultValue="impressions" className="w-32 sm:w-32">
                  <SelectTrigger className="h-8 text-xs bg-black border border-purple-500/30 text-white">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-purple-500/30">
                    <SelectItem value="impressions">Impressões</SelectItem>
                    <SelectItem value="clicks">Cliques</SelectItem>
                    <SelectItem value="conversions">Conversões</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-72 overflow-auto pt-4">
              <div className="w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 font-medium text-sm text-purple-300">Local</th>
                      <th className="text-right py-2 font-medium text-sm text-purple-300">Impressões</th>
                      <th className="text-right py-2 font-medium text-sm text-purple-300">Cliques</th>
                      <th className="text-right py-2 font-medium text-sm text-purple-300">Conversões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { location: "São Paulo", impressions: 0, clicks: 0, conversions: 0 },
                      { location: "Rio de Janeiro", impressions: 0, clicks: 0, conversions: 0 },
                      { location: "Belo Horizonte", impressions: 0, clicks: 0, conversions: 0 },
                      { location: "Porto Alegre", impressions: 0, clicks: 0, conversions: 0 },
                      { location: "Curitiba", impressions: 0, clicks: 0, conversions: 0 },
                    ].map((location) => (
                      <TableRow
                        key={location.location}
                        className="hover:bg-purple-900/30 transition-colors duration-200"
                      >
                        <TableCell className="py-2 text-sm text-white">{location.location}</TableCell>
                        <TableCell className="py-2 text-right text-sm text-white">{location.impressions}</TableCell>
                        <TableCell className="py-2 text-right text-sm text-white">{location.clicks}</TableCell>
                        <TableCell className="py-2 text-right text-sm text-white">{location.conversions}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (platform === "analytics") {
      return (
        <div className="space-y-6">
          {/* Primeira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-orange-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <LineChartIcon className="h-5 w-5 mr-2 text-orange-400" />
                    Sessões ao Longo do Tempo
                  </CardTitle>
                  <CardDescription className="text-orange-300">Total de visitas por dia</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <div className="absolute top-12 right-12 flex space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-400 mr-1"></div>
                    <span className="text-xs text-orange-300">Sessões</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-400 mr-1"></div>
                    <span className="text-xs text-amber-300">Usuários</span>
                  </div>
                </div>
                <LineChart
                  data={data}
                  index="date"
                  categories={["sessions", "users"]}
                  colors={["#F9AB00", "#E37400"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-blue-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <BarChart2 className="h-5 w-5 mr-2 text-blue-400" />
                      Fontes de Tráfego
                    </CardTitle>
                    <CardDescription className="text-blue-300">Sessões por origem</CardDescription>
                  </div>
                  <Select defaultValue="sessions" className="w-32 sm:w-32">
                    <SelectTrigger className="h-8 text-xs bg-black border border-blue-500/30 text-white">
                      <SelectValue placeholder="Métrica" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-blue-500/30">
                      <SelectItem value="sessions">Sessões</SelectItem>
                      <SelectItem value="users">Usuários</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <BarChart
                  data={analyticsTrafficSources}
                  index="source"
                  categories={["sessions"]}
                  colors={["#4285F4"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-indigo-500/10 overflow-hidden lg:col-span-2">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <DollarSign className="h-5 w-5 mr-2 text-indigo-400" />
                      Receita e Conversões
                    </CardTitle>
                    <CardDescription className="text-indigo-300">Valor gerado e objetivos</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="h-8 px-3 py-1.5 text-xs bg-black border border-blue-500/30 text-white hover:bg-blue-950"
                  >
                    <Download className="h-4 w-4 mr-1 text-blue-300" /> Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4 relative">
                <BarChart
                  data={data}
                  index="date"
                  categories={["revenue"]}
                  colors={["#4285F4"]}
                  valueFormatter={(value) => `R$ ${safeToFixed(value)}`}
                  className="h-full"
                />
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm p-3 rounded-md shadow-lg border border-indigo-500/20">
                  <div className="text-sm font-medium text-indigo-300">Receita Total</div>
                  <div className="text-2xl font-bold text-white">R$ {safeToFixed(0).replace(".", ",")}</div>
                  <div className="text-sm text-emerald-400 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" /> 0.0% vs. período anterior
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Users className="h-5 w-5 mr-2 text-purple-400" />
                  Demografia
                </CardTitle>
                <CardDescription className="text-purple-300">Distribuição por idade</CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <DonutChart
                  data={analyticsAudienceData}
                  index="age"
                  category="percentage"
                  colors={["#EA4335", "#FBBC05", "#34A853", "#4285F4", "#A78BFA"]}
                  valueFormatter={(value) => `${value}%`}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-blue-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Award className="h-5 w-5 mr-2 text-blue-400" />
                  Taxa de Rejeição
                </CardTitle>
                <CardDescription className="text-blue-300">Por página</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <BarChart
                  data={analyticsBounceRateData}
                  index="page"
                  categories={["rate"]}
                  colors={["#4285F4"]}
                  valueFormatter={(value) => `${safeToFixed(value, 1)}%`}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
                  Distribuição por Dispositivo
                </CardTitle>
                <CardDescription className="text-purple-300">Tráfego por tipo de dispositivo</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                      {analyticsDeviceData.map((item) => (
                        <div
                          key={item.device}
                          className="flex flex-col items-center justify-center p-4 rounded-lg border border-purple-500/20 bg-black relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent"></div>
                          <div className="relative z-10">
                            {item.device === "Mobile" ? (
                              <Smartphone className="h-8 w-8 mb-2 text-purple-400" />
                            ) : item.device === "Desktop" ? (
                              <Monitor className="h-8 w-8 mb-2 text-blue-400" />
                            ) : (
                              <Tablet className="h-8 w-8 mb-2 text-red-400" />
                            )}
                            <div className="text-2xl font-bold text-white">{item.percentage}%</div>
                            <div className="text-xs text-white/70">{item.device}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-1/3 mt-4">
                    <div className="w-full bg-gray-900 rounded-full h-6 overflow-hidden flex">
                      {analyticsDeviceData.map((item) => (
                        <div
                          key={item.device}
                          className="h-full flex items-center justify-center text-xs font-medium text-white"
                          style={{
                            width: `${item.percentage}%`,
                            background:
                              item.device === "Mobile"
                                ? "linear-gradient(90deg, #A78BFA 0%, #8B5CF6 100%)"
                                : item.device === "Desktop"
                                  ? "linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)"
                                  : "linear-gradient(90deg, #EA4335 0%, #D32F2F 100%)",
                          }}
                        >
                          {item.device === "Mobile" ? (
                            <Smartphone className="h-3 w-3 mr-1" />
                          ) : item.device === "Desktop" ? (
                            <Monitor className="h-3 w-3 mr-1" />
                          ) : (
                            <Tablet className="h-3 w-3 mr-1" />
                          )}{" "}
                          {item.percentage}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quarta linha - Tabela de campanhas */}
          <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <Globe className="h-5 w-5 mr-2 text-purple-400" />
                    Objetivos Concluídos
                  </CardTitle>
                  <CardDescription className="text-purple-300">Por tipo de objetivo</CardDescription>
                </div>
                <Select defaultValue="completions" className="w-32 sm:w-32">
                  <SelectTrigger className="h-8 text-xs bg-black border border-purple-500/30 text-white">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-purple-500/30">
                    <SelectItem value="completions">Conclusões</SelectItem>
                    <SelectItem value="goal">Objetivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-72 overflow-auto pt-4">
              <div className="w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 font-medium text-sm text-purple-300">Objetivo</th>
                      <th className="text-right py-2 font-medium text-sm text-purple-300">Conclusões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { goal: "Formulário de Contato", completions: 0 },
                      { goal: "Inscrição na Newsletter", completions: 0 },
                      { goal: "Compra de Produto", completions: 0 },
                      { goal: "Criação de Conta", completions: 0 },
                    ].map((item) => (
                      <TableRow key={item.goal} className="hover:bg-purple-900/30 transition-colors duration-200">
                        <TableCell className="py-2 text-sm text-white">{item.goal}</TableCell>
                        <TableCell className="py-2 text-right text-sm text-white">{item.completions}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (platform === "tiktok") {
      return (
        <div className="space-y-6">
          {/* Primeira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-pink-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <LineChartIcon className="h-5 w-5 mr-2 text-pink-400" />
                    Desempenho ao Longo do Tempo
                  </CardTitle>
                  <CardDescription className="text-pink-300">Impressões, visualizações e cliques</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <div className="absolute top-12 right-12 flex space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-pink-400 mr-1"></div>
                    <span className="text-xs text-pink-300">Impressões</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-400 mr-1"></div>
                    <span className="text-xs text-purple-300">Visualizações</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-fuchsia-400 mr-1"></div>
                    <span className="text-xs text-fuchsia-300">Cliques</span>
                  </div>
                </div>
                <LineChart
                  data={data}
                  index="date"
                  categories={["impressions", "videoViews", "clicks"]}
                  colors={["#FE2C55", "#E4405F", "#D81A60"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-blue-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <BarChart2 className="h-5 w-5 mr-2 text-purple-400" />
                      Desempenho por Formato
                    </CardTitle>
                    <CardDescription className="text-purple-300">Métricas por tipo de anúncio</CardDescription>
                  </div>
                  <Select defaultValue="clicks" className="w-32 sm:w-32">
                    <SelectTrigger className="h-8 text-xs bg-black border border-purple-500/30 text-white">
                      <SelectValue placeholder="Métrica" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-purple-500/30">
                      <SelectItem value="clicks">Cliques</SelectItem>
                      <SelectItem value="impressions">Impressões</SelectItem>
                      <SelectItem value="videoViews">Visualizações</SelectItem>
                      <SelectItem value="spend">Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <BarChart
                  data={tiktokAdFormats}
                  index="format"
                  categories={["clicks", "videoViews"]}
                  colors={["#D81A60", "#E4405F"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-fuchsia-500/10 overflow-hidden lg:col-span-2">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <DollarSign className="h-5 w-5 mr-2 text-fuchsia-400" />
                      Gastos e Resultados
                    </CardTitle>
                    <CardDescription className="text-fuchsia-300">Investimento e conversões</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="h-8 px-3 py-1.5 text-xs bg-black border border-fuchsia-500/30 text-white hover:bg-fuchsia-950"
                  >
                    <Download className="h-4 w-4 mr-1 text-fuchsia-300" /> Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4 relative">
                <BarChart
                  data={data}
                  index="date"
                  categories={["spend"]}
                  colors={["#E4405F"]}
                  valueFormatter={(value) => `R$ ${safeToFixed(value)}`}
                  className="h-full"
                />
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm p-3 rounded-md shadow-lg border border-fuchsia-500/20">
                  <div className="text-sm font-medium text-fuchsia-300">CPA Médio</div>
                  <div className="text-2xl font-bold text-white">R$ {safeToFixed(0).replace(".", ",")}</div>
                  <div className="text-sm text-emerald-400 flex items-center mt-1">
                    <ArrowDown className="h-3 w-3 mr-1" /> 0.0% vs. período anterior
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-pink-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Users className="h-5 w-5 mr-2 text-pink-400" />
                  Demografia
                </CardTitle>
                <CardDescription className="text-pink-300">Distribuição por idade</CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <DonutChart
                  data={tiktokDemographics}
                  index="age"
                  category="percentage"
                  colors={["#FE2C55", "#E4405F", "#D81A60", "#C2185B", "#AD1457"]}
                  valueFormatter={(value) => `${value}%`}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-purple-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Award className="h-5 w-5 mr-2 text-purple-400" />
                  Tipos de Engajamento
                </CardTitle>
                <CardDescription className="text-purple-300">Distribuição por tipo de interação</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <DonutChart
                  data={tiktokEngagementData}
                  index="type"
                  category="value"
                  colors={["#FE2C55", "#E4405F", "#D81A60", "#C2185B"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-pink-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Sparkles className="h-5 w-5 mr-2 text-pink-400" />
                  Vídeos Populares
                </CardTitle>
                <CardDescription className="text-pink-300">Top 5 vídeos por visualizações</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <div className="w-full">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 font-medium text-sm text-pink-300">Vídeo</th>
                        <th className="text-right py-2 font-medium text-sm text-pink-300">Visualizações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiktokTopVideos.map((video) => (
                        <TableRow key={video.video} className="hover:bg-pink-900/30 transition-colors duration-200">
                          <TableCell className="py-2 text-sm text-white">{video.video}</TableCell>
                          <TableCell className="py-2 text-right text-sm text-white">
                            {video.views.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quarta linha de gráficos */}
          <Card className="border-0 bg-black shadow-lg shadow-fuchsia-500/10 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <Globe className="h-5 w-5 mr-2 text-fuchsia-400" />
                    Distribuição por Dispositivo
                  </CardTitle>
                  <CardDescription className="text-fuchsia-300">Tráfego por tipo de dispositivo</CardDescription>
                </div>
                <Select defaultValue="percentage" className="w-32 sm:w-32">
                  <SelectTrigger className="h-8 text-xs bg-black border border-fuchsia-500/30 text-white">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-fuchsia-500/30">
                    <SelectItem value="percentage">Porcentagem</SelectItem>
                    <SelectItem value="device">Dispositivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-72 pt-4">
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                    {tiktokDeviceData.map((item) => (
                      <div
                        key={item.device}
                        className="flex flex-col items-center justify-center p-4 rounded-lg border border-fuchsia-500/20 bg-black relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 to-transparent"></div>
                        <div className="relative z-10">
                          {item.device === "Mobile" ? (
                            <Smartphone className="h-8 w-8 mb-2 text-fuchsia-400" />
                          ) : item.device === "Tablet" ? (
                            <Tablet className="h-8 w-8 mb-2 text-pink-400" />
                          ) : (
                            <Monitor className="h-8 w-8 mb-2 text-purple-400" />
                          )}
                          <div className="text-2xl font-bold text-white">{item.percentage}%</div>
                          <div className="text-xs text-white/70">{item.device}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-1/3 mt-4">
                  <div className="w-full bg-gray-900 rounded-full h-6 overflow-hidden flex">
                    {tiktokDeviceData.map((item) => (
                      <div
                        key={item.device}
                        className="h-full flex items-center justify-center text-xs font-medium text-white"
                        style={{
                          width: `${item.percentage}%`,
                          background:
                            item.device === "Mobile"
                              ? "linear-gradient(90deg, #FE2C55 0%, #E4405F 100%)"
                              : item.device === "Tablet"
                                ? "linear-gradient(90deg, #D81A60 0%, #C2185B 100%)"
                                : "linear-gradient(90deg, #AD1457 0%, #880E4F 100%)",
                        }}
                      >
                        {item.device === "Mobile" ? (
                          <Smartphone className="h-3 w-3 mr-1" />
                        ) : item.device === "Tablet" ? (
                          <Tablet className="h-3 w-3 mr-1" />
                        ) : (
                          <Monitor className="h-3 w-3 mr-1" />
                        )}{" "}
                        {item.percentage}%
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (platform === "kwai") {
      return (
        <div className="space-y-6">
          {/* Primeira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-orange-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <LineChartIcon className="h-5 w-5 mr-2 text-orange-400" />
                    Desempenho ao Longo do Tempo
                  </CardTitle>
                  <CardDescription className="text-orange-300">Impressões, visualizações e cliques</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <div className="absolute top-12 right-12 flex space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-400 mr-1"></div>
                    <span className="text-xs text-orange-300">Impressões</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-400 mr-1"></div>
                    <span className="text-xs text-amber-300">Visualizações</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></div>
                    <span className="text-xs text-yellow-300">Cliques</span>
                  </div>
                </div>
                <LineChart
                  data={data}
                  index="date"
                  categories={["impressions", "videoViews", "clicks"]}
                  colors={["#FF5000", "#FF7E00", "#FF3300"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-amber-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <BarChart2 className="h-5 w-5 mr-2 text-amber-400" />
                      Desempenho por Formato
                    </CardTitle>
                    <CardDescription className="text-amber-300">Métricas por tipo de anúncio</CardDescription>
                  </div>
                  <Select defaultValue="clicks" className="w-32 sm:w-32">
                    <SelectTrigger className="h-8 text-xs bg-black border border-amber-500/30 text-white">
                      <SelectValue placeholder="Métrica" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-amber-500/30">
                      <SelectItem value="clicks">Cliques</SelectItem>
                      <SelectItem value="impressions">Impressões</SelectItem>
                      <SelectItem value="videoViews">Visualizações</SelectItem>
                      <SelectItem value="spend">Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <BarChart
                  data={kwaiAdFormats}
                  index="format"
                  categories={["clicks", "videoViews"]}
                  colors={["#FF7E00", "#FF3300"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-yellow-500/10 overflow-hidden lg:col-span-2">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center text-white">
                      <DollarSign className="h-5 w-5 mr-2 text-yellow-400" />
                      Gastos e Resultados
                    </CardTitle>
                    <CardDescription className="text-yellow-300">Investimento e conversões</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="h-8 px-3 py-1.5 text-xs bg-black border border-yellow-500/30 text-white hover:bg-yellow-950"
                  >
                    <Download className="h-4 w-4 mr-1 text-yellow-300" /> Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-80 pt-4 relative">
                <BarChart
                  data={data}
                  index="date"
                  categories={["spend"]}
                  colors={["#FF3300"]}
                  valueFormatter={(value) => `R$ ${safeToFixed(value)}`}
                  className="h-full"
                />
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm p-3 rounded-md shadow-lg border border-yellow-500/20">
                  <div className="text-sm font-medium text-yellow-300">CPA Médio</div>
                  <div className="text-2xl font-bold text-white">R$ {safeToFixed(0).replace(".", ",")}</div>
                  <div className="text-sm text-emerald-400 flex items-center mt-1">
                    <ArrowDown className="h-3 w-3 mr-1" /> 0.0% vs. período anterior
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-orange-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Users className="h-5 w-5 mr-2 text-orange-400" />
                  Demografia
                </CardTitle>
                <CardDescription className="text-orange-300">Distribuição por idade</CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <DonutChart
                  data={kwaiDemographics}
                  index="age"
                  category="percentage"
                  colors={["#FF5000", "#FF7E00", "#FF3300", "#FF9248", "#FFB280"]}
                  valueFormatter={(value) => `${value}%`}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 bg-black shadow-lg shadow-amber-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Award className="h-5 w-5 mr-2 text-amber-400" />
                  Tipos de Engajamento
                </CardTitle>
                <CardDescription className="text-amber-300">Distribuição por tipo de interação</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <DonutChart
                  data={kwaiEngagementData}
                  index="type"
                  category="value"
                  colors={["#FF5000", "#FF7E00", "#FF3300", "#FF9248"]}
                  valueFormatter={(value) => value.toLocaleString("pt-BR")}
                  className="h-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-black shadow-lg shadow-orange-500/10 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center text-white">
                  <Sparkles className="h-5 w-5 mr-2 text-orange-400" />
                  Vídeos Populares
                </CardTitle>
                <CardDescription className="text-orange-300">Top 5 vídeos por visualizações</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-4">
                <div className="w-full">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 font-medium text-sm text-orange-300">Vídeo</th>
                        <th className="text-right py-2 font-medium text-sm text-orange-300">Visualizações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kwaiTopVideos.map((video) => (
                        <TableRow key={video.video} className="hover:bg-orange-900/30 transition-colors duration-200">
                          <TableCell className="py-2 text-sm text-white">{video.video}</TableCell>
                          <TableCell className="py-2 text-right text-sm text-white">
                            {video.views.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quarta linha de gráficos */}
          <Card className="border-0 bg-black shadow-lg shadow-yellow-500/10 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center text-white">
                    <Globe className="h-5 w-5 mr-2 text-yellow-400" />
                    Distribuição por Dispositivo
                  </CardTitle>
                  <CardDescription className="text-yellow-300">Tráfego por tipo de dispositivo</CardDescription>
                </div>
                <Select defaultValue="percentage" className="w-32 sm:w-32">
                  <SelectTrigger className="h-8 text-xs bg-black border border-yellow-500/30 text-white">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-yellow-500/30">
                    <SelectItem value="percentage">Porcentagem</SelectItem>
                    <SelectItem value="device">Dispositivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-72 pt-4">
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {kwaiDeviceData.map((item) => (
                      <div
                        key={item.device}
                        className="flex flex-col items-center justify-center p-4 rounded-lg border border-yellow-500/20 bg-black relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-transparent"></div>
                        <div className="relative z-10">
                          {item.device === "Mobile" ? (
                            <Smartphone className="h-8 w-8 mb-2 text-yellow-400" />
                          ) : (
                            <Monitor className="h-8 w-8 mb-2 text-orange-400" />
                          )}
                          <div className="text-2xl font-bold text-white">{item.percentage}%</div>
                          <div className="text-xs text-white/70">{item.device}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-1/3 mt-4">
                  <div className="w-full bg-gray-900 rounded-full h-6 overflow-hidden flex">
                    {kwaiDeviceData.map((item) => (
                      <div
                        key={item.device}
                        className="h-full flex items-center justify-center text-xs font-medium text-white"
                        style={{
                          width: `${item.percentage}%`,
                          background:
                            item.device === "Mobile"
                              ? "linear-gradient(90deg, #FF5000 0%, #FF7E00 100%)"
                              : "linear-gradient(90deg, #FF3300 0%, #FF9248 100%)",
                        }}
                      >
                        {item.device === "Mobile" ? (
                          <Smartphone className="h-3 w-3 mr-1" />
                        ) : (
                          <Monitor className="h-3 w-3 mr-1" />
                        )}{" "}
                        {item.percentage}%
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center">
        <p>Nenhum gráfico disponível para esta plataforma.</p>
      </div>
    )
  }

  const getMetricsForTab = (): AdMetric[] => {
    switch (activeTab) {
      case "facebook":
        return metaMetrics
      case "google":
        return googleMetrics
      case "analytics":
        return analyticsMetrics
      case "tiktok":
        return tiktokMetrics
      case "kwai":
        return kwaiMetrics
      default:
        return []
    }
  }

  const getChartDataForTab = (): ChartData[] => {
    switch (activeTab) {
      case "facebook":
        return metaChartData
      case "google":
        return googleChartData
      case "analytics":
        return analyticsChartData
      case "tiktok":
        return tiktokChartData
      case "kwai":
        return kwaiChartData
      default:
        return []
    }
  }

  const metrics = getMetricsForTab()
  const chartData = getChartDataForTab()


  return (
  <>
    {hasError ? (
      /* --- ESTADO DE ERRO --- */
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-red-500 mb-4">Ocorreu um erro ao carregar o dashboard</div>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    ) : isConnectView ? (
      /* --- CONTEÚDO: CONEXÃO DE CONTAS --- */
      <ConnectAccountsPage onBack={() => setIsConnectView(false)} />
    ) : (
      /* --- CONTEÚDO NORMAL DO DASHBOARD --- */
      <div id="ads-dashboard-container" className="flex-1 space-y-4 p-4 md:p-8">
        <div className="md:flex items-center justify-between">
          {/* Lado esquerdo: título e seletor de período */}
          <div className="flex items-center space-x-4">
            <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {activeTab === "facebook"
                ? "Meta ADS"
                : activeTab === "google"
                ? "Google ADS"
                : activeTab === "analytics"
                ? "Analytics"
                : activeTab === "tiktok"
                ? "TikTok ADS"
                : activeTab === "kwai"
                ? "Kwai ADS"
                : "Visão Geral"}
            </h1>

            {/* Período de Visualização */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Período de Visualização</span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-8 w-[180px] text-sm">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="7d">Últimos 7 Dias</SelectItem>
                  <SelectItem value="thisMonth">Esse Mês</SelectItem>
                  <SelectItem value="lastMonth">Mês passado</SelectItem>
                  <SelectItem value="max">Esse Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lado direito: botões */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 px-3 py-1.5 text-xs bg-transparent"
              onClick={() => setIsConnectView(true)}
            >
              Conectar Contas
            </Button>

            <Button
              variant="secondary"
              className="h-8 px-3 py-1.5 text-xs"
              onClick={() => {
                setActiveTab("facebook")
                setActiveSubTab("contas")
                setTimeout(() => {
                  document.getElementById("manager-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }, 0)
              }}
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              Gerenciar Contas
            </Button>
          </div>
        </div>

        {/* Mobile: Período de Visualização - Agora sempre visível */}
        <div className="md:hidden mt-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="max">Máximo</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7d">Últimos 7 Dias</SelectItem>
              <SelectItem value="thisMonth">Esse Mês</SelectItem>
              <SelectItem value="lastMonth">Mês passado</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:hidden">
          <Select onValueChange={(value) => setActiveTab(value as AdPlatform)} defaultValue={activeTab}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {!imageErrors[tab.id] ? (
                    <Image
                      src={tab.icon || "/placeholder.svg"}
                      alt={tab.name}
                      width={tab.size}
                      height={tab.size}
                      onError={() => handleImageError(tab.id)}
                      className="inline-block mr-2"
                    />
                  ) : (
                    <span className="inline-block mr-2">{tab.fallbackIcon}</span>
                  )}
                  {tab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:block">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="secondary"
                className={`gap-2 justify-start ${activeTab === tab.id ? "bg-muted text-foreground" : ""}`}
                onClick={() => setActiveTab(tab.id as AdPlatform)}
              >
                {!imageErrors[tab.id] ? (
                  <Image
                    src={tab.icon || "/placeholder.svg"}
                    alt={tab.name}
                    width={tab.size}
                    height={tab.size}
                    onError={() => handleImageError(tab.id)}
                  />
                ) : (
                  tab.fallbackIcon
                )}
                {!isMobile && tab.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Sub-tab buttons - Agora sempre visíveis */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide mt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-8 px-3 py-1.5 text-xs">
                {selectedAccountName}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="min-w-[220px]">
              {adAccounts?.length ? (
                adAccounts.map((acc) => (
                  <DropdownMenuItem key={acc.id} onClick={() => handleSelectAccount(acc.id)}>
                    {acc.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>Nenhuma conta encontrada</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="secondary"
            className={`gap-2 justify-start ${activeSubTab === "graficos" ? "bg-muted text-foreground" : ""} h-8 px-3 py-1.5 text-xs`}
            onClick={() => setActiveSubTab("graficos")}
          >
            Gráficos
          </Button>
          <Button
            variant="secondary"
            className={`gap-2 justify-start ${activeSubTab === "campanhas" ? "bg-muted text-foreground" : ""} h-8 px-3 py-1.5 text-xs`}
            onClick={() => setActiveSubTab("campanhas")}
          >
            Campanhas
          </Button>
          <Button
            variant="secondary"
            className={`gap-2 justify-start ${activeSubTab === "conjuntos" ? "bg-muted text-foreground" : ""} h-8 px-3 py-1.5 text-xs`}
            onClick={() => setActiveSubTab("conjuntos")}
          >
            Conjuntos
          </Button>
          <Button
            variant="secondary"
            className={`gap-2 justify-start ${activeSubTab === "anuncios" ? "bg-muted text-foreground" : ""} h-8 px-3 py-1.5 text-xs`}
            onClick={() => setActiveSubTab("anuncios")}
          >
            Anúncios
          </Button>
        </div>

        {/* Conteúdo principal do dashboard de ADS */}
        {activeSubTab === "graficos" && (
          <>
            {renderMetricCards(metrics)}
            {renderCharts(chartData, activeTab)}
          </>
        )}

        {activeSubTab === "contas" &&
          (activeTab === "facebook" ? (
            <>
              <div id="manager-anchor" className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Gerenciador de Contas</h1>
              </div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contas de Anúncios do Facebook</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchAdAccounts} disabled={loadingAccounts}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {loadingAccounts ? "Carregando..." : "Atualizar Contas"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingAccounts ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : adAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma conta de anúncios encontrada.</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Toggle global: Ativar todas */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <h3 className="text-sm font-medium text-muted-foreground">Contas de Anúncio (Meta)</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Ativar todas:</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer accent-primary"
                            onChange={(e) => {
                              const newStatus = e.target.checked ? 1 : 0
                              adAccounts.forEach((acc) => handleAccountStatusChange(acc.id, newStatus))
                            }}
                          />
                        </div>
                      </div>

                      {/* Lista de contas individuais */}
                      {adAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between border border-border/60 rounded-lg px-4 py-3 hover:bg-muted/40 transition"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{account.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ID: {account.id} • {account.account_status === 1 ? "Ativa" : "Inativa"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              variant={selectedAccountId === account.id ? "default" : "outline"}
                              onClick={() => setSelectedAccountId(account.id)}
                            >
                              {selectedAccountId === account.id ? "Selecionado" : "Selecionar"}
                            </Button>

                            <input
                              type="checkbox"
                              checked={account.account_status === 1}
                              className="h-4 w-4 cursor-pointer accent-primary"
                              onChange={() => handleAccountStatusChange(account.id, account.account_status)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center h-60">
              <p className="text-muted-foreground">Conteúdo da aba Contas para: {selectedAccountName}</p>
            </div>
          ))}

                {/* CAMPANHAS */}
{activeSubTab === "campanhas" &&
  (activeTab === "facebook" && selectedAccountId ? (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        {/* ===== Toolbar Campanhas ===== */}
        <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {/* Filtro de status */}
            <Select
              value={statusCampaignsFilter}
              onValueChange={(v) =>
                setStatusCampaignsFilter(v as "ALL" | "ACTIVE" | "PAUSED")
              }
            >
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="ACTIVE">Apenas ativas</SelectItem>
                <SelectItem value="PAUSED">Apenas pausadas</SelectItem>
              </SelectContent>
            </Select>

            {/* Itens por página */}
            <Select
              value={String(campaignsPageSize)}
              onValueChange={(v) => {
                setCampaignsPageSize(Number(v))
                setCampaignsPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Itens/página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Busca + atualizar */}
          <div className="flex items-center gap-2">
            <input
              value={searchCampaigns}
              onChange={(e) => setSearchCampaigns(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && selectedAccountId)
                  fetchCampaigns(selectedAccountId)
              }}
              placeholder="Buscar por nome da campanha..."
              className="h-8 w-full md:w-[280px] rounded-md bg-background border px-3 text-sm outline-none"
            />
            <Button
              variant="outline"
              className="h-8"
              onClick={() =>
                selectedAccountId && fetchCampaigns(selectedAccountId)
              }
              disabled={loadingCampaigns}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
        {/* ===== /Toolbar ===== */}

        {/* 🔹 Caixa neon envolvendo tudo */}
        <div className="mt-3 neon-meta-border">
          <div className="neon-meta-inner px-3 py-2 md:px-4 md:py-3">
            {loadingCampaigns ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma campanha encontrada para esta conta.
              </p>
            ) : (
              <>
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[1100px] border-collapse table-surface">
                    <TableHeader className="border-b border-white/10">
                      {/* 🔹 Linha de totais/médias */}
                      <TableRow className="table-row-border">
                        {/* Status + Campanha + Orçamento */}
                        <TableHead
                          className="sticky left-0 z-20 bg-[hsl(var(--muted))] dark:bg-[#111317] border-r border-white/10"
                          colSpan={3}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                              Resultados de {filteredCampaigns.length} campanhas
                            </span>
                          </div>
                        </TableHead>

                        {/* Valor usado */}
                        <TableHead className="border-r border-white/10">
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                            Total usado
                          </span>

                          <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                            {campaignsSummary.totalSpend > 0
                              ? moneyBRL(campaignsSummary.totalSpend)
                              : "—"}
                          </span>
                        </TableHead>

                        {/* Resultados */}
                        <TableHead className="border-r border-white/10">
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                            Total resultados
                          </span>
                          <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                            {campaignsSummary.totalResults ?? 0}
                          </span>
                        </TableHead>

                        {/* ROAS */}
                        <TableHead className="border-r border-white/10">
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Total ROAS
                            </span>
                            <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                              {campaignsSummary.avgRoas != null
                                ? campaignsSummary.avgRoas.toFixed(2)
                                : "—"}
                            </span>
                          </div>
                        </TableHead>

                        {/* Custo por resultado (CPR) */}
                        <TableHead className="border-r border-white/10">
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Total CPR
                            </span>
                            <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                              {campaignsSummary.avgCostPerResult != null
                                ? moneyBRL(campaignsSummary.avgCostPerResult)
                                : "—"}
                            </span>
                          </div>
                        </TableHead>

                        {/* CPM */}
                        <TableHead className="border-r border-white/10">
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Total CPM
                            </span>
                            <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                              {campaignsSummary.avgCpm != null
                                ? moneyBRL(campaignsSummary.avgCpm)
                                : "—"}
                            </span>
                          </div>
                        </TableHead>

                        {/* Cliques no link */}
                        <TableHead className="border-r border-white/10">
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Total cliques
                            </span>
                            <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                              {campaignsSummary.totalClicks ?? 0}
                            </span>
                          </div>
                        </TableHead>

                        {/* CPC */}
                        <TableHead className="border-r border-white/10">
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Total CPC
                            </span>
                            <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                              {campaignsSummary.avgCpc != null
                                ? moneyBRL(campaignsSummary.avgCpc)
                                : "—"}
                            </span>
                          </div>
                        </TableHead>

                        {/* CTR */}
                        <TableHead>
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Total CTR
                            </span>
                            <span className="font-semibold whitespace-nowrap flex items-center gap-1 text-foreground dark:text-white">
                              {campaignsSummary.avgCtr != null
                                ? `${Number(
                                    campaignsSummary.avgCtr,
                                  ).toFixed(2)}%`
                                : "—"}
                            </span>
                          </div>
                        </TableHead>
                      </TableRow>

                      {/* ⬇️ Cabeçalho normal das colunas */}
<TableRow className="table-row-border">
  {/* Coluna 1 - Status */}
  <TableHead
    className="sticky left-0 z-20 bg-[hsl(var(--muted))] dark:bg-[#111317] w-[100px] border-r border-white/10 border-b border-white/20"
  >
    Status
  </TableHead>

  {/* Coluna 2 - Campanha */}
  <TableHead
    className="sticky left-[100px] z-20 bg-[hsl(var(--muted))] dark:bg-[#111317] min-w-[260px] border-r border-white/10 border-b border-white/20"
  >
    Campanha
  </TableHead>

  {/* Coluna 3 - Orçamento */}
  <TableHead
    className="sticky left-[360px] z-20 bg-[hsl(var(--muted))] dark:bg-[#111317] w-[160px] border-r border-white/10 border-b border-white/20"
  >
    Orçamento
  </TableHead>

  {/* resto das colunas permanece igual */}
  <TableHead className="border-r border-white/10 border-b border-white/20">
    Valor usado
  </TableHead>
  <TableHead className="border-r border-white/10 border-b border-white/20">
    Resultados
  </TableHead>
  <TableHead className="border-r border-white/10 border-b border-white/20">
    ROAS de resultados
  </TableHead>
                        <TableHead className="border-r border-white/10 border-b border-white/20">
                          Custo por resultado
                        </TableHead>
                        <TableHead className="border-r border-white/10 border-b border-white/20">
                          CPM (custo por 1.000)
                        </TableHead>
                        <TableHead className="border-r border-white/10 border-b border-white/20">
                          Cliques no link
                        </TableHead>
                        <TableHead className="border-r border-white/10 border-b border-white/20">
                          CPC
                        </TableHead>
                        <TableHead className="border-b border-white/20">
                          CTR
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pagedCampaigns.map((c: any) => (
                        <TableRow
                          key={c.id}
                          className="border-b border-white/10 last:border-b-0 [&>td]:py-3"
                        >
                          {/* Coluna 1 - toggle ativar/desativar */}
<TableCell
  className="sticky left-0 z-10 bg-[hsl(var(--muted))] dark:bg-[#111317] text-center w-[100px] border-r border-white/10 p-0"
>
  {(() => {
    const isActive = c.status === "ACTIVE"
    return (
      <button
        onClick={() => handleCampaignStatusChange(c.id, c.status)}
        className={cn(
          "relative inline-flex h-6 w-14 items-center rounded-full border transition-all duration-300",
          isActive
            ? "border-emerald-300 bg-gradient-to-br from-emerald-300 to-emerald-400 shadow-[0_5px_10px_rgba(16,185,129,0.6)]"
            : "border-zinc-500/60 bg-gradient-to-br from-zinc-700 to-zinc-800 shadow-inner",
        )}
        aria-pressed={isActive}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-[2px] rounded-full opacity-60 blur-[2px]",
            isActive ? "bg-emerald-300/50" : "bg-zinc-500/40",
          )}
        />
        <span
          className={cn(
            "relative inline-block h-5 w-5 transform rounded-full bg-gradient-to-br from-white to-zinc-100 shadow-[0_4px_8px_rgba(0,0,0,0.35)] transition-all duration-300",
            isActive ? "translate-x-7" : "translate-x-1",
          )}
        />
      </button>
    )
  })()}
</TableCell>

{/* Coluna 2 - Campanha (nome + lápis) */}
<TableCell
  className="sticky left-[70px] z-10 bg-[hsl(var(--muted))] dark:bg-[#111317] min-w-[260px] border-r border-white/10 px-3"
>
  <div className="group flex items-center gap-2">
    <span className="truncate max-w-xs">{c.name}</span>
    <button
      type="button"
      onClick={() => handleStartEditCampaignName(c)}
      className="invisible group-hover:visible inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs hover:bg-white/10 transition"
    >
      <Pencil className="h-3 w-3" />
    </button>
  </div>
</TableCell>

{/* Coluna 3 - Orçamento */}
<TableCell
  className="sticky left-[430px] z-10 bg-[hsl(var(--muted))] dark:bg-[#111317] w-[140px] border-r border-white/10 pl-3 pr-2 py-1"
>
  <div className="group flex flex-col">
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium">
        {c.budget != null ? moneyBRL(c.budget) : "—"}
      </span>

      {c.budget != null && (
        <button
          type="button"
          onClick={() => handleStartEditCampaignBudget(c)}
          className="invisible group-hover:visible inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs hover:bg-white/10 transition"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
    <span className="text-xs text-muted-foreground">Diário</span>
  </div>
</TableCell>


                          {/* Coluna 4 em diante */}
                          <TableCell className="border-r border-white/10">
                            {moneyBRL(c.spend)}
                          </TableCell>

                          <TableCell className="border-r border-white/10">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {c.results ?? 0}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {c.resultLabel || "Resultados"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="border-r border-white/10">
                            {c.roas != null ? c.roas.toFixed(2) : "—"}
                          </TableCell>

                          <TableCell className="border-r border-white/10">
                            {c.cost_per_result != null
                              ? moneyBRL(c.cost_per_result)
                              : "—"}
                          </TableCell>

                          <TableCell className="border-r border-white/10">
                            {c.cpm != null
                              ? moneyBRL(c.cpm)
                              : "—"}
                          </TableCell>

                          <TableCell className="border-r border-white/10">
                            {c.inline_link_clicks ?? 0}
                          </TableCell>

                          <TableCell className="border-r border-white/10">
                            {c.cpc != null
                              ? moneyBRL(c.cpc)
                              : "—"}
                          </TableCell>

                          {/* Última coluna → sem border-r para não duplicar */}
                          <TableCell>
                            {c.ctr != null
                              ? `${Number(c.ctr).toFixed(2)}%`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação Campanhas */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-muted-foreground">
                    Exibindo {pagedCampaigns.length} de{" "}
                    {filteredCampaigns.length} campanhas
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-8 px-3"
                      disabled={campaignsPage === 1 || loadingCampaigns}
                      onClick={() =>
                        setCampaignsPage((p) => Math.max(1, p - 1))
                      }
                    >
                      Anterior
                    </Button>
                    <div className="text-sm">
                      Página{" "}
                      <span className="font-semibold">
                        {campaignsPage}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="h-8 px-3"
                      disabled={
                        loadingCampaigns ||
                        campaignsPage * campaignsPageSize >=
                          filteredCampaigns.length
                      }
                      onClick={() => setCampaignsPage((p) => p + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  ) : (
    <div className="flex items-center justify-center h-60">
      <p className="text-muted-foreground">
        Conteúdo da aba Campanhas (em desenvolvimento)
      </p>
    </div>
  ))}
      </div>
    )}
  </>
)
}