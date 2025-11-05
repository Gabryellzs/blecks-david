"use client"

import { useState, useEffect } from "react"
import { DialogFooter } from "@/components/ui/dialog"
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

import { AccountingExport } from "./finances/accounting-export"
import type { Category } from "./finances/category-manager"
import { usePaymentGateways } from "@/lib/payment-gateway-service"
import { AnnualReportView } from "./finances/saved-data-view"

import { Plus, Trash2, FileKey2, Archive } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// eventos
import { eventService, EVENTS } from "@/lib/event-service"

// ===================== Tipos =====================
export interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  date: string
  source?: string
  imported?: boolean
}

// ===================== Componente =====================
export default function FinancesView() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("finance-transactions", [])
  const [categories] = useLocalStorage<Category[]>("finance-categories", [])

  const [type, setType] = useState<"income" | "expense">("income")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  // edição inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editType, setEditType] = useState<"income" | "expense">("income")
  const [editAmount, setEditAmount] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // diálogos
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // “abas” no estilo chip
  const [activeTab, setActiveTab] = useState<"accounting" | "annual">("accounting")

  const { importToFinance } = usePaymentGateways()

  // sync automática ao abrir
  useEffect(() => {
    const result = importToFinance()
    if (result.success && result.count > 0) {
      toast({
        title: "Sincronização automática",
        description: `${result.count} transações foram automaticamente importadas das plataformas.`,
      })
    }
  }, [importToFinance])

  // ouvir eventos de atualização
  useEffect(() => {
    const unsubscribe = eventService.subscribe(EVENTS.FINANCE_UPDATED, (data) => {
      const updatedTransactions = JSON.parse(localStorage.getItem("finance-transactions") || "[]")
      setTransactions(updatedTransactions)

      if (data && data.count > 0) {
        toast({
          title: "Dados financeiros atualizados",
          description: `${data.count} transações foram atualizadas do Dashboard de Resultados.`,
        })
      }
    })
    return () => unsubscribe()
  }, [setTransactions])

  // ===================== Ações =====================
  const addTransaction = () => {
    if (!amount || !description) return

    const fullDescription = category && category !== "none" ? `${category}: ${description}` : description

    const newTransaction: Transaction = {
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
      description: `${type === "income" ? "Receita" : "Despesa"} de ${formatCurrency(
        Number.parseFloat(amount),
      )} adicionada com sucesso.`,
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
      transactions.map((t) =>
        t.id === id
          ? {
              ...t,
              type: editType,
              amount: Number.parseFloat(editAmount),
              description: editDescription,
              date: `${t.date.split("(")[0]} (Editado: ${new Date().toLocaleTimeString()})`,
            }
          : t,
      ),
    )

    setEditingId(null)
    toast({ title: "Transação atualizada", description: "Sua transação foi atualizada com sucesso." })
  }

  const editTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions(transactions.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)))
    toast({ title: "Transação atualizada", description: "A transação foi atualizada com sucesso." })
  }

  const cancelEdit = () => setEditingId(null)

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id))
    toast({ title: "Transação excluída", description: "A transação foi excluída com sucesso." })
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

  // ===================== Helpers =====================
  const calculateBalance = () =>
    transactions.reduce((total, t) => (t.type === "income" ? total + t.amount : total - t.amount), 0)

  const calculateIncome = () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)

  const calculateExpenses = () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })

  // ===================== UI =====================
  return (
    <div className="flex h-full w-full flex-col p-4 sm:p-6 gap-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center">
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
                    <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
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

      {/* ====== Botões de navegação (chips) ====== */}
      <div className="w-full flex items-center gap-2">
        <Button
          variant={activeTab === "accounting" ? "default" : "outline"}
          onClick={() => setActiveTab("accounting")}
          className={`h-8 px-3 rounded-full ${activeTab === "accounting" ? "" : "bg-transparent"}`}
        >
          <FileKey2 className="mr-2 h-4 w-4" />
          Contabilidade
        </Button>

        <Button
          variant={activeTab === "annual" ? "default" : "outline"}
          onClick={() => setActiveTab("annual")}
          className={`h-8 px-3 rounded-full ${activeTab === "annual" ? "" : "bg-transparent"}`}
        >
          <Archive className="mr-2 h-4 w-4" />
          Dados Salvos
        </Button>
      </div>

      {/* ====== Conteúdo ====== */}
      <div className="flex-1 mt-4">
        {activeTab === "accounting" ? (
          <AccountingExport transactions={transactions} />
        ) : (
          <AnnualReportView />
        )}
      </div>
    </div>
  )
}
