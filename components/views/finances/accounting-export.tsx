"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"
import type { Transaction } from "../finances-view"

interface AccountingExportProps {
  transactions: Transaction[]
}

export function AccountingExport({ transactions }: AccountingExportProps) {
  const [reportType, setReportType] = useState("cashflow")
  const [exportFormat, setExportFormat] = useState("excel")
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [period, setPeriod] = useState("custom")

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Função para filtrar transações por período
  const filterTransactionsByPeriod = () => {
    if (!startDate || !endDate) return transactions

    return transactions.filter((transaction) => {
      const [day, month, year] = transaction.date.split("/").map(Number)
      const transactionDate = new Date(year, month - 1, day)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }

  // Função para agrupar transações por categoria
  const groupTransactionsByCategory = (filteredTransactions: Transaction[]) => {
    const categories: { [key: string]: { income: number; expense: number } } = {}

    filteredTransactions.forEach((transaction) => {
      // Extrair categoria da descrição (formato "Categoria: Descrição")
      let category = "Sem categoria"
      if (transaction.description.includes(":")) {
        category = transaction.description.split(":")[0].trim()
      }

      if (!categories[category]) {
        categories[category] = { income: 0, expense: 0 }
      }

      if (transaction.type === "income") {
        categories[category].income += transaction.amount
      } else {
        categories[category].expense += transaction.amount
      }
    })

    return Object.entries(categories).map(([name, values]) => ({
      name,
      income: values.income,
      expense: values.expense,
      balance: values.income - values.expense,
    }))
  }

  // Função para gerar dados do relatório de fluxo de caixa
  const generateCashFlowData = (filteredTransactions: Transaction[]) => {
    // Agrupar por dia
    const dailyData: { [key: string]: { income: number; expense: number } } = {}

    filteredTransactions.forEach((transaction) => {
      const date = transaction.date.split(",")[0]
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expense: 0 }
      }

      if (transaction.type === "income") {
        dailyData[date].income += transaction.amount
      } else {
        dailyData[date].expense += transaction.amount
      }
    })

    return Object.entries(dailyData)
      .sort(([dateA], [dateB]) => {
        const [dayA, monthA, yearA] = dateA.split("/").map(Number)
        const [dayB, monthB, yearB] = dateB.split("/").map(Number)
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime()
      })
      .map(([date, values]) => ({
        date,
        income: values.income,
        expense: values.expense,
        balance: values.income - values.expense,
      }))
  }

  // Função para gerar dados do relatório DRE (Demonstrativo de Resultado)
  const generateIncomeStatementData = (filteredTransactions: Transaction[]) => {
    const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const grossProfit = totalIncome
    const netProfit = totalIncome - totalExpense
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    return {
      totalIncome,
      totalExpense,
      grossProfit,
      netProfit,
      profitMargin,
    }
  }

  // Função para atualizar o período baseado em seleções predefinidas
  const handlePeriodChange = (selectedPeriod: string) => {
    setPeriod(selectedPeriod)
    const today = new Date()

    switch (selectedPeriod) {
      case "thisMonth":
        setStartDate(new Date(today.getFullYear(), today.getMonth(), 1))
        setEndDate(today)
        break
      case "lastMonth":
        setStartDate(new Date(today.getFullYear(), today.getMonth() - 1, 1))
        setEndDate(new Date(today.getFullYear(), today.getMonth(), 0))
        break
      case "thisQuarter":
        const currentQuarter = Math.floor(today.getMonth() / 3)
        setStartDate(new Date(today.getFullYear(), currentQuarter * 3, 1))
        setEndDate(today)
        break
      case "thisYear":
        setStartDate(new Date(today.getFullYear(), 0, 1))
        setEndDate(today)
        break
      case "lastYear":
        setStartDate(new Date(today.getFullYear() - 1, 0, 1))
        setEndDate(new Date(today.getFullYear() - 1, 11, 31))
        break
      // "custom" não faz nada, mantém as datas selecionadas manualmente
    }
  }

  // Função para exportar os dados
  const exportData = () => {
    const filteredTransactions = filterTransactionsByPeriod()

    if (filteredTransactions.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há transações no período selecionado.",
        variant: "destructive",
      })
      return
    }

    let fileName = ""
    let periodText = ""

    if (startDate && endDate) {
      periodText = `${format(startDate, "dd-MM-yyyy")}_a_${format(endDate, "dd-MM-yyyy")}`
    }

    switch (reportType) {
      case "cashflow":
        fileName = `fluxo_de_caixa_${periodText}`
        break
      case "income":
        fileName = `demonstrativo_resultado_${periodText}`
        break
      case "categories":
        fileName = `relatorio_categorias_${periodText}`
        break
      case "transactions":
        fileName = `transacoes_${periodText}`
        break
    }

    // Simulação de download
    toast({
      title: "Relatório exportado com sucesso!",
      description: `O arquivo ${fileName}.${exportFormat} foi baixado.`,
    })
  }

  // Renderizar prévia do relatório
  const renderReportPreview = () => {
    const filteredTransactions = filterTransactionsByPeriod()

    switch (reportType) {
      case "cashflow":
        const cashFlowData = generateCashFlowData(filteredTransactions)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prévia do Fluxo de Caixa</h3>
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-right">Receitas</th>
                    <th className="p-2 text-right">Despesas</th>
                    <th className="p-2 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowData.slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.date}</td>
                      <td className="p-2 text-right text-green-600">{formatCurrency(item.income)}</td>
                      <td className="p-2 text-right text-red-600">{formatCurrency(item.expense)}</td>
                      <td className={`p-2 text-right ${item.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(item.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50">
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-right text-green-600">
                      {formatCurrency(cashFlowData.reduce((sum, item) => sum + item.income, 0))}
                    </th>
                    <th className="p-2 text-right text-red-600">
                      {formatCurrency(cashFlowData.reduce((sum, item) => sum + item.expense, 0))}
                    </th>
                    <th
                      className={`p-2 text-right ${
                        cashFlowData.reduce((sum, item) => sum + item.balance, 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(cashFlowData.reduce((sum, item) => sum + item.balance, 0))}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
            {cashFlowData.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 5 de {cashFlowData.length} registros
              </p>
            )}
          </div>
        )

      case "income":
        const incomeData = generateIncomeStatementData(filteredTransactions)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prévia do Demonstrativo de Resultado</h3>
            <div className="border rounded-md p-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Receita Bruta:</span>
                <span className="text-green-600">{formatCurrency(incomeData.totalIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Despesas Totais:</span>
                <span className="text-red-600">{formatCurrency(incomeData.totalExpense)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Lucro Líquido:</span>
                <span className={incomeData.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(incomeData.netProfit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Margem de Lucro:</span>
                <span className={incomeData.profitMargin >= 0 ? "text-green-600" : "text-red-600"}>
                  {incomeData.profitMargin.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )

      case "categories":
        const categoriesData = groupTransactionsByCategory(filteredTransactions)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prévia do Relatório por Categorias</h3>
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Categoria</th>
                    <th className="p-2 text-right">Receitas</th>
                    <th className="p-2 text-right">Despesas</th>
                    <th className="p-2 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesData.slice(0, 5).map((category, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{category.name}</td>
                      <td className="p-2 text-right text-green-600">{formatCurrency(category.income)}</td>
                      <td className="p-2 text-right text-red-600">{formatCurrency(category.expense)}</td>
                      <td className={`p-2 text-right ${category.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(category.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {categoriesData.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 5 de {categoriesData.length} categorias
              </p>
            )}
          </div>
        )

      case "transactions":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prévia das Transações</h3>
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Descrição</th>
                    <th className="p-2 text-right">Tipo</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 5).map((transaction, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{transaction.date}</td>
                      <td className="p-2">{transaction.description}</td>
                      <td className="p-2 text-right">{transaction.type === "income" ? "Receita" : "Despesa"}</td>
                      <td
                        className={`p-2 text-right ${
                          transaction.type === "income" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTransactions.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 5 de {filteredTransactions.length} transações
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exportação para Contabilidade</h2>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatórios
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Guia Contábil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Relatório</CardTitle>
                <CardDescription>Selecione o tipo de relatório e o formato de exportação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Relatório</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de relatório" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashflow">Fluxo de Caixa</SelectItem>
                      <SelectItem value="income">Demonstrativo de Resultado (DRE)</SelectItem>
                      <SelectItem value="categories">Relatório por Categorias</SelectItem>
                      <SelectItem value="transactions">Lista de Transações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Formato de Exportação</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={period} onValueChange={handlePeriodChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thisMonth">Mês Atual</SelectItem>
                      <SelectItem value="lastMonth">Mês Anterior</SelectItem>
                      <SelectItem value="thisQuarter">Trimestre Atual</SelectItem>
                      <SelectItem value="thisYear">Ano Atual</SelectItem>
                      <SelectItem value="lastYear">Ano Anterior</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Inicial</label>
                    <DatePicker date={startDate} setDate={setStartDate} locale={ptBR} disabled={period !== "custom"} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Final</label>
                    <DatePicker date={endDate} setDate={setEndDate} locale={ptBR} disabled={period !== "custom"} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={exportData} className="w-full">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prévia do Relatório</CardTitle>
                <CardDescription>Visualize como ficará seu relatório antes de exportar</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[300px]">{renderReportPreview()}</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>Guia para Contabilidade</CardTitle>
              <CardDescription>Dicas para organizar suas finanças e facilitar o trabalho contábil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Separação de Despesas</h3>
                <p className="text-muted-foreground">
                  Para empreendedores digitais e MEIs, é fundamental separar despesas pessoais das empresariais. Use
                  categorias específicas para gastos do negócio como "Marketing", "Software", "Equipamentos".
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Documentação Fiscal</h3>
                <p className="text-muted-foreground">
                  Mantenha notas fiscais organizadas e registre-as no sistema. Ao exportar relatórios, você terá um
                  controle completo para apresentar ao seu contador.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Relatórios Recomendados</h3>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Fluxo de Caixa Mensal - para controle de entradas e saídas</li>
                  <li>DRE Trimestral - para análise de resultados</li>
                  <li>Relatório por Categorias - para identificar principais gastos</li>
                  <li>Lista de Transações - para verificação detalhada</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Períodos Importantes</h3>
                <p className="text-muted-foreground">
                  Para MEIs, o período de declaração anual é até maio. Para empresas do Simples Nacional, há obrigações
                  mensais e anuais. Consulte seu contador para datas específicas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
