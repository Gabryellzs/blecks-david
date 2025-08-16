"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Calendar, DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import type { Transaction } from "../finances-view"

interface WeeklyViewProps {
  transactions: Transaction[]
}

export function WeeklyView({ transactions }: WeeklyViewProps) {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = today.getDay() // 0 = domingo, 1 = segunda, ..., 6 = sábado
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Ajuste para começar na segunda-feira
    return new Date(today.setDate(diff))
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Calcular o final da semana (domingo)
  const weekEnd = new Date(selectedWeekStart)
  weekEnd.setDate(selectedWeekStart.getDate() + 6)

  // Formatar o intervalo da semana para exibição
  const formatWeekRange = (): string => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }
    return `${selectedWeekStart.toLocaleDateString("pt-BR", options)} - ${weekEnd.toLocaleDateString("pt-BR", options)}, ${weekEnd.getFullYear()}`
  }

  // Função para normalizar datas para comparação
  const normalizeDate = (dateStr: string): Date | null => {
    // Extrair apenas a parte da data (sem a hora)
    const datePart = dateStr.split(",")[0].trim()

    // Verificar se a data está no formato DD/MM/YYYY
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(datePart)) {
      return null
    }

    // Converter para objeto Date
    try {
      const [day, month, year] = datePart.split("/").map(Number)
      return new Date(year, month - 1, day) // Mês em JS é 0-indexed
    } catch (e) {
      console.error("Erro ao normalizar data:", e)
      return null
    }
  }

  // Função para verificar se uma data está dentro da semana selecionada
  const isDateInSelectedWeek = (dateStr: string): boolean => {
    const transactionDate = normalizeDate(dateStr)
    if (!transactionDate) return false

    // Criar cópias das datas para comparação
    const weekStart = new Date(selectedWeekStart)
    weekStart.setHours(0, 0, 0, 0)

    const weekEndDate = new Date(weekEnd)
    weekEndDate.setHours(23, 59, 59, 999)

    // Verificar se está dentro da semana
    return transactionDate >= weekStart && transactionDate <= weekEndDate
  }

  // Filtrar transações pela semana selecionada
  const weeklyTransactions = transactions.filter((transaction) => {
    return isDateInSelectedWeek(transaction.date)
  })

  // Agrupar transações por dia da semana
  const transactionsByDay = () => {
    const days: { [key: string]: Transaction[] } = {}

    // Inicializar os dias da semana
    for (let i = 0; i < 7; i++) {
      const day = new Date(selectedWeekStart)
      day.setDate(selectedWeekStart.getDate() + i)
      const dayKey = day.toLocaleDateString("pt-BR")
      days[dayKey] = []
    }

    // Agrupar transações por dia
    weeklyTransactions.forEach((transaction) => {
      const transactionDate = normalizeDate(transaction.date)
      if (!transactionDate) return

      const dayKey = transactionDate.toLocaleDateString("pt-BR")
      if (!days[dayKey]) {
        days[dayKey] = []
      }
      days[dayKey].push(transaction)
    })

    return days
  }

  // Calcular o saldo da semana
  const calculateWeeklyBalance = () => {
    return weeklyTransactions.reduce((total, transaction) => {
      return transaction.type === "income" ? total + transaction.amount : total - transaction.amount
    }, 0)
  }

  // Calcular receitas da semana
  const calculateWeeklyIncome = () => {
    return weeklyTransactions.filter((t) => t.type === "income").reduce((total, t) => total + t.amount, 0)
  }

  // Calcular o saldo diário
  const calculateDailyBalance = (dayTransactions: Transaction[]) => {
    return dayTransactions.reduce((total, transaction) => {
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

  // Navegar para a semana anterior
  const goToPreviousWeek = () => {
    const previousWeek = new Date(selectedWeekStart)
    previousWeek.setDate(previousWeek.getDate() - 7)
    setSelectedWeekStart(previousWeek)
  }

  // Navegar para a próxima semana
  const goToNextWeek = () => {
    const nextWeek = new Date(selectedWeekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)
    setSelectedWeekStart(nextWeek)
  }

  // Ir para a semana atual
  const goToCurrentWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    setSelectedWeekStart(new Date(today.setDate(diff)))
  }

  // Formatar o nome do dia da semana
  const formatDayName = (dateStr: string): string => {
    try {
      const parts = dateStr.split("/")
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString("pt-BR", { weekday: "long" })
      }
    } catch (e) {
      console.error("Erro ao formatar nome do dia:", e)
    }
    return dateStr
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Visão Semanal</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {formatWeekRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedWeekStart}
                onSelect={(date) => {
                  if (date) {
                    const day = date.getDay()
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
                    setSelectedWeekStart(new Date(date.setDate(diff)))
                    setIsCalendarOpen(false)
                  }
                }}
                initialFocus
              />
              <div className="p-3 border-t">
                <Button variant="outline" size="sm" className="w-full" onClick={goToCurrentWeek}>
                  Semana Atual
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Saldo da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center">
              <DollarSign className="h-5 w-5 mr-1" />
              <span
                className={`text-2xl font-bold ${calculateWeeklyBalance() >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {formatCurrency(calculateWeeklyBalance())}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Receitas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center">
              <span className="text-2xl font-bold text-green-500">{formatCurrency(calculateWeeklyIncome())}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações por Dia da Semana</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(transactionsByDay()).map(([day, dayTransactions]) => (
            <div key={day} className="mb-6 last:mb-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium capitalize">
                  {formatDayName(day)} ({day})
                </h3>
                <span
                  className={`font-bold ${calculateDailyBalance(dayTransactions) >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {formatCurrency(calculateDailyBalance(dayTransactions))}
                </span>
              </div>

              {dayTransactions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2 border-b">
                  Nenhuma transação registrada para este dia.
                </div>
              ) : (
                <div className="divide-y divide-border border-t border-b">
                  {dayTransactions.map((transaction) => (
                    <div key={transaction.id} className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
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
