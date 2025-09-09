"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, DonutChart } from "@/components/ui/charts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  RefreshCw,
  Settings,
  ImportIcon as FileImport,
  TrendingDown,
  Undo2,
  CalendarIcon,
} from "lucide-react"
import { format, subDays, subMonths, isAfter, isEqual, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import type { PaymentGatewayType } from "@/lib/payment-gateway-types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GatewayConfig } from "@/components/payment/gateway-config"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"

interface GatewayTransactionsViewProps {
  userName?: string
}

export function GatewayTransactionsView({ userName }: GatewayTransactionsViewProps) {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  })
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType | "all">("all")
  const [isGatewayConfigOpen, setIsGatewayConfigOpen] = useState(false)
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false)
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false)
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange)

  const {
    transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
    getStats,
    getFilteredTransactions,
    refreshTransactions,
    realtimeStatus,
    testRealtimeConnection,
  } = useGatewayTransactions()

  // Configurações de gateway fixas para teste
const gatewayConfigs = [
  { id: "kirvano",       name: "Kirvano",       color: "#6B7280",   logo: "/images/gateway-logos/kirvano.png" },
  { id: "cakto",         name: "Cakto",         color: "#10B985",   logo: "/images/gateway-logos/cakto.png" },
  { id: "kiwify",        name: "Kiwify",        color: "#10B981",   logo: "/images/gateway-logos/kiwify.png" },
  { id: "hotmart",       name: "Hotmart",       color: "#ff5e00ff", logo: "/images/gateway-logos/hotmart.png" },
  { id: "monetizze",     name: "Monetizze",     color: "#5500ffff", logo: "/images/gateway-logos/monetizze.png" },
  { id: "eduzz",         name: "Eduzz",         color: "#e2ba2bff", logo: "/images/gateway-logos/eduzz.jpeg" },
  { id: "pepper",        name: "Pepper",        color: "#ff0000ff", logo: "/images/gateway-logos/pepper.png" },
  { id: "braip",         name: "Braip",         color: "#840891ff", logo: "/images/gateway-logos/braip.jpeg" },
  { id: "lastlink",      name: "Lastlink",      color: "#00fa15ff", logo: "/images/gateway-logos/lastlink.png" },
  { id: "disrupty",      name: "Disrupty",      color: "#ffff00ff", logo: "/images/gateway-logos/disrupty.png" },
  { id: "perfectpay",    name: "PerfectPay",    color: "#05f3ffff", logo: "/images/gateway-logos/perfectpay.jpeg" },
  { id: "goatpay",       name: "Goatpay",       color: "#dfc323ff", logo: "/images/gateway-logos/goatpay.jpeg" },
  { id: "tribopay",      name: "Tribopay",      color: "#0fd347ff", logo: "/images/gateway-logos/tribopay.jpeg" },
  { id: "nuvemshop",     name: "Nuvemshop",     color: "#00C2B2",   logo: "/images/gateway-logos/nuvemshop.png" },
  { id: "woocommerce",   name: "WooCommerce",   color: "#96588A",   logo: "/images/gateway-logos/woocommerce.png" },
  { id: "loja_integrada",name: "Loja Integrada",color: "#32c0cdff", logo: "/images/gateway-logos/loja_integrada.png" },
  { id: "cartpanda",     name: "Cartpanda",     color: "#1e00ffff", logo: "/images/gateway-logos/cartpanda.png" },
]

const colorByGatewayId = useMemo(
  () => Object.fromEntries(gatewayConfigs.map(g => [g.id, g.color] as const)),
  [gatewayConfigs]
)

const lineColorsByLabel = useMemo(() => {
  const map: Record<string, string> = { total: "#6B7280" } // cinza do "total"
  gatewayConfigs.forEach(g => { map[g.id] = g.color })
  return map
}, [gatewayConfigs])

  const gatewayColors = gatewayConfigs.map((g) => g.color);

   const colorByGatewayName = useMemo(
    () => Object.fromEntries(gatewayConfigs.map(g => [g.name, g.color] as const)),
    [gatewayConfigs]
  )

  // Calcula net_amount real só de completed
  const calculateNetAmountFromSupabase = useCallback(
    (period: { from: Date; to: Date }) => {
      const completedTransactions = getFilteredTransactions({
        status: "completed",
        period,
        gateway: selectedGateway === "all" ? undefined : selectedGateway,
      })

      const totalNetAmount = completedTransactions.reduce((sum, t) => sum + (t.net_amount || 0), 0)

      console.log("🔍 Calculando Valor Líquido do Supabase:")
      console.log("- Transações completed encontradas:", completedTransactions.length)
      console.log("- Valor líquido total (net_amount):", totalNetAmount)

      return totalNetAmount
    },
    [getFilteredTransactions, selectedGateway],
  )

  // ✅ Consolidado agora inclui recusadas (refused)
  const getConsolidatedSummary = (period: { from: Date; to: Date }) => {
    const stats = getStats({ period, gateway: selectedGateway === "all" ? undefined : selectedGateway })

    // Valor líquido real (completed → net_amount)
    const realNetAmount = calculateNetAmountFromSupabase(period)

    // Abandonadas direto das transações para manter compatibilidade
    const abandonedTransactions = transactions.filter((t) => {
      const isAbandoned = t.event_type === "checkout_abandonment" || t.status === "abandoned"
      const createdAtDate = t.created_at ? new Date(t.created_at) : null
      const inDateRange =
        createdAtDate && (!period?.from || createdAtDate >= period.from) && (!period?.to || createdAtDate <= period.to)
      const matchesGateway = selectedGateway === "all" || t.gateway_id === selectedGateway
      return isAbandoned && inDateRange && matchesGateway
    })

    console.log("--- Debug Vendas Abandonadas (Summary) ---")
    console.log("Período selecionado:", period)
    console.log("Gateway selecionado:", selectedGateway)
    console.log("Transações abandonadas encontradas:", abandonedTransactions.length)
    console.log("-------------------------------")

    // Chargebacks (se existirem na sua base)
    const chargebackTransactions = transactions.filter((t) => {
      const isChargeback = t.event_type === "chargeback" || (t as any).status === "chargeback"
      const createdAtDate = t.created_at ? new Date(t.created_at) : null
      const inDateRange =
        createdAtDate && (!period?.from || createdAtDate >= period.from) && (!period?.to || createdAtDate <= period.to)
      const matchesGateway = selectedGateway === "all" || t.gateway_id === selectedGateway
      return isChargeback && inDateRange && matchesGateway
    })

    const completedTransactions = getFilteredTransactions({
      status: "completed",
      period,
      gateway: selectedGateway === "all" ? undefined : selectedGateway,
    })

    const allTransactions = getFilteredTransactions({
      period,
      gateway: selectedGateway === "all" ? undefined : selectedGateway,
    })

    const calculateApprovalRate = (paymentMethod: string) => {
      const totalForMethod = allTransactions.filter((t) => t.payment_method === paymentMethod).length
      const completedForMethod = completedTransactions.filter((t) => t.payment_method === paymentMethod).length
      if (totalForMethod === 0) return 0
      return (completedForMethod / totalForMethod) * 100
    }

    const approvalRates = {
      cartao: calculateApprovalRate("credit_card") || calculateApprovalRate("cartao"),
      pix: calculateApprovalRate("pix"),
      boleto: calculateApprovalRate("boleto"),
    }

    return {
      // principais
      totalAmount: stats.totalRevenue,
      totalTransactions: stats.totalTransactions,
      totalFees: stats.totalFees,
      netAmount: realNetAmount,

      // não concluídas
      uncompletedSalesAmount: stats.pendingAmount + stats.failedAmount,

      // abandonadas (mantém lógica anterior)
      totalAbandonedTransactions: abandonedTransactions.length,
      abandonedAmount: abandonedTransactions.reduce((sum, t) => sum + Number(t.product_price || 0), 0),

      // ✅ recusadas (AGORA INCLUÍDO)
      refusedTransactions: stats.refusedTransactions,
      refusedAmount: stats.refusedAmount,

      // reembolsos / chargebacks
      totalRefunds: stats.totalRefunds,
      refundedAmount: stats.refundedAmount,
      totalChargebacks: chargebackTransactions.length,
      chargebackAmount: chargebackTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),

      // por gateway
      approvalRates,
      gatewaySummaries: gatewayConfigs.map((gateway) => {
        const gatewayTransactions = getFilteredTransactions({
          gateway: gateway.id as any,
          period,
          status: "completed",
        })
        const totalAmount = gatewayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        const totalFees = gatewayTransactions.reduce((sum, t) => sum + (t.fee || 0), 0)
        const gatewayNetAmount = gatewayTransactions.reduce((sum, t) => sum + (t.net_amount || 0), 0)

        return {
          gatewayId: gateway.id,
          totalAmount,
          totalTransactions: gatewayTransactions.length,
          totalFees,
          netAmount: gatewayNetAmount,
          dailySummaries: [],
        }
      }),
    }
  }

  // Compat
  const importToFinance = () => ({ success: true, count: 0, total: 0 })
  const setupAutoSync = () => () => {}

  // Estado inicial do summary (✅ agora com recusadas)
  const [summary, setSummary] = useState(() => {
    if (dateRange?.from && dateRange?.to) {
      return getConsolidatedSummary({ from: dateRange.from, to: dateRange.to })
    }
    return {
      totalAmount: 0,
      totalTransactions: 0,
      totalFees: 0,
      netAmount: 0,
      gatewaySummaries: [] as any[],
      uncompletedSalesAmount: 0,
      totalAbandonedTransactions: 0,
      abandonedAmount: 0,
      // recusadas
      refusedTransactions: 0,
      refusedAmount: 0,
      // reembolsos/chargebacks
      totalRefunds: 0,
      refundedAmount: 0,
      totalChargebacks: 0,
      chargebackAmount: 0,
      approvalRates: {
        cartao: 0,
        pix: 0,
        boleto: 0,
      },
    }
  })

  // Metas de exemplo
  const initialSalesTarget = 100
  const initialRevenueTarget = 20000

  const validateDateRange = useCallback(
    (range: DateRange | undefined) => {
      if (!range?.from || !range?.to) {
        toast({
          title: "Seleção incompleta",
          description: "Por favor, selecione uma data inicial e final.",
          variant: "destructive",
        })
        return false
      }
      if (isAfter(range.from, range.to) && !isEqual(range.from, range.to)) {
        toast({
          title: "Erro na seleção de datas",
          description: "A data final deve ser igual ou posterior à data inicial.",
          variant: "destructive",
        })
        return false
      }
      return true
    },
    [toast],
  )

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const isValidRange = validateDateRange(dateRange)
      if (isValidRange) {
        setSummary(getConsolidatedSummary({ from: dateRange.from, to: dateRange.to }))
      }
    }
  }, [dateRange, validateDateRange, selectedGateway, selectedPeriod, transactions])

  const handleRefresh = async () => {
    setIsLoading(true)
    await refreshTransactions()
    setIsLoading(false)

    if (dateRange?.from && dateRange?.to && validateDateRange(dateRange)) {
      setSummary(getConsolidatedSummary({ from: dateRange.from, to: dateRange.to }))

      const result = importToFinance()
      if (result.success && result.count > 0) {
        toast({
          title: "Dados sincronizados com Financeiro",
          description: `${result.count} transações foram automaticamente atualizadas na aba Financeiro.`,
        })
      }
    }
  }

  const handleTestRealtime = async () => {
    const success = await testRealtimeConnection()
    if (success) {
      toast({
        title: "Teste de Realtime",
        description: "Transação de teste inserida. Verifique se os dados foram atualizados automaticamente.",
      })
    } else {
      toast({
        title: "Erro no Teste",
        description: "Não foi possível inserir a transação de teste.",
        variant: "destructive",
      })
    }
  }

  const handleImportToFinance = () => {
    setIsImporting(true)
    setTimeout(() => {
      const result = importToFinance()
      setIsImporting(false)
      if (result.success) {
        if (result.count > 0) {
          toast({
            title: "Importação concluída",
            description: `${result.count} transações importadas com sucesso, totalizando ${formatCurrency(result.total)}.`,
            variant: "default",
          })
        } else {
          toast({
            title: "Nenhuma nova transação",
            description: "Todas as transações já foram importadas anteriormente.",
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Erro na importação",
          description: "Não foi possível importar as transações. Tente novamente.",
          variant: "destructive",
        })
      }
    }, 500)
  }

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    const today = new Date()
    let fromDate: Date | undefined
    let toDate: Date | undefined = endOfDay(today)

    switch (value) {
      case "all_time":
        fromDate = new Date("1900-01-01")
        toDate = endOfDay(today)
        setDateRange({ from: fromDate, to: toDate })
        break
      case "today":
        fromDate = startOfDay(today)
        setDateRange({ from: fromDate, to: toDate })
        break
      case "yesterday":
        fromDate = startOfDay(subDays(today, 1))
        toDate = endOfDay(subDays(today, 1))
        setDateRange({ from: fromDate, to: toDate })
        break
      case "7d":
        fromDate = startOfDay(subDays(today, 6))
        setDateRange({ from: fromDate, to: toDate })
        break
      case "30d":
        fromDate = subDays(today, 29)
        setDateRange({ from: fromDate, to: toDate })
        break
      case "this_month":
        fromDate = startOfMonth(today)
        toDate = endOfMonth(today)
        setDateRange({ from: fromDate, to: toDate })
        break
      case "last_month":
        fromDate = startOfMonth(subMonths(today, 1))
        toDate = endOfMonth(subMonths(today, 1))
        setDateRange({ from: fromDate, to: toDate });
        break
      case "90d":
        fromDate = subDays(today, 89)
        toDate = endOfDay(today)
        setDateRange({ from: fromDate, to: toDate });
        break
      case "1y":
        fromDate = subMonths(today, 11)
        toDate = endOfDay(today)
        setDateRange({ from: fromDate, to: toDate });
        break
      case "custom_month":
        setTempDateRange(undefined)
        setIsStartDatePickerOpen(false)
        setIsEndDatePickerOpen(false)
        break
      default:
        fromDate = startOfDay(today)
        setDateRange({ from: fromDate, to: toDate })
        break
    }
  }

  // Traduz o payment_method salvo no banco para rótulo PT-BR
const getPaymentLabel = (method?: string | null) => {
  const m = String(method ?? '').toLowerCase().trim()
  const map: Record<string, string> = {
    card: 'Cartão',
    credit_card: 'Cartão',
    credit: 'Cartão',
    debit_card: 'Cartão (débito)',
    debit: 'Cartão (débito)',
    pix: 'Pix',
    pix_qr: 'Pix',
    boleto: 'Boleto',
    slip: 'Boleto',
    transfer: 'Transferência',
    paypal: 'PayPal',
    wallet: 'Carteira',
    unknown: 'Desconhecido',
  }
  return map[m] ?? (method ? method : 'N/A')
}


  const getWhatsAppLink = (phone: string | null | undefined) => {
    if (!phone) return "#"
    const cleanedPhone = phone.replace(/\D/g, "")
    const formattedPhone = cleanedPhone.startsWith("55") ? cleanedPhone : `55${cleanedPhone}`
    return `https://wa.me/${formattedPhone}`
  }

  // ----- Charts prep
  const prepareRevenueData = useCallback(() => {
    const dateMap = new Map()

    const filteredTransactions = getFilteredTransactions({
      status: "completed",
      period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
      gateway: selectedGateway === "all" ? undefined : selectedGateway,
    })

    console.log("[REVENUE_DATA] Transações filtradas:", filteredTransactions.length)

    filteredTransactions.forEach((transaction, index) => {
      let transactionDate
      try {
        if (transaction.created_at instanceof Date) {
          transactionDate = transaction.created_at
        } else if (typeof transaction.created_at === "string") {
          transactionDate = new Date(transaction.created_at)
        } else {
          transactionDate = new Date()
        }
        if (isNaN(transactionDate.getTime())) {
          console.warn("[REVENUE_DATA] Data inválida na transação:", transaction)
          transactionDate = new Date()
        }
      } catch {
        transactionDate = new Date()
      }

      const date = transactionDate.toISOString().split("T")[0]

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          total: 0,
          kirvano: 0,
          cakto: 0,
          kiwify: 0,
          pepper: 0,
          nuvemshop: 0,
          woocommerce: 0,
          loja_integrada: 0,
          cartpanda: 0,
        })
      }

      const entry = dateMap.get(date)
      entry.total += transaction.amount || 0
      entry[transaction.gateway_id] = (entry[transaction.gateway_id] || 0) + (transaction.amount || 0)
    })

    const chartData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    if (chartData.length === 0) return []

    return chartData.map((item) => ({
      ...item,
      date: format(new Date(item.date), "dd/MM", { locale: ptBR }),
    }))
  }, [getFilteredTransactions, dateRange, selectedGateway])

  const prepareGatewayDistributionData = useCallback(() => {
  if (!summary?.gatewaySummaries?.length) return []

  return summary.gatewaySummaries
    .filter((g) =>
      selectedGateway === "all" ? true : g.gatewayId === selectedGateway
    )
    .filter((g) => (g.totalAmount ?? 0) > 0)
    .map((g) => ({
      name: gatewayConfigs.find((gc) => gc.id === g.gatewayId)?.name || g.gatewayId,
      value: g.totalAmount ?? 0,
    }))
}, [summary, gatewayConfigs, selectedGateway])

  const prepareTransactionCountData = useCallback(() => {
    if (!summary || !summary.gatewaySummaries || summary.gatewaySummaries.length === 0) return []
    return summary.gatewaySummaries.map((gateway) => ({
      name: gatewayConfigs.find((gc) => gc.id === gateway.gatewayId)?.name || gateway.gatewayId,
      count: gateway.totalTransactions,
    }))
  }, [summary, gatewayConfigs])

  const prepareProductDistributionData = useMemo(() => {
    const productMap = new Map<string, number>()
    const filteredTransactions = getFilteredTransactions({
      status: "completed",
      period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
      gateway: selectedGateway === "all" ? undefined : selectedGateway,
    })

    filteredTransactions.forEach((transaction) => {
      const currentAmount = productMap.get(transaction.product_name) || 0
      productMap.set(transaction.product_name, currentAmount + (transaction.amount || 0))
    })

    const productData = Array.from(productMap.entries()).map(([name, valor]) => ({ name, valor }))
    return productData.sort((a, b) => b.valor - a.valor).slice(0, 5)
  }, [getFilteredTransactions, dateRange, selectedGateway])

  const prepareDailyPerformanceData = useMemo(() => {
    const dailyDataMap = new Map<string, { date: string; bruto: number; liquido: number }>()

    const today = endOfDay(new Date())
    const sevenDaysAgo = startOfDay(subDays(today, 6))

    let currentDate = new Date(sevenDaysAgo)
    while (currentDate <= today) {
      const dateStr = format(currentDate, "yyyy-MM-dd")
      dailyDataMap.set(dateStr, {
        date: format(currentDate, "dd/MM", { locale: ptBR }),
        bruto: 0,
        liquido: 0,
      })
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
    }

    const filteredTransactions = getFilteredTransactions({
      status: "completed",
      period: { from: sevenDaysAgo, to: today },
      gateway: selectedGateway === "all" ? undefined : selectedGateway,
    })

    filteredTransactions.forEach((transaction) => {
      try {
        let transactionDate
        if (transaction.created_at instanceof Date) transactionDate = transaction.created_at
        else if (typeof transaction.created_at === "string") transactionDate = new Date(transaction.created_at)
        else return
        if (isNaN(transactionDate.getTime())) return

        const dateStr = format(transactionDate, "yyyy-MM-dd")
        const formattedDate = format(transactionDate, "dd/MM", { locale: ptBR })

        const existingData = dailyDataMap.get(dateStr) || { date: formattedDate, bruto: 0, liquido: 0 }

        const amount = transaction.amount || 0
        const netAmount = transaction.net_amount || 0

        existingData.bruto += amount
        existingData.liquido += netAmount
        dailyDataMap.set(dateStr, existingData)
      } catch {}
    })

    const data = Array.from(dailyDataMap.values()).sort((a, b) => {
      const [dayA, monthA] = a.date.split("/").map(Number)
      const [dayB, monthB] = b.date.split("/").map(Number)
      const currentYear = new Date().getFullYear()
      const dateObjA = new Date(currentYear, monthA - 1, dayA)
      const dateObjB = new Date(currentYear, monthB - 1, dayB)
      return dateObjA.getTime() - dateObjB.getTime()
    })

    return data
  }, [selectedGateway, getFilteredTransactions])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const chartColors = ["#6B7280", "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#FF4500", "#00C2B2", "#96588A", "#32CD32", "#FF69B4"]

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        position: "right" as const,
        align: "center" as const,
        labels: { boxWidth: 12, padding: 15, font: { size: 12 } },
      },
      tooltip: { padding: 10, boxPadding: 5 },
    },
  }

  const renderCenterText = (chartId: string, totalValue: number) => {
    setTimeout(() => {
      const chart = document.getElementById(chartId)
      if (chart) {
        chart.style.position = "relative"
        const existingText = chart.querySelector(".donut-center-text")
        if (existingText) chart.removeChild(existingText)
        const centerTextDiv = document.createElement("div")
        centerTextDiv.className = "donut-center-text"
        centerTextDiv.style.position = "absolute"
        centerTextDiv.style.top = "50%"
        centerTextDiv.style.left = "40%"
        centerTextDiv.style.transform = "translate(-50%, -50%)"
        centerTextDiv.style.textAlign = "center"
        centerTextDiv.style.pointerEvents = "none"
        centerTextDiv.style.zIndex = "10"
        chart.appendChild(centerTextDiv)
      }
    }, 300)
  }

  useEffect(() => {
    const cleanup = setupAutoSync()
    const result = importToFinance()
    if (result.success && result.count > 0) {
      toast({
        title: "Sincronização automática",
        description: `${result.count} transações foram automaticamente importadas para o Financeiro.`,
      })
    }
    return cleanup
  }, [setupAutoSync, importToFinance, toast])

  useEffect(() => {
    const timer = setTimeout(() => {
      renderCenterText("gateway-distribution-chart", summary?.totalAmount || 0)
      const productData = prepareProductDistributionData
      const totalProductSales = productData.reduce((sum, p) => sum + p.valor, 0)
      renderCenterText("product-distribution-chart", totalProductSales)
    }, 500)
    return () => clearTimeout(timer)
  }, [summary, prepareProductDistributionData])

  const salesTarget = 100
  const revenueTarget = 20000
  const salesProgress = Math.min(100, (summary.totalTransactions / salesTarget) * 100)
  const revenueProgress = Math.min(100, (summary.totalAmount / revenueTarget) * 100)
  const newCustomersProgress = 78
  const conversionRateProgress = 63

  const getStatusText = (status: string) => {
    switch (status) {
      case "SUBSCRIBED":
        return "Tempo Real Ativo"
      case "CHANNEL_ERROR":
        return "Erro na Conexão"
      case "TIMED_OUT":
        return "Timeout"
      case "CLOSED":
        return "Desconectado"
      default:
        return "Conectando..."
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBSCRIBED":
        return "bg-green-500 animate-pulse"
      case "CHANNEL_ERROR":
      case "TIMED_OUT":
        return "bg-yellow-500"
      case "CLOSED":
        return "bg-red-500"
      default:
        return "bg-gray-500 animate-pulse"
    }
  }

  // 1) PREPARA OS DADOS + CAPTURA QUAIS GATEWAYS APARECERAM
const { chartData: revenueData, revenueGatewayKeys } = useMemo(() => {
  const dateMap = new Map<string, any>();
  const seenGateways = new Set<string>();

  const filtered = getFilteredTransactions({
    status: "completed",
    period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
    gateway: selectedGateway === "all" ? undefined : selectedGateway,
  });

  filtered.forEach((t) => {
    const createdAt =
      t.created_at instanceof Date ? t.created_at :
      typeof t.created_at === "string" ? new Date(t.created_at) :
      null;
    if (!createdAt || isNaN(createdAt.getTime())) return;

    const k = createdAt.toISOString().slice(0, 10);
    if (!dateMap.has(k)) {
      dateMap.set(k, { date: k, total: 0 });
    }

    const row = dateMap.get(k);
    const gw = t.gateway_id as string;
    const v = t.amount || 0;

    row.total += v;
    row[gw] = (row[gw] || 0) + v;

    if (v > 0) seenGateways.add(gw);
  });

  const sorted = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  ).map((d) => ({ ...d, date: format(new Date(d.date), "dd/MM", { locale: ptBR }) }));

  return { chartData: sorted, revenueGatewayKeys: seenGateways };
}, [getFilteredTransactions, dateRange, selectedGateway]);

// 2) MONTA AS CATEGORIAS DINÂMICAS
const revenueCategories = useMemo(() => {
  if (selectedGateway !== "all") return ["total", selectedGateway];

  const gwList = Array.from(revenueGatewayKeys);
  // se ninguém vendeu, mostra só "total"
  return gwList.length ? ["total", ...gwList] : ["total"];
}, [revenueGatewayKeys, selectedGateway]);

const gatewayDistributionData = useMemo(
  () => prepareGatewayDistributionData(),
  [prepareGatewayDistributionData]
);

const gatewayDistributionColors = useMemo(() => {
  const cols = gatewayDistributionData.map(
    (d) => colorByGatewayName[d.name] ?? "#6B7280"
  )
  // 👇 hack: se só tiver 1 gateway, duplica a cor
  if (cols.length === 1) {
    return [cols[0], cols[0]]
  }
  return cols
}, [gatewayDistributionData, colorByGatewayName])

// fora do JSX, acima do `return (...)`
const REFUSED_STATUSES = new Set([
  "refused",
  "rejected",
  "declined",
  "failed",
  "failed_payment",
  "payment_refused",
  "charge_refused",
])

const refusedUI = useMemo(() => {
  return transactions.filter((t) => {
    const st = String(t.status || "").toLowerCase()
    const ev = String(t.event_type || "").toLowerCase()

    const isRefused = REFUSED_STATUSES.has(st) || REFUSED_STATUSES.has(ev)

    const createdAt = t.created_at ? new Date(t.created_at) : null
    const inRange =
      !!createdAt &&
      (!dateRange?.from || createdAt >= dateRange.from) &&
      (!dateRange?.to || createdAt <= dateRange.to)

    const matchesGateway =
      selectedGateway === "all" || t.gateway_id === selectedGateway

    return isRefused && inRange && matchesGateway
  })
}, [transactions, dateRange, selectedGateway])

// Faturamento
const revenueChartData = useMemo(() => {
  return prepareGatewayDistributionData()
    .filter((d) => d.value > 0) // só gateways com receita
    .map((d) => ({
      name: d.name,
      Receita: d.value,
    }))
}, [prepareGatewayDistributionData])

// Transações
const countChartData = useMemo(() => {
  return prepareTransactionCountData()
    .filter((d) => d.count > 0) // só gateways com vendas
    .map((d) => ({
      name: d.name,
      "Transações": d.count,
    }))
}, [prepareTransactionCountData])

const countByGatewayName: Record<string, number> = Object.fromEntries(
  prepareTransactionCountData().map(d => [d.name, d.count])
)

const logoByGatewayName = useMemo(
  () => Object.fromEntries(gatewayConfigs.map(g => [g.name, g.logo] as const)),
  [gatewayConfigs]
)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Dashboard de Gateways</h1>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", getStatusColor(realtimeStatus))}></div>
            <span className="text-sm text-muted-foreground">{getStatusText(realtimeStatus)}</span>
          </div>
        </div>
        <p className="text-muted-foreground">
          Acompanhe seus principais indicadores de desempenho e resultados em tempo real.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">Máximo</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="custom_month">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === "custom_month" && (
            <div className="flex flex-wrap items-center gap-2">
              <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-[180px] justify-start text-left font-normal", !tempDateRange?.from && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempDateRange?.from ? format(tempDateRange.from, "dd/MM/yyyy", { locale: ptBR }) : "Data Inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tempDateRange?.from}
                    onSelect={(date) => setTempDateRange((prev) => ({ ...prev, from: date }))}
                    initialFocus
                    fromDate={new Date("2025-01-01")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-[180px] justify-start text-left font-normal", !tempDateRange?.to && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempDateRange?.to ? format(tempDateRange.to, "dd/MM/yyyy", { locale: ptBR }) : "Data Final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tempDateRange?.to}
                    onSelect={(date) => setTempDateRange((prev) => ({ ...prev, to: date }))}
                    initialFocus
                    fromDate={new Date("2025-01-01")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (validateDateRange(tempDateRange)) {
                      setDateRange(tempDateRange)
                      setIsStartDatePickerOpen(false)
                      setIsEndDatePickerOpen(false)
                    }
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          )}

          <Select
            value={selectedGateway}
            onValueChange={(value) => setSelectedGateway(value as PaymentGatewayType | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o gateway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gateways</SelectItem>
              {gatewayConfigs.map((gateway) => (
                <SelectItem key={gateway.id} value={gateway.id}>
                  {gateway.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Dialog open={isGatewayConfigOpen} onOpenChange={setIsGatewayConfigOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-xs sm:text-sm bg-transparent"
                onClick={() => setIsGatewayConfigOpen(true)}
              >
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Configurar Gateways</span>
                <span className="sm:hidden">Config</span>
              </Button>
            </DialogTrigger>

            {/* Mantém o mesmo tamanho de antes e remove o cabeçalho externo */}
            <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0">
              {/* Botão de fechar no canto superior direito */}
              <button
                onClick={() => setIsGatewayConfigOpen(false)}
                className="absolute right-3 top-3 rounded-md text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label="Fechar"
              >
                ✕
              </button>

              {/* Conteúdo direto (já tem título e descrição) */}
              <GatewayConfig />
            </DialogContent>
          </Dialog>


          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || transactionsLoading}
            className="text-xs sm:text-sm bg-transparent"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1 sm:mr-2", (isLoading || transactionsLoading) && "animate-spin")} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#7ece68ff" }}>
          <CardHeader className="pb-2">
            <CardDescription>Receita Total</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text-green">
              {formatCurrency(summary.netAmount + summary.totalFees)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Valor Bruto</div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#7ece68ff" }}>
          <CardHeader className="pb-2">
            <CardDescription>Vendas</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text-green">{summary.totalTransactions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Dados reais de vendas</div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#bf8c35ff" }}>
          <CardHeader className="pb-2">
            <CardDescription>Taxas</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text-green">{formatCurrency(summary.totalFees)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center">
              {summary.totalAmount > 0 ? ((summary.totalFees / summary.totalAmount) * 100).toFixed(2) : "0.00"}% do faturamento
            </div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#7ece68ff" }}>
          <CardHeader className="pb-2">
            <CardDescription>Valor Líquido</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text">{formatCurrency(summary.netAmount)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Valor líquido real</div>
          </CardContent>
        </Card>

        {/* ✅ CARD ATUALIZADO: usa refusedTransactions e refusedAmount do summary */}
        <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#bf8c35ff" }}>
          <CardHeader className="pb-2">
            <CardDescription>Vendas Não Concluídas</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text">
              {formatCurrency((summary.abandonedAmount ?? 0) + (summary.refusedAmount ?? 0))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex flex-col gap-2">
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                <span>{summary.totalAbandonedTransactions ?? 0} vendas abandonadas</span>
              </div>
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                <span>{summary.refusedTransactions ?? 0} vendas recusadas</span>
              </div>
              <div className="mt-2">
                {summary.totalTransactions > 0 ? (
                  <span>
                    {(
                      (((summary.totalAbandonedTransactions ?? 0) + (summary.refusedTransactions ?? 0)) /
                        summary.totalTransactions) *
                      100
                    ).toFixed(2)}
                    % de vendas não concluídas
                  </span>
                ) : (
                  <span>0% de vendas não concluídas</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#bf8c35ff" }}>
          <CardHeader className="pb-2">
            <CardDescription>Reembolsos</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text">
              {formatCurrency(summary.refundedAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex flex-col">
              <div className="flex items-center mb-1">
                <Undo2 className="h-4 w-4 mr-1 text-red-500" />
                {summary.totalRefunds} Reembolsos
              </div>
              <div>
                {summary.totalTransactions > 0
                  ? `${((summary.totalRefunds / summary.totalTransactions) * 100).toFixed(1)}% de reembolsos`
                  : "0% de reembolsos"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#bf8c35ff" }}>
          <CardHeader className="pb-2">
            <CardDescription>Chargebacks</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text">
              {formatCurrency(summary.chargebackAmount || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex flex-col">
              <div className="flex items-center mb-1">
                <TrendingDown className="h-4 w-4 mr-1 text-orange-500" />
                {summary.totalChargebacks || 0} Chargebacks
              </div>
              <div>
                {summary.totalTransactions > 0
                  ? `${(((summary.totalChargebacks || 0) / summary.totalTransactions) * 100).toFixed(1)}% de chargebacks`
                  : "0% de chargebacks"}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#bf8c35ff" }}>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Aprovação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cartão</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-300"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 10}`}
                        strokeDashoffset={`${2 * Math.PI * 10 * (1 - (summary.approvalRates?.cartao || 0) / 100)}`}
                        className="text-blue-500 transition-all duration-300"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">
                    {summary.approvalRates?.cartao ? `${summary.approvalRates.cartao.toFixed(1)}%` : "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pix</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-300"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 10}`}
                        strokeDashoffset={`${2 * Math.PI * 10 * (1 - (summary.approvalRates?.pix || 0) / 100)}`}
                        className="text-blue-500 transition-all duration-300"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">
                    {summary.approvalRates?.pix ? `${summary.approvalRates.pix.toFixed(1)}%` : "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Boleto</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-300"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 10}`}
                        strokeDashoffset={`${2 * Math.PI * 10 * (1 - (summary.approvalRates?.boleto || 0) / 100)}`}
                        className="text-blue-500 transition-all duration-300"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">
                    {summary.approvalRates?.boleto ? `${summary.approvalRates.boleto.toFixed(1)}%` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full min-w-max">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="gateways">Gateways</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="transactions">Pagos</TabsTrigger>
              <TabsTrigger value="abandoned">Não Concluídas</TabsTrigger>
              <TabsTrigger value="refunds">Reembolsos</TabsTrigger>
              <TabsTrigger value="chargebacks">Chargebacks</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#2a71b8ff" }}>
                <CardHeader>
                  <CardTitle>Receita ao Longo do Tempo</CardTitle>
                  <CardDescription>Evolução da receita no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] sm:h-[350px] mx-auto w-full">
                    <LineChart
                      data={revenueData}
                      index="date"
                      categories={revenueCategories}
                      colors={revenueCategories.map((c) => {
                          if (c === "total") return "#f8b600ff"
                          const gw = gatewayConfigs.find((g) => g.id === c)
                          return gw?.color || "#ccc" // cor definida no gatewayConfigs
                        })}
                      valueFormatter={(v) => formatCurrency(v)}
                      className="h-full w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#b300ffff" }}>
                <CardHeader>
                  <CardTitle>Distribuição por Gateway</CardTitle>
                  <CardDescription>Participação de cada gateway no faturamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[300px] sm:h-[350px] relative" id="gateway-distribution-chart">
                    <DonutChart
                      data={prepareGatewayDistributionData()}
                      index="name"
                      category="value"
                      valueFormatter={(value) => formatCurrency(value)}
                      colors={gatewayDistributionColors}
                      className="h-full w-full"
                      options={donutOptions}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <Card
                className="neon-card neon-top md:col-span-2"
                style={{ ["--gw" as any]: "#10B981" }}
              >
                <CardHeader>
                  <CardTitle>Desempenho Diário</CardTitle>
                  <CardDescription>Faturamento dos últimos 7 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] sm:h-[350px] mx-auto w-full">
                    <BarChart
                      data={prepareDailyPerformanceData}
                      index="date"
                      categories={["bruto", "liquido"]}
                      colors={revenueCategories.map((c) => {
                          if (c === "total") return "#f8b600ff"
                          const gw = gatewayConfigs.find((g) => g.id === c)
                          return gw?.color || "#ccc" // cor definida no gatewayConfigs
                        })}
                      valueFormatter={(value) => formatCurrency(value)}
                      className="h-full w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#bf8c35ff" }}>
                <CardHeader>
                  <CardTitle>Metas do Período</CardTitle>
                  <CardDescription>Progresso em relação às metas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.totalTransactions > 0 || summary.totalAmount > 0 ? (
                    <>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Vendas</span>
                          <span>{salesProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${salesProgress}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Receita</span>
                          <span>{revenueProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${revenueProgress}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Novos Clientes</span>
                          <span>{newCustomersProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${newCustomersProgress}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Taxa de Conversão</span>
                          <span>{conversionRateProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-violet-600 h-2 rounded-full" style={{ width: `${conversionRateProgress}%` }}></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum dado de vendas disponível para calcular metas.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gateways" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="neon-card neon-top md:col-span-1" style={{ ["--gw" as any]: "#2a71b8ff" }}>
                <CardHeader>
                  <CardTitle>Desempenho por Gateway</CardTitle>
                  <CardDescription>Comparativo de faturamento por gateway</CardDescription>
                </CardHeader>
                <CardContent className="h-[380px] sm:h-[420px] lg:h-[250px]">
                  <BarChart
                    data={revenueChartData}
                    index="name"
                    categories={["Receita"]}
                    showLegend={false}
                    valueFormatter={(v) => formatCurrency(Number(v))}
                    colorsByLabel={colorByGatewayName}
                    className="!h-full w-full"
                  />

                </CardContent>
              </Card>
              <Card className="neon-card neon-top md:col-span-1" style={{ ["--gw" as any]: "#b300ff" }}>
                <CardHeader>
                  <CardTitle>Transações por Gateway</CardTitle>
                  <CardDescription>Número de transações por gateway</CardDescription>
                </CardHeader>
                <CardContent className="h-[380px] sm:h-[420px] lg:h-[250px]">
                  <BarChart
                    data={countChartData}
                    index="name"
                    categories={["Transações"]}
                    showLegend={false}
                    valueFormatter={(v) => `${Number(v)} transações`}
                    colorsByLabel={colorByGatewayName}
                    className="!h-full w-full"
                  />

                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
              {prepareGatewayDistributionData().map((gateway) => {
                const color  = colorByGatewayName[gateway.name] ?? "#6B7280"
                const logo   = logoByGatewayName[gateway.name]   // ex.: /images/gateway-logos/kirvano.png
                const txCount = countByGatewayName[gateway.name] ?? 0

                return (
                  <Card
                    key={gateway.name}
                    className="neon-card neon-top"
                    data-gw
                    style={{ ["--gw" as any]: color }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {logo ? (
                          // se não usa next/image, esse <img> está ok
                          <img
                            src={logo}
                            alt={`${gateway.name} logo`}
                            className="h-5 w-5 rounded-[4px] object-contain"
                            width={20}
                            height={20}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                          />
                        ) : null}
                        <CardDescription className="!mt-0">{gateway.name}</CardDescription>
                      </div>

                      {/* valor sempre branco */}
                      <CardTitle className="text-white">{formatCurrency(gateway.value)}</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transações:</span>
                          <span className="font-medium">{txCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxas:</span>
                          <span className="font-medium">{formatCurrency(gateway.value * 0.05)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Líquido:</span>
                          <span className="font-medium">{formatCurrency(gateway.value * 0.95)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#b9a210ff" }}>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>Top produtos por faturamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-[350px] mx-auto w-full">
                  <BarChart
                    data={prepareProductDistributionData}
                    index="name"
                    categories={["valor"]}
                    colors={["#F59E0B"]}
                    valueFormatter={(value) => formatCurrency(value)}
                    className="h-full w-full"
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#46f140ff" }}>
              <CardHeader>
                <CardTitle>Distribuição de Vendas</CardTitle>
                <CardDescription>Vendas por produto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[350px] relative" id="product-distribution-chart">
                  <DonutChart
                    data={prepareProductDistributionData}
                    index="name"
                    category="valor"
                    valueFormatter={(value) => formatCurrency(value)}
                    colors={["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EC4899"]}
                    className="h-full w-full"
                    options={donutOptions}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#2a71b8ff" }}>
              <CardHeader>
                <CardTitle>Últimas Transações</CardTitle>
                <CardDescription>Transações mais recentes de todos os gateways</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  <div className="space-y-4">
                    {getFilteredTransactions({
                      status: "completed",
                      gateway: selectedGateway === "all" ? undefined : selectedGateway,
                      period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
                    }).map((transaction, index) => {
                      const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id)
                      return (
                        <div key={index} className="block border rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{transaction.product_name}</div>
                            <div className="font-bold">{formatCurrency(transaction.amount)}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className="text-muted-foreground">Data:</div>
                            <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>
                            <div className="text-muted-foreground">Cliente:</div>
                            <div>{transaction.customer_name}</div>
                            <div className="text-muted-foreground">Email:</div>
                            <div>{transaction.customer_email || "N/A"}</div>
                            <div className="text-muted-foreground">Telefone:</div>
                            <div className="flex items-center gap-2">
                              <div>{transaction.customer_phone || "N/A"}</div>
                              {transaction.customer_phone && (
                                <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                                  <a
                                    href={getWhatsAppLink(transaction.customer_phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Enviar mensagem no WhatsApp"
                                  >
                                    <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="currentColor"
  viewBox="0 0 24 24"
  className="h-4 w-4 text-green-500"
>
  <path d="M20.52 3.48A11.8 11.8 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 6L0 24l6.25-1.64A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.84 0-3.62-.5-5.18-1.45l-.37-.22-3.72.97.99-3.63-.24-.37A9.99 9.99 0 0 1 2 12c0-5.53 4.47-10 10-10s10 4.47 10 10-4.47 10-10 10zm5.03-7.28c-.28-.14-1.65-.82-1.9-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.91 1.11-.17.19-.34.21-.62.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.31.42-.47.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36s-1 1-1 2.43 1.03 2.82 1.17 3.02c.14.19 2.03 3.1 4.93 4.34.69.3 1.23.48 1.65.61.69.22 1.31.19 1.8.12.55-.08 1.65-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.55-.33z" />
</svg>

                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                              <span className="inline-flex items-center">
                                {gateway?.logo ? (
                                  <img
                                    src={gateway.logo}
                                    alt={`${gateway.name} logo`}
                                    className="h-4 w-4 mr-1 rounded-sm object-contain"
                                  />
                                ) : (
                                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: gateway?.color || "#ccc" }}></span>
                                )}
                                {gateway?.name || transaction.gateway_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refunds" className="space-y-6">
            <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#ff00e6ff" }}>
              <CardHeader>
                <CardTitle>Últimos Reembolsos</CardTitle>
                <CardDescription>Reembolsos mais recentes de todos os gateways</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  <div className="space-y-4">
                    {getFilteredTransactions({
                      status: "refunded",
                      gateway: selectedGateway === "all" ? undefined : selectedGateway,
                      period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
                    }).map((transaction, index) => {
                      const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id)
                      return (
                        <div key={index} className="block border rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{transaction.product_name}</div>
                            <div className="font-bold">{formatCurrency(transaction.amount)}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className="text-muted-foreground">Data:</div>
                            <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>
                            <div className="text-muted-foreground">Cliente:</div>
                            <div>{transaction.customer_name}</div>
                            <div className="text-muted-foreground">Email:</div>
                            <div>{transaction.customer_email}</div>
                            <div className="text-muted-foreground">Telefone:</div>
                            <div className="flex items-center gap-2">
                              <div>{transaction.customer_phone || "N/A"}</div>
                              {transaction.customer_phone && (
                                <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                                  <a
                                    href={getWhatsAppLink(transaction.customer_phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Enviar mensagem no WhatsApp"
                                  >
                                    <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="currentColor"
  viewBox="0 0 24 24"
  className="h-4 w-4 text-green-500"
>
  <path d="M20.52 3.48A11.8 11.8 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 6L0 24l6.25-1.64A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.84 0-3.62-.5-5.18-1.45l-.37-.22-3.72.97.99-3.63-.24-.37A9.99 9.99 0 0 1 2 12c0-5.53 4.47-10 10-10s10 4.47 10 10-4.47 10-10 10zm5.03-7.28c-.28-.14-1.65-.82-1.9-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.91 1.11-.17.19-.34.21-.62.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.31.42-.47.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36s-1 1-1 2.43 1.03 2.82 1.17 3.02c.14.19 2.03 3.1 4.93 4.34.69.3 1.23.48 1.65.61.69.22 1.31.19 1.8.12.55-.08 1.65-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.55-.33z" />
</svg>

                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                              <span className="inline-flex items-center">
                                {gateway?.logo ? (
                                  <img
                                    src={gateway.logo}
                                    alt={`${gateway.name} logo`}
                                    className="h-4 w-4 mr-1 rounded-sm object-contain"
                                  />
                                ) : (
                                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: gateway?.color || "#ccc" }}></span>
                                )}
                                {gateway?.name || transaction.gateway_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abandoned" className="space-y-6">
            <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#ff0000ff" }}>
              <CardHeader>
                <CardTitle>Vendas Abandonadas e Recusadas</CardTitle>
                <CardDescription>Transações de checkout Abandonado e Recusado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">

                  {/* --- ABANDONADAS --- */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-muted-foreground">
                      Abandonadas ({summary.totalAbandonedTransactions ?? 0})
                    </div>

                    {getFilteredTransactions({
                      status: "abandoned",
                      gateway: selectedGateway === "all" ? undefined : selectedGateway,
                      period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
                    }).map((transaction, index) => {
                      const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id)
                      return (
                        <div key={`ab-${index}`} className="block border rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{transaction.product_name}</div>
                            <div className="font-bold">
                              {formatCurrency(transaction.product_price ?? transaction.amount ?? 0)}
                            </div>
                         </div>

                          <div className="grid grid-cols-[max-content,1fr] gap-y-2 gap-x-3 text-sm leading-6 items-baseline">
                            <div className="text-muted-foreground">Data:</div>
                            <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>

                            <div className="text-muted-foreground">Cliente:</div>
                            <div>{transaction.customer_name}</div>

                            <div className="text-muted-foreground">Email:</div>
                            <div>{transaction.customer_email}</div>
                            <div className="text-muted-foreground">Telefone:</div>
                            <div className="flex items-center gap-2">
                                <div>{transaction.customer_phone || "N/A"}</div>
                                {transaction.customer_phone && (
                                  <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                                    <a
                                      href={getWhatsAppLink(transaction.customer_phone)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label="Enviar mensagem no WhatsApp"
                                    >
                                      <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="currentColor"
  viewBox="0 0 24 24"
  className="h-4 w-4 text-green-500"
>
  <path d="M20.52 3.48A11.8 11.8 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 6L0 24l6.25-1.64A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.84 0-3.62-.5-5.18-1.45l-.37-.22-3.72.97.99-3.63-.24-.37A9.99 9.99 0 0 1 2 12c0-5.53 4.47-10 10-10s10 4.47 10 10-4.47 10-10 10zm5.03-7.28c-.28-.14-1.65-.82-1.9-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.91 1.11-.17.19-.34.21-.62.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.31.42-.47.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36s-1 1-1 2.43 1.03 2.82 1.17 3.02c.14.19 2.03 3.1 4.93 4.34.69.3 1.23.48 1.65.61.69.22 1.31.19 1.8.12.55-.08 1.65-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.55-.33z" />
</svg>

                                    </a>
                                  </Button>
                                )}
                              </div>
                              <div className="text-muted-foreground">Pagamento:</div>
                              <div>{getPaymentLabel(transaction.payment_method)}</div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                             <span className="inline-flex items-center">
                                {gateway?.logo ? (
                                  <img
                                    src={gateway.logo}
                                    alt={`${gateway.name} logo`}
                                    className="h-4 w-4 mr-1 rounded-sm object-contain"
                                  />
                                ) : (
                                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: gateway?.color || "#ccc" }}></span>
                                )}
                                {gateway?.name || transaction.gateway_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* --- RECUSADAS --- */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-muted-foreground">
                      Recusadas ({refusedUI.length})
                    </div>

                    {refusedUI.map((transaction, index) => {
                      const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id)

                      return (
                        <div key={`rf-${index}`} className="block border rounded-md p-3">
                            <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{transaction.product_name}</div>
                            <div className="font-bold">
                             {formatCurrency(transaction.amount ?? transaction.product_price ?? 0)}
                            </div>
                          </div>

                          <div className="grid grid-cols-[max-content,1fr] gap-y-2 gap-x-3 text-sm leading-6 items-baseline">
                            <div className="text-muted-foreground">Data:</div>
                            <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>

                            <div className="text-muted-foreground">Cliente:</div>
                            <div>{transaction.customer_name}</div>

                            <div className="text-muted-foreground">Email:</div>
                            <div>{transaction.customer_email || "N/A"}</div>

                           <div className="text-muted-foreground">Telefone:</div>
                            <div className="flex items-center gap-2">
                              <div>{transaction.customer_phone || "N/A"}</div>
                              {transaction.customer_phone && (
                                <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                                  <a
                                    href={getWhatsAppLink(transaction.customer_phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Enviar mensagem no WhatsApp"
                                  >
                                    <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="currentColor"
  viewBox="0 0 24 24"
  className="h-4 w-4 text-green-500"
>
  <path d="M20.52 3.48A11.8 11.8 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 6L0 24l6.25-1.64A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.84 0-3.62-.5-5.18-1.45l-.37-.22-3.72.97.99-3.63-.24-.37A9.99 9.99 0 0 1 2 12c0-5.53 4.47-10 10-10s10 4.47 10 10-4.47 10-10 10zm5.03-7.28c-.28-.14-1.65-.82-1.9-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.91 1.11-.17.19-.34.21-.62.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.31.42-.47.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36s-1 1-1 2.43 1.03 2.82 1.17 3.02c.14.19 2.03 3.1 4.93 4.34.69.3 1.23.48 1.65.61.69.22 1.31.19 1.8.12.55-.08 1.65-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.55-.33z" />
</svg>

                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="text-muted-foreground">Pagamento:</div>
                            <div>{getPaymentLabel(transaction.payment_method)}</div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                              <span className="inline-flex items-center">
                                {gateway?.logo ? (
                                  <img
                                    src={gateway.logo}
                                    alt={`${gateway.name} logo`}
                                    className="h-4 w-4 mr-1 rounded-sm object-contain"
                                  />
                                ) : (
                                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: gateway?.color || "#ccc" }}></span>
                                )}
                                {gateway?.name || transaction.gateway_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="chargebacks" className="space-y-6">
            <Card className="neon-card neon-top" style={{ ["--gw" as any]: "#ff6e00ff" }}>
              <CardHeader>
                <CardTitle>Últimos Chargebacks</CardTitle>
                <CardDescription>Chargebacks mais recentes de todos os gateways</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  <div className="space-y-4">
                    {getFilteredTransactions({
                      status: "chargeback",
                      gateway: selectedGateway === "all" ? undefined : selectedGateway,
                      period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
                    }).map((transaction, index) => {
                      const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id)
                      return (
                        <div key={index} className="block border rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{transaction.product_name}</div>
                            <div className="font-bold">{formatCurrency(transaction.amount || 0)}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className="text-muted-foreground">Data:</div>
                            <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>
                            <div className="text-muted-foreground">Cliente:</div>
                            <div>{transaction.customer_name}</div>
                            <div className="text-muted-foreground">Email:</div>
                            <div>{transaction.customer_email}</div>
                            <div className="text-muted-foreground">Telefone:</div>
                            <div className="flex items-center gap-2">
                              <div>{transaction.customer_phone || "N/A"}</div>
                              {transaction.customer_phone && (
                                <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                                  <a
                                    href={getWhatsAppLink(transaction.customer_phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Enviar mensagem no WhatsApp"
                                  >
                                    <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="currentColor"
  viewBox="0 0 24 24"
  className="h-4 w-4 text-green-500"
>
  <path d="M20.52 3.48A11.8 11.8 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 6L0 24l6.25-1.64A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.84 0-3.62-.5-5.18-1.45l-.37-.22-3.72.97.99-3.63-.24-.37A9.99 9.99 0 0 1 2 12c0-5.53 4.47-10 10-10s10 4.47 10 10-4.47 10-10 10zm5.03-7.28c-.28-.14-1.65-.82-1.9-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.91 1.11-.17.19-.34.21-.62.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.31.42-.47.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36s-1 1-1 2.43 1.03 2.82 1.17 3.02c.14.19 2.03 3.1 4.93 4.34.69.3 1.23.48 1.65.61.69.22 1.31.19 1.8.12.55-.08 1.65-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.55-.33z" />
</svg>

                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                              <span className="inline-flex items-center">
                                {gateway?.logo ? (
                                  <img
                                    src={gateway.logo}
                                    alt={`${gateway.name} logo`}
                                    className="h-4 w-4 mr-1 rounded-sm object-contain"
                                  />
                                ) : (
                                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: gateway?.color || "#ccc" }}></span>
                                )}
                                {gateway?.name || transaction.gateway_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}