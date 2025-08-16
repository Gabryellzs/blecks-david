"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Calendar, DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Transaction } from "../finances-view"

interface MonthlyViewProps {
  transactions: Transaction[]
}

export function MonthlyView({ transactions }: MonthlyViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Obter o primeiro dia do mês selecionado
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1)

  // Obter o último dia do mês selecionado
  const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0)

  // Formatar o mês e ano para exibição
  const formatMonthYear = (): string => {
    return firstDayOfMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  // Função para verificar se uma data está dentro do mês selecionado
  const isDateInSelectedMonth = (dateStr: string): boolean => {
    // Extrair apenas a parte da data (sem a hora)
    const datePart = dateStr.split(",")[0].trim()

    // Converter para formato de data JavaScript
    const parts = datePart.split("/")
    if (parts.length !== 3) return false

    // Formato brasileiro: DD/MM/YYYY
    const day = Number.parseInt(parts[0], 10)
    const month = Number.parseInt(parts[1], 10) - 1 // Meses em JS são 0-11
    const year = Number.parseInt(parts[2], 10)

    // Verificar se corresponde ao mês e ano selecionados
    return month === selectedMonth && year === selectedYear
  }

  // Filtrar transações pelo mês selecionado
  const monthlyTransactions = transactions.filter((transaction) => {
    return isDateInSelectedMonth(transaction.date)
  })

  // Agrupar transações por semana do mês
  const transactionsByWeek = () => {
    const weeks: { [key: string]: Transaction[] } = {}

    // Inicializar as semanas do mês
    const numWeeks = Math.ceil((lastDayOfMonth.getDate() + firstDayOfMonth.getDay()) / 7)

    for (let i = 0; i < numWeeks; i++) {
      weeks[`Semana ${i + 1}`] = []
    }

    // Agrupar transações por semana
    monthlyTransactions.forEach((transaction) => {
      const [day] = transaction.date.split(",")[0].split("/").map(Number)
      const weekNum = Math.floor((day - 1 + firstDayOfMonth.getDay()) / 7)
      const weekKey = `Semana ${weekNum + 1}`

      if (!weeks[weekKey]) {
        weeks[weekKey] = []
      }
      weeks[weekKey].push(transaction)
    })

    return weeks
  }

  // Calcular o saldo do mês
  const calculateMonthlyBalance = () => {
    return monthlyTransactions.reduce((total, transaction) => {
      return transaction.type === "income" ? total + transaction.amount : total - transaction.amount
    }, 0)
  }

  // Calcular receitas do mês
  const calculateMonthlyIncome = () => {
    return monthlyTransactions.filter((t) => t.type === "income").reduce((total, t) => total + t.amount, 0)
  }

  // Calcular o saldo semanal
  const calculateWeeklyBalance = (weekTransactions: Transaction[]) => {
    return weekTransactions.reduce((total, transaction) => {
      return transaction.type === "income" ? total + transaction.amount : total - transaction.amount
    }, 0)
  }

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  // Ir para o mês atual
  const goToCurrentMonth = () => {
    const today = new Date()
    setSelectedMonth(today.getMonth())
    setSelectedYear(today.getFullYear())
  }

  // Gerar anos para o seletor (5 anos para trás e 5 anos para frente)
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i)

  // Nomes dos meses
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Visão Mensal</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {formatMonthYear()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mês</label>
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ano</label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    goToCurrentMonth()
                    setIsPopoverOpen(false)
                  }}
                >
                  Mês Atual
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Saldo do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center">
              <DollarSign className="h-5 w-5 mr-1" />
              <span
                className={`text-2xl font-bold ${calculateMonthlyBalance() >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {formatCurrency(calculateMonthlyBalance())}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Receitas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center">
              <span className="text-2xl font-bold text-green-500">{formatCurrency(calculateMonthlyIncome())}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações por Semana</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(transactionsByWeek()).map(([week, weekTransactions]) => (
            <div key={week} className="mb-6 last:mb-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{week}</h3>
                <span
                  className={`font-bold ${calculateWeeklyBalance(weekTransactions) >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {formatCurrency(calculateWeeklyBalance(weekTransactions))}
                </span>
              </div>

              {weekTransactions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2 border-b">
                  Nenhuma transação registrada para esta semana.
                </div>
              ) : (
                <div className="divide-y divide-border border-t border-b">
                  {weekTransactions.map((transaction) => (
                    <div key={transaction.id} className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                      <div
                        className={`font-bold whitespace-nowrap ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}
                      >
                        {transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
