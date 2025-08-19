"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, DonutChart } from "@/components/ui/charts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Download, RefreshCw, Settings, ImportIcon as FileImport, TrendingDown } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  format,
  subDays,
  subMonths,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "date-fns"
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

interface ResultsDashboardViewProps {
  userName?: string
}

export default function ResultsDashboardView({ userName }: ResultsDashboardViewProps) {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: subDays(new Date(), 29), // Default para últimos 30 dias (inclusive)
    to: endOfDay(new Date()), // Default para o final do dia atual
  })
  const [selectedPeriod, setSelectedPeriod] = useState("30d") // Período padrão
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(isImporting)
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType | "all">("all")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isGatewayConfigOpen, setIsGatewayConfigOpen] = useState(false)

  const {
    transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
    getStats,
    getFilteredTransactions,
  } = useGatewayTransactions()

  // Configurações de gateway fixas para teste
  const gatewayConfigs = [
    { id: "cakto", name: "Cakto", color: "#3B82F6" },
    { id: "kirvano", name: "Kirvano", color: "#8B5CF6" },
    { id: "tibopay", name: "Tibopay", color: "#10B981" },
    { id: "kiwify", name: "Kiwify", color: "#F59E0B" },
  ]

  // Função para obter resumo consolidado
  const getConsolidatedSummary = (period: { from: Date; to: Date }) => {
    const stats = getStats({ period })
    return {
      totalAmount: stats.totalRevenue,
      totalTransactions: stats.totalTransactions,
      totalFees: stats.totalFees,
      netAmount: stats.netAmount,
      gatewaySummaries: gatewayConfigs.map((gateway) => {
        const gatewayTransactions = getFilteredTransactions({
          gateway: gateway.id as any,
          period,
          status: "completed",
        })
        const totalAmount = gatewayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        const totalFees = gatewayTransactions.reduce((sum, t) => sum + (t.fee || 0), 0)

        return {
          gatewayId: gateway.id,
          totalAmount,
          totalTransactions: gatewayTransactions.length,
          totalFees,
          netAmount: totalAmount - totalFees,
          dailySummaries: [],
        }
      }),
      abandonedAmount: stats.abandonedAmount,
    }
  }

  // Funções simplificadas para compatibilidade
  const importToFinance = () => ({ success: true, count: 0, total: 0 })
  const setupAutoSync = () => () => {}

  const [summary, setSummary] = useState(() => {
    if (dateRange.from && dateRange.to) {
      const currentSummary = getConsolidatedSummary({ from: dateRange.from, to: dateRange.to })
      const uncompletedSalesAmount = getFilteredTransactions({
        status: ["pending", "failed"],
        period: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
        gateway: selectedGateway === "all" ? undefined : selectedGateway,
      }).reduce((sum, t) => sum + (t.amount || 0), 0)

      return { ...currentSummary, uncompletedSalesAmount: uncompletedSalesAmount + currentSummary.abandonedAmount }
    }
    return {
      totalAmount: 0,
      totalTransactions: 0,
      totalFees: 0,
      netAmount: 0,
      gatewaySummaries: [],
      uncompletedSalesAmount: 0,
      abandonedAmount: 0,
    }
  })

  // Metas de exemplo
  const salesTarget = 100
  const revenueTarget = 20000

  // Função para validar o intervalo de datas (usada principalmente para "Personalizado")
  const validateDateRange = useCallback(
    (range: { from?: Date; to?: Date }) => {
      if (!range.from || !range.to) {
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

      // Esta verificação é especificamente para intervalos personalizados para evitar ranges excessivamente grandes
      // Para "Todo o Tempo", new Date(0) é esperado e não deve acionar isso.
      const oneYearAgo = subDays(new Date(), 365)
      if (isBefore(range.from, oneYearAgo) && selectedPeriod === "custom") {
        toast({
          title: "Intervalo muito grande",
          description: "Por favor, selecione um intervalo de no máximo 365 dias para períodos personalizados.",
          variant: "destructive",
        })
        return false
      }

      return true
    },
    [toast, selectedPeriod],
  )

  // Atualizar o resumo quando o período, gateway selecionado ou transações mudarem
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      // Para períodos predefinidos ou 'all_time', a validação é menos rigorosa ou não necessária.
      // Para 'custom', validateDateRange irá lidar com isso.
      const isValidRange = selectedPeriod === "custom" ? validateDateRange(dateRange) : true

      if (isValidRange) {
        const currentSummary = getConsolidatedSummary({ from: dateRange.from, to: dateRange.to })
        const uncompletedSalesAmount = getFilteredTransactions({
          status: ["pending", "failed"],
          period: { from: dateRange.from, to: dateRange.to },
          gateway: selectedGateway === "all" ? undefined : selectedGateway,
        }).reduce((sum, t) => sum + (t.amount || 0), 0)
        setSummary({
          ...currentSummary,
          uncompletedSalesAmount: uncompletedSalesAmount + currentSummary.abandonedAmount,
        })
      }
    }
  }, [dateRange, validateDateRange, getFilteredTransactions, selectedGateway, selectedPeriod, transactions])

  const handleRefresh = () => {
    setIsLoading(true)

    setTimeout(() => {
      if (dateRange.from && dateRange.to && validateDateRange(dateRange)) {
        const currentSummary = getConsolidatedSummary({ from: dateRange.from, to: dateRange.to })
        const uncompletedSalesAmount = getFilteredTransactions({
          status: ["pending", "failed"],
          period: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
          gateway: selectedGateway === "all" ? undefined : selectedGateway,
        }).reduce((sum, t) => sum + (t.amount || 0), 0)
        setSummary({
          ...currentSummary,
          uncompletedSalesAmount: uncompletedSalesAmount + currentSummary.abandonedAmount,
        })

        const result = importToFinance()
        if (result.success && result.count > 0) {
          toast({
            title: "Dados sincronizados com Financeiro",
            description: `${result.count} transações foram automaticamente atualizadas na aba Financeiro.`,
          })
        }
      }
      setIsLoading(false)
    }, 1000)
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
    let toDate: Date | undefined = endOfDay(today) // Default para o final do dia atual

    switch (value) {
      case "all_time":
        fromDate = new Date(0) // Epoch time para "todo o tempo"
        break
      case "today":
        fromDate = startOfDay(today)
        break
      case "yesterday":
        fromDate = startOfDay(subDays(today, 1))
        toDate = endOfDay(subDays(today, 1))
        break
      case "7d":
        fromDate = subDays(today, 6) // Últimos 7 dias incluindo hoje
        break
      case "30d":
        fromDate = subDays(today, 29) // Últimos 30 dias incluindo hoje
        break
      case "this_month":
        fromDate = startOfMonth(today)
        toDate = endOfMonth(today)
        break
      case "last_month":
        fromDate = startOfMonth(subMonths(today, 1))
        toDate = endOfMonth(subMonths(today, 1))
        break
      case "90d":
        fromDate = subDays(today, 89) // Últimos 90 dias incluindo hoje
        break
      case "1y":
        fromDate = subMonths(today, 11) // Últimos 12 meses incluindo o mês atual
        break
      case "custom":
        setCalendarOpen(true)
        return // Não define dateRange aqui, é tratado pelo calendário
      default:
        fromDate = subDays(today, 29) // Padrão para últimos 30 dias
        break
    }

    setDateRange({
      from: fromDate,
      to: toDate,
    })
  }

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (validateDateRange(range)) {
      setDateRange(range)
      if (range.from && range.to) {
        const currentSummary = getConsolidatedSummary({ from: range.from, to: range.to })
        const uncompletedSalesAmount = getFilteredTransactions({
          status: ["pending", "failed"],
          period: range.from && range.to ? { from: range.from, to: range.to } : undefined,
          gateway: selectedGateway === "all" ? undefined : selectedGateway,
        }).reduce((sum, t) => sum + (t.amount || 0), 0)
        setSummary({
          ...currentSummary,
          uncompletedSalesAmount: uncompletedSalesAmount + currentSummary.abandonedAmount,
        })
      }
    }
  }

  // Preparar dados para os gráficos
  const prepareRevenueData = () => {
    const dateMap = new Map()

    const filteredTransactions = getFilteredTransactions({
      status: "completed",
      period: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
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
          tibopay: 0,
          kiwify: 0,
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

    return chartData.map((item, index) => ({
      ...item,
      date: index + 1,
    }))
  }

  const prepareGatewayDistributionData = () => {
    if (!summary || !summary.gatewaySummaries || summary.gatewaySummaries.length === 0) {
      return []
    }

    return summary.gatewaySummaries.map((gateway) => ({
      name: gatewayConfigs.find((gc) => gc.id === gateway.gatewayId)?.name || gateway.gatewayId,
      value: gateway.totalAmount,
    }))
  }

  const prepareTransactionCountData = () => {
    if (!summary || !summary.gatewaySummaries || summary.gatewaySummaries.length === 0) {
      return []
    }

    return summary.gatewaySummaries.map((gateway) => ({
      name: gatewayConfigs.find((gc) => gc.id === gateway.gatewayId)?.name || gateway.gatewayId,
      count: gateway.totalTransactions,
    }))
  }

  const prepareProductDistributionData = useMemo(() => {
    const productMap = new Map<string, number>()
    const filteredTransactions = getFilteredTransactions({
      status: "completed",
      period: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
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

    if (dateRange?.from && dateRange?.to) {
      let currentDate = new Date(dateRange.from)
      const endDate = new Date(dateRange.to)

      while (currentDate <= endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd")
        dailyDataMap.set(dateStr, {
          date: format(currentDate, "dd/MM", { locale: ptBR }),
          bruto: 0,
          liquido: 0,
        })
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }

    const filteredTransactions = getFilteredTransactions({
      status: "completed",
      period: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
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
        const fee = transaction.fee || 0

        existingData.bruto += amount
        existingData.liquido += amount - fee
        dailyDataMap.set(dateStr, existingData)
      } catch (error) {
        console.warn("[DAILY_PERFORMANCE] Erro ao processar transação:", error, transaction)
      }
    })

    const data = Array.from(dailyDataMap.values()).sort((a, b) => {
      // Ajuste para ordenar corretamente por data, considerando o ano
      const [dayA, monthA] = a.date.split("/").map(Number)
      const [dayB, monthB] = b.date.split("/").map(Number)
      // Assumindo que as datas são do ano atual ou do ano anterior se o mês for maior
      const currentYear = new Date().getFullYear()
      const dateObjA = new Date(currentYear, monthA - 1, dayA)
      const dateObjB = new Date(currentYear, monthB - 1, dayB)

      // Se o mês da data for maior que o mês atual, assume-se que é do ano anterior
      if (monthA > new Date().getMonth() + 1) dateObjA.setFullYear(currentYear - 1)
      if (monthB > new Date().getMonth() + 1) dateObjB.setFullYear(currentYear - 1)

      return dateObjA.getTime() - dateObjB.getTime()
    })

    return data
  }, [dateRange, selectedGateway, getFilteredTransactions])

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Cores fixas para os gráficos
  const chartColors = ["#6B7280", "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B"]

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

        centerTextDiv.appendChild(totalLabel)
        centerTextDiv.appendChild(totalAmount)

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
  const salesProgress = Math.min(100, (summary.totalTransactions / salesTarget) * 100)
  const revenueProgress = Math.min(100, (summary.totalAmount / revenueTarget) * 100)
  const newCustomersProgress = 78
  const conversionRateProgress = 63

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Dashboard de Gateways</h1>
        <p className="text-muted-foreground">Acompanhe seus principais indicadores de desempenho e resultados.</p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">Todo o Tempo</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="this_month">Este Mês</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === "custom" && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range) {
                      handleDateRangeChange(range)
                      if (range.from && range.to) {
                        setCalendarOpen(false)
                      }
                    }
                  }}
                  numberOfMonths={1}
                  locale={ptBR}
                />
                <div className="flex items-center justify-between p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCalendarOpen(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (dateRange.from && dateRange.to) {
                        handleDateRangeChange(dateRange)
                        setCalendarOpen(false)
                      } else {
                        toast({
                          title: "Seleção incompleta",
                          description: "Por favor, selecione uma data inicial e final.",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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
              <Button variant="outline" className="text-xs sm:text-sm" onClick={() => setIsGatewayConfigOpen(true)}>
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

          <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="text-xs sm:text-sm">
            <RefreshCw className={cn("h-4 w-4 mr-1 sm:mr-2", isLoading && "animate-spin")} />
            <span>Atualizar</span>
          </Button>
          <Button variant="outline" className="text-xs sm:text-sm">
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Card className="neon-card neon-card-blue">
          <CardHeader className="pb-2">
            <CardDescription>Receita Total</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl neon-text-blue">{formatCurrency(summary.totalAmount)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Dados reais de receita</div>
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
            <div className="text-sm text-muted-foreground">Dados reais de valor líquido</div>
          </CardContent>
        </Card>
        <Card className="neon-card neon-card-red">
          <CardHeader className="pb-2">
            <CardDescription>Vendas Não Concluídas</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-red-500">
              {formatCurrency(summary.uncompletedSalesAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center">
              <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
              Valor total de transações pendentes/falhas
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full min-w-max">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="gateways">Gateways</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
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
                        ? ["total", "kirvano", "cakto", "tibopay", "kiwify"]
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
          <div className="grid gap-6 md:grid-cols-2">
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
          </div>
        </TabsContent>
        <TabsContent value="transactions" className="space-y-6">
          <Card className="neon-card neon-card-blue">
            <CardHeader>
              <CardTitle>Últimas Transações</CardTitle>
              <CardDescription>Transações mais recentes de todos os gateways</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="hidden sm:grid sm:grid-cols-5 text-sm font-medium text-muted-foreground">
                  <div>Data</div>
                  <div>Cliente</div>
                  <div>Produto</div>
                  <div>Gateway</div>
                  <div className="text-right">Valor</div>
                </div>
                <div className="space-y-4">
                  {getFilteredTransactions({
                    status: "completed",
                    gateway: selectedGateway === "all" ? undefined : selectedGateway,
                    period: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
                  })
                    .slice(0, 10)
                    .map((transaction, index) => {
                      const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id)
                      return (
                        <div key={index} className="block sm:hidden border rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{transaction.product_name}</div>
                            <div className="font-bold">{formatCurrency(transaction.amount)}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className="text-muted-foreground">Data:</div>
                            <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>
                            <div className="text-muted-foreground">Cliente:</div>
                            <div>{transaction.customer_name}</div>
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

                  <div className="hidden sm:block space-y-2">
                    {getFilteredTransactions({
                      status: "completed",
                      gateway: selectedGateway === "all" ? undefined : selectedGateway,
                      period: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
                    })
                      .slice(0, 10)
                      .map((transaction, index) => {
                        const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id)
                        return (
                          <div key={index} className="grid grid-cols-5 text-sm">
                            <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>
                            <div>{transaction.customer_name}</div>
                            <div>{transaction.product_name}</div>
                            <div>
                              <span className="inline-flex items-center">
                                <span
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: gateway?.color || "#ccc" }}
                                ></span>
                                {gateway?.name || transaction.gateway_id}
                              </span>
                            </div>
                            <div className="text-right">{formatCurrency(transaction.amount)}</div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
