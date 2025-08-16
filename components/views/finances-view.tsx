"use client"

import { DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { FinanceSidebar } from "./finances/finance-sidebar"
import { DailyView } from "./finances/daily-view"
import { WeeklyView } from "./finances/weekly-view"
import { MonthlyView } from "./finances/monthly-view"
import { OverviewView } from "./finances/overview-view"
import { TransactionsView } from "./finances/transactions-view"
import { ReportsView } from "./finances/reports-view"
import { GoalsView } from "./finances/goals-view"
import { AccountingExport } from "./finances/accounting-export"
import { GatewayTransactionsView } from "./finances/gateway-transactions-view"
import type { Category } from "./finances/category-manager"
import { usePaymentGateways } from "@/lib/payment-gateway-service" // <-- CORRIGIDO AQUI
import { AnnualReportView } from "./finances/saved-data-view"
import { Plus, Trash2, Menu } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMediaQuery } from "@/hooks/use-media-query"

// Importe o serviço de eventos
import { eventService, EVENTS } from "@/lib/event-service"

// Atualize a interface Transaction para incluir campos adicionais
export interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  date: string
  source?: string // Adicionar campo opcional para a fonte da transação
  imported?: boolean // Adicionar campo para indicar se foi importado
}

export default function FinancesView() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("finance-transactions", [])
  const [categories] = useLocalStorage<Category[]>("finance-categories", [])
  const [type, setType] = useState<"income" | "expense">("income")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [activeView, setActiveView] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("finance-sidebar-collapsed", false)

  // Detectar se estamos em um dispositivo móvel
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Colapsar automaticamente em dispositivos móveis
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [isMobile, setSidebarCollapsed])

  // Estados para edição
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editType, setEditType] = useState<"income" | "expense">("income")
  const [editAmount, setEditAmount] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // Estado para diálogo de confirmação
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSidebarVisible, setIsSidebarVisible] = useState(!isMobile)

  const { importToFinance } = usePaymentGateways()

  // Adicione este useEffect para sincronizar automaticamente ao abrir a aba Financeiro
  useEffect(() => {
    // Verificar se existem transações não importadas
    const result = importToFinance()

    if (result.success && result.count > 0) {
      toast({
        title: "Sincronização automática",
        description: `${result.count} transações foram automaticamente importadas das plataformas.`,
      })
    }
  }, [importToFinance])

  // Adicione um useEffect para escutar eventos de atualização
  useEffect(() => {
    // Inscrever-se para eventos de atualização financeira
    const unsubscribe = eventService.subscribe(EVENTS.FINANCE_UPDATED, (data) => {
      // Recarregar as transações do localStorage
      const updatedTransactions = JSON.parse(localStorage.getItem("finance-transactions") || "[]")
      setTransactions(updatedTransactions)

      // Mostrar notificação se houver dados
      if (data && data.count > 0) {
        toast({
          title: "Dados financeiros atualizados",
          description: `${data.count} transações foram atualizadas do Dashboard de Resultados.`,
        })
      }
    })

    // Limpar inscrição ao desmontar
    return () => unsubscribe()
  }, [toast, setTransactions])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)

    // Em dispositivos móveis, também controlamos a visibilidade
    if (isMobile) {
      setIsSidebarVisible(!sidebarCollapsed)
    }
  }

  const addTransaction = () => {
    if (!amount || !description) return

    // Combinar categoria e descrição
    const fullDescription = category ? `${category}: ${description}` : description

    const newTransaction = {
      id: Date.now().toString(),
      type,
      amount: Number.parseFloat(amount),
      description: fullDescription,
      date: new Date().toLocaleDateString("pt-BR"),
    }

    setTransactions([newTransaction, ...transactions])
    setAmount("")
    setDescription("")
    setCategory("")
    setIsAddDialogOpen(false)

    toast({
      title: "Transação adicionada",
      description: `${type === "income" ? "Receita" : "Despesa"} de ${formatCurrency(Number.parseFloat(amount))} adicionada com sucesso.`,
    })
  }

  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditType(transaction.type)
    setEditAmount(transaction.amount.toString())
    setEditDescription(transaction.description)
  }

  const saveEdit = (id: string) => {
    if (!editAmount || !editDescription) return

    setTransactions(
      transactions.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              type: editType,
              amount: Number.parseFloat(editAmount),
              description: editDescription,
              date: `${transaction.date.split("(")[0]} (Editado: ${new Date().toLocaleTimeString()})`,
            }
          : transaction,
      ),
    )

    setEditingId(null)

    toast({
      title: "Transação atualizada",
      description: "A transação foi atualizada com sucesso.",
    })
  }

  const editTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions(
      transactions.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              ...updatedFields,
            }
          : transaction,
      ),
    )

    toast({
      title: "Transação atualizada",
      description: "A transação foi atualizada com sucesso.",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter((transaction) => transaction.id !== id))

    toast({
      title: "Transação excluída",
      description: "A transação foi excluída com sucesso.",
    })
  }

  const clearAllTransactions = () => {
    setTransactions([])
    setIsConfirmDialogOpen(false)

    toast({
      title: "Todas as transações foram excluídas",
      description: "Todas as transações foram removidas do histórico.",
      variant: "destructive",
    })
  }

  const calculateBalance = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === "income" ? total + transaction.amount : total - transaction.amount
    }, 0)
  }

  const calculateIncome = () => {
    return transactions.filter((t) => t.type === "income").reduce((total, t) => total + t.amount, 0)
  }

  const calculateExpenses = () => {
    return transactions.filter((t) => t.type === "expense").reduce((total, t) => total + t.amount, 0)
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Atualize a função renderActiveView para passar a propriedade source para TransactionsView
  const renderActiveView = () => {
    switch (activeView) {
      case "daily":
        return <DailyView transactions={transactions} />
      case "weekly":
        return <WeeklyView transactions={transactions} />
      case "monthly":
        return <MonthlyView transactions={transactions} />
      case "transactions":
        return <TransactionsView transactions={transactions} onEdit={editTransaction} onDelete={deleteTransaction} />
      case "reports":
        return <ReportsView transactions={transactions} />
      case "goals":
        return <GoalsView transactions={transactions} />
      case "accounting":
        return <AccountingExport transactions={transactions} />
      case "annual":
        return <AnnualReportView />
      case "gateways":
        return (
          <GatewayTransactionsView
            onImportComplete={(count, total) => {
              if (count > 0) {
                toast({
                  title: "Importação concluída",
                  description: `${count} transações importadas com sucesso, totalizando ${formatCurrency(total)}.`,
                })
              }
            }}
          />
        )
      case "overview":
      default:
        return <OverviewView transactions={transactions} />
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar com toggle de visibilidade */}
      <div
        className={`
        fixed md:relative z-20 transition-all duration-300 ease-in-out
        ${isMobile && !isSidebarVisible ? "-translate-x-full" : "translate-x-0"}
      `}
      >
        <FinanceSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Overlay para fechar o menu em dispositivos móveis */}
      {isMobile && isSidebarVisible && (
        <div className="fixed inset-0 bg-black/20 z-10" onClick={() => setIsSidebarVisible(false)} />
      )}

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center">
            {/* Botão de menu para dispositivos móveis */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 h-8 w-8 bg-black text-white rounded-md"
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
          </div>

          <div className="flex space-x-2">
            {transactions.length > 0 && (
              <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="text-xs sm:text-sm">
                    <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Limpar Tudo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirmar exclusão</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja excluir todas as transações? Esta ação não pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 justify-end">
                    <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={clearAllTransactions}>
                      Sim, excluir tudo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs sm:text-sm">
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Adicionar Transação</span>
                  <span className="xs:hidden">Adicionar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Transação</DialogTitle>
                  <DialogDescription>Preencha os detalhes da transação abaixo.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="transaction-type">Tipo</Label>
                      <Select value={type} onValueChange={(value) => setType(value as "income" | "expense")}>
                        <SelectTrigger id="transaction-type">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transaction-amount">Valor</Label>
                      <Input
                        id="transaction-amount"
                        placeholder="0,00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction-category">Categoria (opcional)</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="transaction-category">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction-description">Descrição</Label>
                    <Input
                      id="transaction-description"
                      placeholder="Descrição da transação"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addTransaction}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {renderActiveView()}
      </div>
    </div>
  )
}
