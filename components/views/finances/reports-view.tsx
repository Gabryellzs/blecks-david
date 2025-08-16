"use client"

import { useState } from "react"
import { BarChart, DollarSign, LineChart, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Transaction } from "../finances-view"

interface ReportsViewProps {
  transactions: Transaction[]
}

export function ReportsView({ transactions }: ReportsViewProps) {
  const [selectedTab, setSelectedTab] = useState("monthly")

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Agrupar transações por mês
  const groupTransactionsByMonth = () => {
    const months: { [key: string]: { income: number; expense: number } } = {}

    transactions.forEach((transaction) => {
      const [, month, year] = transaction.date.split(",")[0].split("/").map(Number)
      const monthKey = `${year}-${month.toString().padStart(2, "0")}`

      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expense: 0 }
      }

      if (transaction.type === "income") {
        months[monthKey].income += transaction.amount
      } else {
        months[monthKey].expense += transaction.amount
      }
    })

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [year, month] = key.split("-")
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        return {
          month: `${monthNames[Number.parseInt(month) - 1]}/${year}`,
          income: value.income,
          expense: value.expense,
          balance: value.income - value.expense,
        }
      })
  }

  // Agrupar transações por categoria (simulado)
  const groupTransactionsByCategory = () => {
    // Categorias simuladas
    const categories = [
      { name: "Alimentação", expense: 1250.75 },
      { name: "Moradia", expense: 2100.0 },
      { name: "Transporte", expense: 450.3 },
      { name: "Lazer", expense: 320.45 },
      { name: "Saúde", expense: 180.9 },
      { name: "Educação", expense: 350.0 },
      { name: "Outros", expense: 210.6 },
    ]

    return categories
  }

  // Calcular o total de receitas
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((total, t) => total + t.amount, 0)

  // Calcular o total de despesas
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((total, t) => total + t.amount, 0)

  // Dados mensais para o gráfico
  const monthlyData = groupTransactionsByMonth()

  // Dados de categorias para o gráfico
  const categoryData = groupTransactionsByCategory()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Relatórios Financeiros</h2>

      <Tabs defaultValue="monthly" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly" className="flex items-center">
            <LineChart className="h-4 w-4 mr-2" />
            Mensal
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Resumo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  Aqui seria exibido um gráfico de linha mostrando a evolução mensal de receitas e despesas.
                </p>
              </div>
              <div className="mt-4 space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="font-medium">{data.month}</div>
                    <div className="flex items-center space-x-4">
                      <div className="text-green-500">+{formatCurrency(data.income)}</div>
                      <div className="text-red-500">-{formatCurrency(data.expense)}</div>
                      <div className={`font-bold ${data.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(data.balance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  Aqui seria exibido um gráfico de pizza mostrando a distribuição de despesas por categoria.
                </p>
              </div>
              <div className="mt-4 space-y-4">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="font-medium">{category.name}</div>
                    <div className="flex items-center space-x-4">
                      <div className="text-red-500">{formatCurrency(category.expense)}</div>
                      <div className="text-muted-foreground">
                        {Math.round((category.expense / totalExpense) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-10 w-10 mr-2 text-green-500" />
                  <div>
                    <p className="text-3xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
                    <p className="text-sm text-muted-foreground">
                      Total de {transactions.filter((t) => t.type === "income").length} transações
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-10 w-10 mr-2 text-red-500" />
                  <div>
                    <p className="text-3xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
                    <p className="text-sm text-muted-foreground">
                      Total de {transactions.filter((t) => t.type === "expense").length} transações
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Balanço Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="font-medium">Total de Receitas</div>
                  <div className="text-green-500 font-bold">{formatCurrency(totalIncome)}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">Total de Despesas</div>
                  <div className="text-red-500 font-bold">{formatCurrency(totalExpense)}</div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="font-bold">Saldo Final</div>
                  <div
                    className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {formatCurrency(totalIncome - totalExpense)}
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
