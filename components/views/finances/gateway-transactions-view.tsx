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
  MessageSquare,
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
    { id: "kirvano", name: "Kirvano", color: "#6B7280" },
    { id: "cakto", name: "Cakto", color: "#4F46E5" },
    { id: "kiwify", name: "Kiwify", color: "#10B981" },
    { id: "hotmart", name: "Hotmart", color: "#FF6B00" },
    { id: "monetizze", name: "Monetizze", color: "#FFD700" },
    { id: "eduzz", name: "Eduzz", color: "#8A2BE2" },
    { id: "pepper", name: "Pepper", color: "#FF4500" },
    { id: "braip", name: "Braip", color: "#00CED1" },
    { id: "lastlink", name: "Lastlink", color: "#DA70D6" },
    { id: "disrupty", name: "Disrupty", color: "#ADFF2F" },
    { id: "perfectpay", name: "PerfectPay", color: "#FF6347" },
    { id: "goatpay", name: "Goatpay", color: "#4682B4" },
    { id: "tribopay", name: "Tribopay", color: "#20B2AA" },
    { id: "nuvemshop", name: "Nuvemshop", color: "#00C2B2" }, // Novo gateway
    { id: "woocommerce", name: "WooCommerce", color: "#96588A" }, // Novo gateway
    { id: "loja_integrada", name: "Loja Integrada", color: "#32CD32" }, // Novo gateway
    { id: "cartpanda", name: "Cartpanda", color: "#FF69B4" }, // Novo gateway
  ]

  // Função para calcular o valor líquido real do Supabase
  const calculateNetAmountFromSupabase = useCallback(
    (period: { from: Date; to: Date }) => {
      const completedTransactions = getFilteredTransactions({
        status: "completed",
        period,
        gateway: selectedGateway === "all" ? undefined : selectedGateway,
      })

      // Soma apenas a coluna net_amount das transações completed
      const totalNetAmount = completedTransactions.reduce((sum, transaction) => {
        return sum + (transaction.net_amount || 0)
      }, 0)

      console.log("🔍 Calculando Valor Líquido do Supabase:")
      console.log("- Transações completed encontradas:", completedTransactions.length)
      console.log("- Valor líquido total (net_amount):", totalNetAmount)

      return totalNetAmount
    },
    [getFilteredTransactions, selectedGateway],
  )

  // Função para obter resumo consolidado
  const getConsolidatedSummary = (period: { from: Date; to: Date }) => {
    const stats = getStats({ period, gateway: selectedGateway === "all" ? undefined : selectedGateway })

    // Calcula o valor líquido real do Supabase
    const realNetAmount = calculateNetAmountFromSupabase(period)

    // Calcula vendas abandonadas diretamente das transações filtradas
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
    if (abandonedTransactions.length > 0) {
      console.log("Primeira transação abandonada (amostra):", abandonedTransactions[0])
      console.log("product_price da primeira transação:", abandonedTransactions[0]?.product_price)
    } else {
      console.log(
        "Nenhuma transação de 'checkout_abandonment' ou 'abandoned' encontrada para o período/gateway selecionado.",
      )
    }
    console.log("-------------------------------")

    // Calcula chargebacks diretamente das transações filtradas
    const chargebackTransactions = transactions.filter((t) => {
      const isChargeback = t.event_type === "chargeback" || t.status === "chargeback"
      const createdAtDate = t.created_at ? new Date(t.created_at) : null
      const inDateRange =
        createdAtDate && (!period?.from || createdAtDate >= period.from) && (!period?.to || createdAtDate <= period.to)
      const matchesGateway = selectedGateway === "all" || t.gateway_id === selectedGateway
      return isChargeback && inDateRange && matchesGateway
    })

    // Calcula taxas de aprovação por método de pagamento
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
      totalAmount: stats.totalRevenue,
      totalTransactions: stats.totalTransactions,
      totalFees: stats.totalFees,
      netAmount: realNetAmount, // Usando o valor líquido real do Supabase
      uncompletedSalesAmount: stats.pendingAmount + stats.failedAmount,
      totalAbandonedTransactions: abandonedTransactions.length,
      abandonedAmount: abandonedTransactions.reduce((sum, t) => sum + Number(t.product_price || 0), 0),
      totalRefunds: stats.totalRefunds,
      refundedAmount: stats.refundedAmount,
      totalChargebacks: chargebackTransactions.length,
      chargebackAmount: chargebackTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),
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
          netAmount: gatewayNetAmount, // Usando net_amount real para cada gateway
          dailySummaries: [],
        }
      }),
    }
  }

  // Funções simplificadas para compatibilidade
  const importToFinance = () => ({ success: true, count: 0, total: 0 })
  const setupAutoSync = () => () => {}

  const [summary, setSummary] = useState(() => {
    if (dateRange?.from && dateRange?.to) {
      return getConsolidatedSummary({ from: dateRange.from, to: dateRange.to })
    }
    return {
      totalAmount: 0,
      totalTransactions: 0,
      totalFees: 0,
      netAmount: 0,
      gatewaySummaries: [],
      uncompletedSalesAmount: 0,
      totalAbandonedTransactions: 0,
      abandonedAmount: 0,
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

  // Função para validar o intervalo de datas
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

  // Atualizar o resumo quando o período, gateway selecionado ou transações mudarem
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
        fromDate = new Date("1900-01-01") // Data muito anterior para garantir que pegue todos os dados
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
        break
      case "90d":
        fromDate = subDays(today, 89)
        toDate = endOfDay(today)
        break
      case "1y":
        fromDate = subMonths(today, 11)
        toDate = endOfDay(today)
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

  // Helper function to format phone number for WhatsApp link
  const getWhatsAppLink = (phone: string | null | undefined) => {
    if (!phone) return "#"
    // Remove all non-numeric characters
    const cleanedPhone = phone.replace(/\D/g, "")
    // Assuming Brazilian numbers, prepend 55 if not already present
    const formattedPhone = cleanedPhone.startsWith("55") ? cleanedPhone : `55${cleanedPhone}`
    return `https://wa.me/${formattedPhone}`
  }

  // Preparar dados para os gráficos
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
      } catch (error) {
        console.warn("[REVENUE_DATA] Erro ao processar data:", error, transaction)
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
          nuvemshop: 0, // Novo gateway
          woocommerce: 0, // Novo gateway
          loja_integrada: 0, // Novo gateway
          cartpanda: 0, // Novo gateway
        })
      }

      const entry = dateMap.get(date)
      entry.total += transaction.amount || 0
      entry[transaction.gateway_id] = (entry[transaction.gateway_id] || 0) + (transaction.amount || 0)
    })

    const chartData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    console.log("[REVENUE_DATA] Dados do gráfico preparados:", chartData.length, "pontos")

    if (chartData.length === 0) {
      return []
    }

    return chartData.map((item) => ({
      ...item,
      date: format(new Date(item.date), "dd/MM", { locale: ptBR }),
    }))
  }, [getFilteredTransactions, dateRange, selectedGateway])

  const prepareGatewayDistributionData = useCallback(() => {
    if (!summary || !summary.gatewaySummaries || summary.gatewaySummaries.length === 0) {
      return []
    }

    return summary.gatewaySummaries.map((gateway) => ({
      name: gatewayConfigs.find((gc) => gc.id === gateway.gatewayId)?.name || gateway.gatewayId,
      value: gateway.totalAmount,
    }))
  }, [summary, gatewayConfigs])

  const prepareTransactionCountData = useCallback(() => {
    if (!summary || !summary.gatewaySummaries || summary.gatewaySummaries.length === 0) {
      return []
    }

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
        if (transaction.created_at instanceof Date) {
          transactionDate = transaction.created_at
        } else if (typeof transaction.created_at === "string") {
          transactionDate = new Date(transaction.created_at)
        } else {
          return
        }

        if (isNaN(transactionDate.getTime())) {
          return
        }

        const dateStr = format(transactionDate, "yyyy-MM-dd")
        const formattedDate = format(transactionDate, "dd/MM", { locale: ptBR })

        const existingData = dailyDataMap.get(dateStr) || {
          date: formattedDate,
          bruto: 0,
          liquido: 0,
        }

        const amount = transaction.amount || 0
        const netAmount = transaction.net_amount || 0 // Usando net_amount do Supabase

        existingData.bruto += amount
        existingData.liquido += netAmount // Usando net_amount real
        dailyDataMap.set(dateStr, existingData)
      } catch (error) {
        console.warn("[DAILY_PERFORMANCE] Erro ao processar transação:", error, transaction)
      }
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

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Cores fixas para os gráficos
  const chartColors = [
    "#6B7280",
    "#4F46E5",
    "#0EA5E9",
    "#10B981",
    "#F59E0B",
    "#FF4500",
    "#00C2B2",
    "#96588A",
    "#32CD32",
    "#FF69B4",
  ] // Adicionado cores para os novos gateways

  // Opções específicas para o gráfico de donut
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        position: "right" as const,
        align: "center" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        padding: 10,
        boxPadding: 5,
      },
    },
  }

  // Função para renderizar o valor total no centro do gráfico de donut
  const renderCenterText = (chartId: string, totalValue: number) => {
    setTimeout(() => {
      const chart = document.getElementById(chartId)
      if (chart) {
        chart.style.position = "relative"

        const centerTextDiv = document.createElement("div")
        centerTextDiv.style.position = "absolute"
        centerTextDiv.style.top = "50%"
        centerTextDiv.style.left = "40%"
        centerTextDiv.style.transform = "translate(-50%, -50%)"
        centerTextDiv.style.textAlign = "center"
        centerTextDiv.style.pointerEvents = "none"
        centerTextDiv.style.zIndex = "10"

        const totalLabel = document.createElement("div")
        totalLabel.textContent = "Total"
        totalLabel.style.fontSize = "14px"
        totalLabel.style.color = "#6B7280"
        totalLabel.style.fontWeight = "500"

        const totalAmount = document.createElement("div")
        totalAmount.textContent = formatCurrency(totalValue)
        totalAmount.style.fontSize = "18px"
        totalAmount.style.fontWeight = "bold"
        totalAmount.style.marginTop = "4px"

        const existingText = chart.querySelector(".donut-center-text")
        if (existingText) {
          chart.removeChild(existingText)
        }

        centerTextDiv.className = "donut-center-text"
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
      if (summary && summary.totalAmount > 0) {
        renderCenterText("gateway-distribution-chart", summary.totalAmount)
      } else {
        renderCenterText("gateway-distribution-chart", 0)
      }
      const productData = prepareProductDistributionData
      const totalProductSales = productData.reduce((sum, p) => sum + p.valor, 0)
      renderCenterText("product-distribution-chart", totalProductSales)
    }, 500)

    return () => clearTimeout(timer)
  }, [summary, prepareProductDistributionData])

  // Calcular progresso das metas
  const salesTarget = initialSalesTarget
  const revenueTarget = initialRevenueTarget

  const salesProgress = Math.min(100, (summary.totalTransactions / salesTarget) * 100)
  const revenueProgress = Math.min(100, (summary.totalAmount / revenueTarget) * 100)
  const newCustomersProgress = 78
  const conversionRateProgress = 63

  // Função para obter o texto do status
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

  // Função para obter a cor do status
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
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !tempDateRange?.from && "text-muted-foreground",
                    )}
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
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !tempDateRange?.to && "text-muted-foreground",
                    )}
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
            <DialogContent className="max-w-[95vw] sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Configuração de Gateways</DialogTitle>
                <DialogDescription>Configure as integrações com os gateways de pagamento.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <GatewayConfig />
              </div>
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Card className="neon-card neon-card-blue">
          <CardHeader className="pb-2">
            <CardDescription>Receita Total</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text-blue">
              {formatCurrency(summary.netAmount + summary.totalFees)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Valor Bruto</div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-card-purple">
          <CardHeader className="pb-2">
            <CardDescription>Vendas</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text-purple">{summary.totalTransactions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Dados reais de vendas</div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-card-amber">
          <CardHeader className="pb-2">
            <CardDescription>Taxas</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text-amber">{formatCurrency(summary.totalFees)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center">
              {summary.totalAmount > 0 ? ((summary.totalFees / summary.totalAmount) * 100).toFixed(2) : "0.00"}% do
              faturamento
            </div>
          </CardContent>
        </Card>
        <Card className="neon-card">
          <CardHeader className="pb-2">
            <CardDescription>Valor Líquido</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text">{formatCurrency(summary.netAmount)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Valor líquido real</div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-card-red">
          <CardHeader className="pb-2">
            <CardDescription>Vendas Não Concluídas</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-red-500">
              {formatCurrency(summary.abandonedAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex flex-col">
              <div className="flex items-center mb-1">
                <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                {summary.totalAbandonedTransactions} vendas abandonadas
              </div>
              <div>
                {summary.totalTransactions > 0
                  ? `${((summary.totalAbandonedTransactions / summary.totalTransactions) * 100).toFixed(1)}% das suas vendas`
                  : "0% de vendas abandonadas"}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-card-pink">
          <CardHeader className="pb-2">
            <CardDescription>Reembolsos</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-pink-500">
              {formatCurrency(summary.refundedAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex flex-col">
              <div className="flex items-center mb-1">
                <Undo2 className="h-4 w-4 mr-1 text-pink-500" />
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
        <Card className="neon-card neon-card-orange">
          <CardHeader className="pb-2">
            <CardDescription>Chargebacks</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-orange-500">
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
        <Card className="neon-card neon-card-green">
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
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="refunds">Reembolsos</TabsTrigger>
              <TabsTrigger value="abandoned">Abandonadas</TabsTrigger>
              <TabsTrigger value="chargebacks">Chargebacks</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="neon-card neon-card-blue">
                <CardHeader>
                  <CardTitle>Receita ao Longo do Tempo</CardTitle>
                  <CardDescription>Evolução da receita no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] sm:h-[350px] mx-auto w-full">
                    <LineChart
                      data={prepareRevenueData()}
                      index="date"
                      categories={
                        selectedGateway === "all"
                          ? [
                              "total",
                              "kirvano",
                              "cakto",
                              "kiwify",
                              "pepper",
                              "nuvemshop",
                              "woocommerce",
                              "loja_integrada",
                              "cartpanda",
                            ]
                          : ["total", selectedGateway]
                      }
                      colors={chartColors}
                      valueFormatter={(value) => formatCurrency(value)}
                      className="h-full w-full"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="neon-card neon-card-purple">
                <CardHeader>
                  <CardTitle>Distribuição por Gateway</CardTitle>
                  <CardDescription>Participação de cada gateway no faturamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex items-center justify-center h-[300px] sm:h-[350px] relative"
                    id="gateway-distribution-chart"
                  >
                    <DonutChart
                      data={prepareGatewayDistributionData()}
                      index="name"
                      category="value"
                      valueFormatter={(value) => formatCurrency(value)}
                      colors={chartColors.slice(1)}
                      className="h-full w-full"
                      options={donutOptions}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <Card className="neon-card neon-card-purple md:col-span-2">
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
                      colors={["#F59E0B", "#3B82F6"]}
                      valueFormatter={(value) => formatCurrency(value)}
                      className="h-full w-full"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="neon-card neon-card-amber">
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
                          <div
                            className="bg-amber-600 h-2 rounded-full"
                            style={{ width: `${newCustomersProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Taxa de Conversão</span>
                          <span>{conversionRateProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-violet-600 h-2 rounded-full"
                            style={{ width: `${conversionRateProgress}%` }}
                          ></div>
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
              <Card className="neon-card neon-card-blue">
                <CardHeader>
                  <CardTitle>Desempenho por Gateway</CardTitle>
                  <CardDescription>Comparativo de faturamento por gateway</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={prepareGatewayDistributionData()}
                    index="name"
                    categories={["value"]}
                    colors={["#3B82F6"]}
                    valueFormatter={(value) => formatCurrency(value)}
                    className="h-80"
                  />
                </CardContent>
              </Card>
              <Card className="neon-card neon-card-purple">
                <CardHeader>
                  <CardTitle>Transações por Gateway</CardTitle>
                  <CardDescription>Número de transações por gateway</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={prepareTransactionCountData()}
                    index="name"
                    categories={["count"]}
                    colors={["#8B5CF6"]}
                    valueFormatter={(value) => `${value} transações`}
                    className="h-80"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
              {prepareGatewayDistributionData().map((gateway, index) => {
                const neonClass =
                  index % 4 === 0
                    ? "neon-card"
                    : index % 4 === 1
                      ? "neon-card neon-card-blue"
                      : index % 4 === 2
                        ? "neon-card neon-card-purple"
                        : "neon-card neon-card-amber"
                const textClass =
                  index % 4 === 0
                    ? "neon-text"
                    : index % 4 === 1
                      ? "neon-text-blue"
                      : index % 4 === 2
                        ? "neon-text-purple"
                        : "neon-text-amber"

                return (
                  <Card key={index} className={neonClass}>
                    <CardHeader className="pb-2">
                      <CardDescription>{gateway.name}</CardDescription>
                      <CardTitle className={textClass}>{formatCurrency(gateway.value)}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transações:</span>
                          <span className="font-medium">{prepareTransactionCountData()[index]?.count || 0}</span>
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
            <Card className="neon-card neon-card-amber">
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
            <Card className="neon-card">
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
            <Card className="neon-card neon-card-blue">
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
                                    <MessageSquare className="h-4 w-4 text-green-500" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                              <span className="inline-flex items-center">
                                <span
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: gateway?.color || "#ccc" }}
                                ></span>
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
            <Card className="neon-card neon-card-pink">
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
                                    <MessageSquare className="h-4 w-4 text-green-500" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                              <span className="inline-flex items-center">
                                <span
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: gateway?.color || "#ccc" }}
                                ></span>
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
            <Card className="neon-card neon-card-red">
              <CardHeader>
                <CardTitle>Vendas Abandonadas</CardTitle>
                <CardDescription>Transações de checkout abandonadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  <div className="space-y-4">
                    {getFilteredTransactions({
                      status: "abandoned",
                      gateway: selectedGateway === "all" ? undefined : selectedGateway,
                      period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
                    }).map((transaction, index) => {
                      const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id)

                      console.log("--- Transação Abandonada (Frontend) ---")
                      console.log("Nome do Cliente:", transaction.customer_name)
                      console.log("Email do Cliente:", transaction.customer_email)
                      console.log("Nome do Produto:", transaction.product_name)
                      console.log("Telefone do Cliente:", transaction.customer_phone)
                      console.log("Gateway:", transaction.gateway_id)
                      console.log("Status Interno:", transaction.status)
                      console.log("Event Type Interno:", transaction.event_type)
                      console.log("-------------------------------------")

                      return (
                        <div key={index} className="block border rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{transaction.product_name}</div>
                            <div className="font-bold">{formatCurrency(transaction.product_price || 0)}</div>
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
                                    <MessageSquare className="h-4 w-4 text-green-500" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                              <span className="inline-flex items-center">
                                <span
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: gateway?.color || "#ccc" }}
                                ></span>
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
            <Card className="neon-card neon-card-orange">
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
                                    <MessageSquare className="h-4 w-4 text-green-500" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="text-muted-foreground">Gateway:</div>
                            <div>
                              <span className="inline-flex items-center">
                                <span
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: gateway?.color || "#ccc" }}
                                ></span>
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
