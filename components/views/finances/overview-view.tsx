"use client"

import { useState } from "react"
import { ArrowUpCircle, DollarSign, Target, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Transaction } from "../finances-view"

interface OverviewViewProps {
  transactions: Transaction[]
}

export function OverviewView({ transactions }: OverviewViewProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d")

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Função para filtrar transações por período
  const filterTransactionsByPeriod = (days: number | null = null) => {
    if (days === null) return transactions

    const today = new Date()
    const startDate = new Date()
    startDate.setDate(today.getDate() - days)

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date.split(",")[0].split("/").reverse().join("-"))
      return transactionDate >= startDate && transactionDate <= today
    })
  }

  // Obter transações filtradas pelo período selecionado
  const filteredTransactions = (() => {
    switch (period) {
      case "7d":
        return filterTransactionsByPeriod(7)
      case "30d":
        return filterTransactionsByPeriod(30)
      case "90d":
        return filterTransactionsByPeriod(90)
      case "all":
        return filterTransactionsByPeriod(null)
      default:
        return transactions
    }
  })()

  // Calcular métricas financeiras
  const calculateMetrics = () => {
    const income = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const expenses = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const balance = income - expenses
    const uncompletedSalesAmount = filteredTransactions
      .filter((t) => t.status === "pending" || t.status === "failed")
      .reduce((sum, t) => sum + t.amount, 0)
    const profitMargin = income > 0 ? (balance / income) * 100 : 0

    // Calcular tendências (comparando com o período anterior)
    const previousPeriodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365
    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - previousPeriodDays * 2)
    const previousPeriodEnd = new Date()
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - previousPeriodDays)

    const previousTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date.split(",")[0].split("/").reverse().join("-"))
      return transactionDate >= previousPeriodStart && transactionDate <= previousPeriodEnd
    })

    const previousIncome = previousTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const previousExpenses = previousTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const previousBalance = previousIncome - previousExpenses

    const incomeTrend = previousIncome > 0 ? ((income - previousIncome) / previousIncome) * 100 : 0
    const expensesTrend = previousExpenses > 0 ? ((expenses - previousExpenses) / previousExpenses) * 100 : 0
    const balanceTrend = previousBalance > 0 ? ((balance - previousBalance) / previousBalance) * 100 : 0

    return {
      income,
      expenses,
      balance,
      profitMargin,
      incomeTrend,
      expensesTrend,
      balanceTrend,
      transactionCount: filteredTransactions.length,
      uncompletedSalesAmount,
    }
  }

  const metrics = calculateMetrics()

  // Agrupar transações por categoria
  const getTopCategories = (type: "income" | "expense", limit = 5) => {
    const categoriesMap = new Map<string, number>()

    filteredTransactions
      .filter((t) => t.type === type)
      .forEach((transaction) => {
        // Extrair categoria da descrição (assumindo formato "Categoria: Descrição")
        const category = transaction.description.includes(": ")
          ? transaction.description.split(": ")[0]
          : "Sem categoria"

        const currentAmount = categoriesMap.get(category) || 0
        categoriesMap.set(category, currentAmount + transaction.amount)
      })

    return Array.from(categoriesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
  }

  // Obter dados para o gráfico de fluxo de caixa
  const getCashFlowData = () => {
    const dateMap = new Map<string, { income: number; expenses: number }>()

    // Determinar o número de pontos de dados com base no período
    const dataPoints = period === "7d" ? 7 : period === "30d" ? 10 : period === "90d" ? 12 : 12

    // Criar datas para os pontos de dados
    const today = new Date()
    const intervalDays = period === "7d" ? 1 : period === "30d" ? 3 : period === "90d" ? 7 : 30

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i * intervalDays)
      const dateKey = date.toLocaleDateString("pt-BR")
      dateMap.set(dateKey, { income: 0, expenses: 0 })
    }

    // Preencher com dados reais
    filteredTransactions.forEach((transaction) => {
      const dateKey = transaction.date.split(",")[0]
      if (dateMap.has(dateKey)) {
        const current = dateMap.get(dateKey)!
        if (transaction.type === "income") {
          current.income += transaction.amount
        } else {
          current.expenses += transaction.amount
        }
        dateMap.set(dateKey, current)
      }
    })

    return Array.from(dateMap.entries()).map(([date, values]) => ({
      date,
      income: values.income,
      expenses: values.expenses,
      balance: values.income - values.expenses,
    }))
  }

  const topIncomeCategories = getTopCategories("income")
  const topExpenseCategories = getTopCategories("expense")
  const cashFlowData = getCashFlowData()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Visão Geral Financeira</h2>
        <Select value={period} onValueChange={(value) => setPeriod(value as "7d" | "30d" | "90d" | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.income)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {metrics.incomeTrend > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">{metrics.incomeTrend.toFixed(1)}% de aumento</span>
                </>
              ) : metrics.incomeTrend < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">{Math.abs(metrics.incomeTrend).toFixed(1)}% de queda</span>
                </>
              ) : (
                <span>Sem alteração</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className={`h-4 w-4 ${metrics.balance >= 0 ? "text-green-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(metrics.balance)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {metrics.balanceTrend > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">{metrics.balanceTrend.toFixed(1)}% de aumento</span>
                </>
              ) : metrics.balanceTrend < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">{Math.abs(metrics.balanceTrend).toFixed(1)}% de queda</span>
                </>
              ) : (
                <span>Sem alteração</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Baseado em {metrics.transactionCount} transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Não Concluídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(metrics.uncompletedSalesAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor total de transações pendentes/falhas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de fluxo de caixa (representação visual) */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
          <CardDescription>Receitas vs Despesas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <div className="flex flex-col h-full">
              <div className="flex-1 relative">
                {/* Simulação visual de um gráfico */}
                <div className="absolute inset-0 flex items-end">
                  {cashFlowData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full space-y-1">
                      <div
                        className="w-4 bg-green-500 rounded-t"
                        style={{ height: `${Math.min(data.income / 10, 100)}%` }}
                      ></div>
                      <div
                        className="w-4 bg-red-500 rounded-t"
                        style={{ height: `${Math.min(data.expenses / 10, 100)}%` }}
                      ></div>
                      <div className="text-xs text-muted-foreground rotate-45 origin-top-left mt-2">
                        {data.date.split("/").slice(0, 2).join("/")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-8 flex items-center justify-between px-4 mt-8">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs">Receitas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-xs">Despesas</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para categorias de receitas e despesas */}
      <Tabs defaultValue="expenses">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Principais Despesas</TabsTrigger>
          <TabsTrigger value="income">Principais Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Principais Categorias de Despesas</CardTitle>
              <CardDescription>Onde seu dinheiro está sendo gasto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topExpenseCategories.length > 0 ? (
                  topExpenseCategories.map(([category, amount], index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-red-${300 + index * 100}`}></div>
                        <span className="ml-2">{category}</span>
                      </div>
                      <div className="font-medium">{formatCurrency(amount)}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma despesa registrada no período selecionado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Principais Fontes de Receita</CardTitle>
              <CardDescription>De onde vem seu dinheiro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topIncomeCategories.length > 0 ? (
                  topIncomeCategories.map(([category, amount], index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-green-${300 + index * 100}`}></div>
                        <span className="ml-2">{category}</span>
                      </div>
                      <div className="font-medium">{formatCurrency(amount)}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma receita registrada no período selecionado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
