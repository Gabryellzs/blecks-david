"use client"

import { useState, useEffect } from "react"
import { Calendar, Download, FileSpreadsheet, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart } from "@/components/ui/charts"
import type { Transaction } from "../finances-view"

// Interface para os dados mensais salvos
interface MonthlySavedData {
  id: string
  month: string // formato: "YYYY-MM"
  name: string // formato legível: "Janeiro 2023"
  transactions: Transaction[]
  summary: {
    totalIncome: number
    totalExpense: number
    balance: number
    transactionCount: number
    dailyData: {
      date: string
      income: number
      expense: number
      balance: number
    }[]
  }
  savedAt: string // ISO date string
  autoSaved?: boolean // Indica se foi salvo automaticamente
}

export function AnnualReportView() {
  // Obter transações atuais
  const [currentTransactions] = useLocalStorage<Transaction[]>("finance-transactions", [])

  // Estado para dados mensais salvos
  const [savedMonthlyData, setSavedMonthlyData] = useLocalStorage<MonthlySavedData[]>("finance-saved-monthly-data", [])

  // Estados para UI
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedDataToDelete, setSelectedDataToDelete] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [lastCheckedDate, setLastCheckedDate] = useLocalStorage<string>("last-checked-date", new Date().toISOString())

  // Verificar automaticamente se é necessário salvar dados do mês anterior
  useEffect(() => {
    const checkAutoSave = () => {
      const now = new Date()
      const lastChecked = new Date(lastCheckedDate)

      // Se estamos em um mês diferente do último check
      if (now.getMonth() !== lastChecked.getMonth() || now.getFullYear() !== lastChecked.getFullYear()) {
        // Determinar o mês anterior
        const prevMonth = new Date(now)
        prevMonth.setDate(0) // Vai para o último dia do mês anterior

        const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`

        // Verificar se já salvamos dados para o mês anterior
        const alreadySaved = savedMonthlyData.some((data) => data.month === prevMonthStr)

        if (!alreadySaved) {
          // Filtrar transações do mês anterior
          const prevMonthTransactions = currentTransactions.filter((transaction) => {
            const transactionDate = new Date(transaction.date.split("/").reverse().join("-"))
            return (
              transactionDate.getMonth() === prevMonth.getMonth() &&
              transactionDate.getFullYear() === prevMonth.getFullYear()
            )
          })

          if (prevMonthTransactions.length > 0) {
            // Salvar automaticamente
            saveMonthData(prevMonthStr, prevMonthTransactions, true)

            toast({
              title: "Salvamento automático",
              description: `Os dados de ${formatMonthName(prevMonthStr)} foram salvos automaticamente.`,
            })
          }
        }

        // Atualizar a data do último check
        setLastCheckedDate(now.toISOString())
      }
    }

    // Executar a verificação quando o componente montar
    checkAutoSave()

    // Configurar verificação diária
    const interval = setInterval(checkAutoSave, 86400000) // 24 horas

    return () => clearInterval(interval)
  }, [currentTransactions, lastCheckedDate, savedMonthlyData, setLastCheckedDate])

  // Lista de anos disponíveis (do ano atual até 2 anos atrás)
  const availableYears = () => {
    const currentYear = new Date().getFullYear()
    return [currentYear, currentYear - 1, currentYear - 2].map((year) => year.toString())
  }

  // Obter dados salvos para o ano selecionado
  const savedDataForSelectedYear = savedMonthlyData
    .filter((data) => data.month.startsWith(selectedYear))
    .sort((a, b) => b.month.localeCompare(a.month)) // Ordenar do mais recente para o mais antigo

  // Verificar se já existe um snapshot para o mês atual
  const currentMonthAlreadySaved = savedMonthlyData.some((data) => data.month === currentMonth)

  // Função para formatar o nome do mês
  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  // Função para agrupar transações por dia
  const groupTransactionsByDay = (transactions: Transaction[]) => {
    const dailyData: Record<string, { income: number; expense: number; balance: number }> = {}

    transactions.forEach((transaction) => {
      const date = transaction.date.split(" ")[0] // Remover qualquer parte de hora/edição

      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expense: 0, balance: 0 }
      }

      if (transaction.type === "income") {
        dailyData[date].income += transaction.amount
      } else {
        dailyData[date].expense += transaction.amount
      }

      dailyData[date].balance = dailyData[date].income - dailyData[date].expense
    })

    // Converter para array e ordenar por data
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => {
        // Converter datas no formato DD/MM/YYYY para comparação
        const [aDay, aMonth, aYear] = a.date.split("/").map(Number)
        const [bDay, bMonth, bYear] = b.date.split("/").map(Number)

        if (aYear !== bYear) return aYear - bYear
        if (aMonth !== bMonth) return aMonth - bMonth
        return aDay - bDay
      })
  }

  // Função para salvar dados de um mês específico
  const saveMonthData = (monthStr: string, transactions: Transaction[], isAutoSave = false) => {
    // Calcular resumo
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    // Agrupar por dia
    const dailyData = groupTransactionsByDay(transactions)

    // Criar objeto de dados salvos
    const monthlyData: MonthlySavedData = {
      id: `${monthStr}-${Date.now()}`,
      month: monthStr,
      name: formatMonthName(monthStr),
      transactions: transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length,
        dailyData,
      },
      savedAt: new Date().toISOString(),
      autoSaved: isAutoSave,
    }

    // Adicionar aos dados salvos
    setSavedMonthlyData([...savedMonthlyData, monthlyData])

    return monthlyData
  }

  // Função para salvar os dados do mês atual
  const saveCurrentMonthData = () => {
    // Filtrar transações do mês atual
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // Filtrar transações do mês atual
    const currentMonthTransactions = currentTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date.split("/").reverse().join("-"))
      return transactionDate.getMonth() + 1 === month && transactionDate.getFullYear() === year
    })

    const savedData = saveMonthData(currentMonth, currentMonthTransactions)

    toast({
      title: "Dados salvos com sucesso",
      description: `Os dados de ${formatMonthName(currentMonth)} foram salvos para consulta futura.`,
    })

    return savedData
  }

  // Função para excluir dados salvos
  const deleteSelectedData = () => {
    if (!selectedDataToDelete) return

    setSavedMonthlyData(savedMonthlyData.filter((data) => data.id !== selectedDataToDelete))
    setSelectedDataToDelete(null)
    setIsConfirmDialogOpen(false)

    toast({
      title: "Dados excluídos",
      description: "Os dados selecionados foram excluídos com sucesso.",
      variant: "destructive",
    })
  }

  // Função para exportar dados salvos como Excel
  const exportToExcel = async (data: MonthlySavedData) => {
    try {
      // Importar a biblioteca xlsx dinamicamente
      const XLSX = await import("xlsx").then((mod) => mod.default)

      // Criar planilha para dados diários
      const dailyWorksheet = XLSX.utils.json_to_sheet(
        data.summary.dailyData.map((day) => ({
          Data: day.date,
          Receitas: day.income,
          Despesas: day.expense,
          Saldo: day.balance,
        })),
      )

      // Criar planilha para transações
      const transactionsWorksheet = XLSX.utils.json_to_sheet(
        data.transactions.map((t) => ({
          Data: t.date,
          Tipo: t.type === "income" ? "Receita" : "Despesa",
          Descrição: t.description,
          Valor: t.amount,
          Fonte: t.source || "Manual",
        })),
      )

      // Criar planilha para resumo
      const summaryWorksheet = XLSX.utils.json_to_sheet([
        { Métrica: "Total de Receitas", Valor: data.summary.totalIncome },
        { Métrica: "Total de Despesas", Valor: data.summary.totalExpense },
        { Métrica: "Saldo Final", Valor: data.summary.balance },
        { Métrica: "Número de Transações", Valor: data.summary.transactionCount },
        { Métrica: "Data de Salvamento", Valor: new Date(data.savedAt).toLocaleString("pt-BR") },
      ])

      // Criar workbook e adicionar as planilhas
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, dailyWorksheet, "Relatório Diário")
      XLSX.utils.book_append_sheet(workbook, transactionsWorksheet, "Transações")
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Resumo")

      // Gerar arquivo Excel
      XLSX.writeFile(workbook, `relatorio-financeiro-${data.month}.xlsx`)

      toast({
        title: "Exportação concluída",
        description: `Os dados de ${data.name} foram exportados para Excel com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Excel.",
        variant: "destructive",
      })
    }
  }

  // Função para exportar dados salvos como JSON
  const exportAsJson = (data: MonthlySavedData) => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `dados-financeiros-${data.month}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Exportação concluída",
      description: `Os dados de ${data.name} foram exportados com sucesso.`,
    })
  }

  // Preparar dados para gráficos anuais
  const prepareChartData = () => {
    const monthsInYear = savedMonthlyData
      .filter((data) => data.month.startsWith(selectedYear))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      labels: monthsInYear.map((data) => {
        const monthNum = Number.parseInt(data.month.split("-")[1])
        return new Date(0, monthNum - 1).toLocaleDateString("pt-BR", { month: "short" })
      }),
      datasets: [
        {
          label: "Receitas",
          data: monthsInYear.map((data) => data.summary.totalIncome),
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 2,
        },
        {
          label: "Despesas",
          data: monthsInYear.map((data) => data.summary.totalExpense),
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 2,
        },
        {
          label: "Saldo",
          data: monthsInYear.map((data) => data.summary.balance),
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
        },
      ],
    }
  }

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dados Salvos</h2>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded flex items-center">
          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
          <p className="text-sm text-blue-700">Salvamento automático no final de cada mês</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Dados Salvos</CardTitle>
          <CardDescription>Visualize e analise seus dados financeiros salvos por mês</CardDescription>
          <div className="flex justify-end">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears().map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {savedDataForSelectedYear.length > 0 ? (
            <div className="space-y-6">
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list">Lista</TabsTrigger>
                  <TabsTrigger value="charts">Gráficos</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="space-y-4">
                  {savedDataForSelectedYear.map((data) => (
                    <Card key={data.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 pb-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{data.name}</CardTitle>
                            {data.autoSaved && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Auto</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => exportToExcel(data)} className="h-8">
                              <FileSpreadsheet className="h-4 w-4 mr-1" />
                              Excel
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => exportAsJson(data)} className="h-8">
                              <Download className="h-4 w-4 mr-1" />
                              JSON
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedDataToDelete(data.id)
                                setIsConfirmDialogOpen(true)
                              }}
                              className="h-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>Salvo em: {new Date(data.savedAt).toLocaleString("pt-BR")}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Receitas</p>
                            <p className="text-xl font-bold text-green-700">
                              {formatCurrency(data.summary.totalIncome)}
                            </p>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Despesas</p>
                            <p className="text-xl font-bold text-red-700">
                              {formatCurrency(data.summary.totalExpense)}
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${data.summary.balance >= 0 ? "bg-blue-50" : "bg-amber-50"}`}>
                            <p
                              className={`text-sm font-medium ${data.summary.balance >= 0 ? "text-blue-600" : "text-amber-600"}`}
                            >
                              Saldo
                            </p>
                            <p
                              className={`text-xl font-bold ${data.summary.balance >= 0 ? "text-blue-700" : "text-amber-700"}`}
                            >
                              {formatCurrency(data.summary.balance)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">
                            {data.summary.transactionCount} transações registradas
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {data.summary.dailyData.length} dias com movimentação
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="charts">
                  {savedDataForSelectedYear.length >= 2 ? (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Evolução Financeira - {selectedYear}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                          <LineChart
                            data={prepareChartData()}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                            }}
                          />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Comparativo Mensal - {selectedYear}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                          <BarChart
                            data={prepareChartData()}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                            }}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      Salve dados de pelo menos 2 meses para visualizar gráficos comparativos
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="mb-4">Nenhum dado salvo para o ano {selectedYear}</p>
              {new Date().getFullYear().toString() === selectedYear && (
                <p className="text-sm text-blue-600">
                  Os dados deste ano serão salvos automaticamente no final de cada mês
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir estes dados salvos? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteSelectedData}>
              Sim, excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
