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

import { Trash2, FileKey2, Archive } from "lucide-react"

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

  const { importToFinance } = usePaymentGateways()

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"accounting" | "annual">("accounting")

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
  const clearAllTransactions = () => {
    setTransactions([])
    setIsConfirmDialogOpen(false)
    toast({
      title: "Todas as transações foram excluídas",
      description: "Todas as transações foram removidas do histórico.",
      variant: "destructive",
    })
  }

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
