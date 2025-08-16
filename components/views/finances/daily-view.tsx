"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Calendar, DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import type { Transaction } from "../finances-view"

interface DailyViewProps {
  transactions: Transaction[]
}

export function DailyView({ transactions }: DailyViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Formatar a data para exibição
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Função para normalizar datas para comparação
  const normalizeDate = (dateStr: string): string => {
    // Extrair apenas a parte da data (sem a hora)
    const datePart = dateStr.split(",")[0].trim()

    // Verificar se a data está no formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
      return datePart
    }

    // Caso contrário, tentar converter para o formato esperado
    try {
      const parts = datePart.split("/")
      if (parts.length === 3) {
        return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`
      }
    } catch (e) {
      console.error("Erro ao normalizar data:", e)
    }

    return datePart
  }

  // Formatar a data selecionada para comparação
  const formatSelectedDateForComparison = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Filtrar transações pela data selecionada
  const dailyTransactions = transactions.filter((transaction) => {
    const normalizedTransactionDate = normalizeDate(transaction.date)
    const normalizedSelectedDate = formatSelectedDateForComparison(selectedDate)

    return normalizedTransactionDate === normalizedSelectedDate
  })

  // Calcular o saldo do dia
  const calculateDailyBalance = () => {
    return dailyTransactions.reduce((total, transaction) => {
      return transaction.type === "income" ? total + transaction.amount : total - transaction.amount
    }, 0)
  }

  // Calcular receitas do dia
  const calculateDailyIncome = () => {
    return dailyTransactions.filter((t) => t.type === "income").reduce((total, t) => total + t.amount, 0)
  }

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Navegar para o dia anterior
  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate)
    previousDay.setDate(previousDay.getDate() - 1)
    setSelectedDate(previousDay)
  }

  // Navegar para o próximo dia
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    setSelectedDate(nextDay)
  }

  // Ir para hoje
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Visão Diária</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {formatDate(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date)
                    setIsCalendarOpen(false)
                  }
                }}
                initialFocus
              />
              <div className="p-3 border-t">
                <Button variant="outline" size="sm" className="w-full" onClick={goToToday}>
                  Hoje
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Saldo do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center">
              <DollarSign className="h-5 w-5 mr-1" />
              <span
                className={`text-2xl font-bold ${calculateDailyBalance() >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {formatCurrency(calculateDailyBalance())}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Receitas do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center">
              <span className="text-2xl font-bold text-green-500">{formatCurrency(calculateDailyIncome())}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma transação registrada para este dia.</div>
          ) : (
            <div className="divide-y divide-border">
              {dailyTransactions.map((transaction) => (
                <div key={transaction.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
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
        </CardContent>
      </Card>
    </div>
  )
}
