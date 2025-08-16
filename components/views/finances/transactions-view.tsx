"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Transaction } from "../finances-view"
import type { Category } from "./category-manager"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TransactionsViewProps {
  transactions: Transaction[]
  onEdit: (id: string, transaction: Partial<Transaction>) => void
  onDelete: (id: string) => void
}

export function TransactionsView({ transactions, onEdit, onDelete }: TransactionsViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [categories] = useLocalStorage<Category[]>("finance-categories", [])

  // Estados para edição
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editType, setEditType] = useState<"income" | "expense">("income")
  const [editAmount, setEditAmount] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState<string>("")

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Extrair categoria da descrição
  const getCategoryFromDescription = (description: string): string => {
    return description.includes(": ") ? description.split(": ")[0] : "Sem categoria"
  }

  // Filtrar transações
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Ordenar transações
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.date.split(",")[0].split("/").reverse().join("-"))
      const dateB = new Date(b.date.split(",")[0].split("/").reverse().join("-"))
      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    } else if (sortBy === "amount") {
      return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount
    } else {
      return sortOrder === "asc"
        ? a.description.localeCompare(b.description)
        : b.description.localeCompare(a.description)
    }
  })

  // Iniciar edição de uma transação
  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditType(transaction.type)
    setEditAmount(transaction.amount.toString())

    // Extrair categoria e descrição
    const hasCategory = transaction.description.includes(": ")
    if (hasCategory) {
      const [category, description] = transaction.description.split(": ")
      setEditCategory(category)
      setEditDescription(description)
    } else {
      setEditCategory("")
      setEditDescription(transaction.description)
    }
  }

  // Salvar edição
  const saveEdit = (id: string) => {
    if (!editAmount || !editDescription) return

    // Combinar categoria e descrição
    const fullDescription = editCategory ? `${editCategory}: ${editDescription}` : editDescription

    onEdit(id, {
      type: editType,
      amount: Number.parseFloat(editAmount),
      description: fullDescription,
      date: `${new Date().toLocaleDateString("pt-BR")} (Editado: ${new Date().toLocaleTimeString()})`,
    })

    setEditingId(null)
  }

  // Cancelar edição
  const cancelEdit = () => {
    setEditingId(null)
  }

  // Obter todas as categorias únicas das transações
  const getAllCategories = () => {
    const uniqueCategories = new Set<string>()

    transactions.forEach((transaction) => {
      const category = getCategoryFromDescription(transaction.description)
      uniqueCategories.add(category)
    })

    return Array.from(uniqueCategories)
  }

  const transactionCategories = getAllCategories()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")

  const deleteTransaction = (id: string) => {
    onDelete(id)
  }

  const filteredTransactions2 = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">Histórico de Transações</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Input
            placeholder="Pesquisar transações..."
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTransactions2.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
        </div>
      ) : (
        <>
          {/* Versão para desktop */}
          <div className="hidden sm:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions2.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "income" ? "success" : "destructive"}>
                        {transaction.type === "income" ? "Receita" : "Despesa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => startEditing(transaction)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(transaction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Versão para mobile */}
          <div className="sm:hidden space-y-4">
            {filteredTransactions2.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                    <Badge variant={transaction.type === "income" ? "success" : "destructive"}>
                      {transaction.type === "income" ? "Receita" : "Despesa"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEditing(transaction)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTransaction(transaction.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {editingId && (
        <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Tipo</Label>
                  <Select value={editType} onValueChange={(value) => setEditType(value as "income" | "expense")}>
                    <SelectTrigger id="edit-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Valor</Label>
                  <Input
                    id="edit-amount"
                    placeholder="0,00"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Input
                  id="edit-description"
                  placeholder="Descrição da transação"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={cancelEdit}>
                Cancelar
              </Button>
              <Button onClick={() => saveEdit(editingId)}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
