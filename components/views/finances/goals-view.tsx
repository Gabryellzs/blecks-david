"use client"

import { useState } from "react"
import { Calendar, Edit, Plus, Save, Trash, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Transaction } from "../finances-view"

export interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  type: "saving" | "revenue" | "expense-reduction"
  category?: string
}

interface GoalsViewProps {
  transactions: Transaction[]
}

export function GoalsView({ transactions }: GoalsViewProps) {
  const [goals, setGoals] = useLocalStorage<FinancialGoal[]>("finance-goals", [
    {
      id: "1",
      name: "Faturamento Mensal",
      targetAmount: 10000,
      currentAmount: 0,
      deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
      type: "revenue",
    },
    {
      id: "2",
      name: "Fundo de Emergência",
      targetAmount: 5000,
      currentAmount: 1500,
      deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0).toISOString(),
      type: "saving",
    },
  ])

  const [newGoal, setNewGoal] = useState<Omit<FinancialGoal, "id" | "currentAmount">>({
    name: "",
    targetAmount: 0,
    deadline: new Date().toISOString(),
    type: "saving",
  })

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editTargetAmount, setEditTargetAmount] = useState(0)
  const [editDeadline, setEditDeadline] = useState<Date>(new Date())
  const [editType, setEditType] = useState<"saving" | "revenue" | "expense-reduction">("saving")
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false)

  // Atualizar os valores atuais das metas com base nas transações
  const updateGoalProgress = () => {
    const updatedGoals = goals.map((goal) => {
      let currentAmount = goal.currentAmount

      // Para metas de receita, somar todas as receitas do período atual
      if (goal.type === "revenue") {
        const today = new Date()
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        currentAmount = transactions
          .filter((t) => {
            const transactionDate = new Date(t.date.split(",")[0].split("/").reverse().join("-"))
            return t.type === "income" && transactionDate >= firstDayOfMonth && transactionDate <= today
          })
          .reduce((sum, t) => sum + t.amount, 0)
      }

      // Para metas de redução de despesas, calcular a diferença
      if (goal.type === "expense-reduction") {
        // Implementação simplificada - em um caso real, precisaríamos comparar com períodos anteriores
        const today = new Date()
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const currentExpenses = transactions
          .filter((t) => {
            const transactionDate = new Date(t.date.split(",")[0].split("/").reverse().join("-"))
            return t.type === "expense" && transactionDate >= firstDayOfMonth && transactionDate <= today
          })
          .reduce((sum, t) => sum + t.amount, 0)

        // Assumindo que a meta é reduzir para o valor alvo
        currentAmount = Math.max(0, goal.targetAmount - currentExpenses)
      }

      return { ...goal, currentAmount }
    })

    setGoals(updatedGoals)
  }

  // Atualizar o progresso das metas quando as transações mudarem
  useState(() => {
    updateGoalProgress()
  })

  const addGoal = () => {
    if (!newGoal.name.trim() || newGoal.targetAmount <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const newId = Date.now().toString()
    setGoals([...goals, { ...newGoal, id: newId, currentAmount: 0 }])
    setNewGoal({
      name: "",
      targetAmount: 0,
      deadline: new Date().toISOString(),
      type: "saving",
    })

    toast({
      title: "Meta adicionada",
      description: `A meta "${newGoal.name}" foi adicionada com sucesso.`,
    })
  }

  const startEditing = (goal: FinancialGoal) => {
    setEditingId(goal.id)
    setEditName(goal.name)
    setEditTargetAmount(goal.targetAmount)
    setEditDeadline(new Date(goal.deadline))
    setEditType(goal.type)
  }

  const saveEdit = (id: string) => {
    if (!editName.trim() || editTargetAmount <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setGoals(
      goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              name: editName,
              targetAmount: editTargetAmount,
              deadline: editDeadline.toISOString(),
              type: editType,
            }
          : goal,
      ),
    )

    setEditingId(null)

    toast({
      title: "Meta atualizada",
      description: `A meta "${editName}" foi atualizada com sucesso.`,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const deleteGoal = (id: string) => {
    const goalToDelete = goals.find((g) => g.id === id)

    setGoals(goals.filter((goal) => goal.id !== id))

    toast({
      title: "Meta excluída",
      description: `A meta "${goalToDelete?.name}" foi excluída com sucesso.`,
    })
  }

  // Formatar valores monetários
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  // Calcular o progresso da meta
  const calculateProgress = (goal: FinancialGoal): number => {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
  }

  // Verificar se a meta está atrasada
  const isGoalOverdue = (goal: FinancialGoal): boolean => {
    const today = new Date()
    const deadline = new Date(goal.deadline)
    return deadline < today && calculateProgress(goal) < 100
  }

  // Verificar se a meta está próxima do prazo
  const isGoalNearDeadline = (goal: FinancialGoal): boolean => {
    const today = new Date()
    const deadline = new Date(goal.deadline)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0 && calculateProgress(goal) < 100
  }

  // Obter o texto de status da meta
  const getGoalStatus = (goal: FinancialGoal): { text: string; color: string } => {
    const progress = calculateProgress(goal)

    if (progress >= 100) {
      return { text: "Concluída", color: "text-green-500" }
    }

    if (isGoalOverdue(goal)) {
      return { text: "Atrasada", color: "text-red-500" }
    }

    if (isGoalNearDeadline(goal)) {
      return { text: "Prazo próximo", color: "text-amber-500" }
    }

    return { text: "Em andamento", color: "text-blue-500" }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Metas Financeiras</h2>

      <Card>
        <CardHeader>
          <CardTitle>Nova Meta</CardTitle>
          <CardDescription>Defina objetivos financeiros para seu negócio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nome da Meta</Label>
            <Input
              id="goal-name"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              placeholder="Ex: Faturamento Mensal, Fundo de Emergência..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-amount">Valor Alvo</Label>
            <Input
              id="goal-amount"
              type="number"
              value={newGoal.targetAmount || ""}
              onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Prazo</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal" id="goal-deadline">
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? selectedDate.toLocaleDateString("pt-BR") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      setNewGoal({ ...newGoal, deadline: date.toISOString() })
                      setIsCalendarOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-type">Tipo de Meta</Label>
            <Select value={newGoal.type} onValueChange={(value) => setNewGoal({ ...newGoal, type: value as any })}>
              <SelectTrigger id="goal-type">
                <SelectValue placeholder="Selecione o tipo de meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saving">Economia/Poupança</SelectItem>
                <SelectItem value="revenue">Meta de Faturamento</SelectItem>
                <SelectItem value="expense-reduction">Redução de Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={addGoal}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Meta
          </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className={`
            ${isGoalOverdue(goal) ? "border-red-200" : ""}
            ${isGoalNearDeadline(goal) ? "border-amber-200" : ""}
            ${calculateProgress(goal) >= 100 ? "border-green-200" : ""}
          `}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{goal.name}</CardTitle>
                  <CardDescription>Prazo: {formatDate(goal.deadline)}</CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => startEditing(goal)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteGoal(goal.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === goal.id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`edit-name-${goal.id}`}>Nome</Label>
                    <Input id={`edit-name-${goal.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`edit-amount-${goal.id}`}>Valor Alvo</Label>
                    <Input
                      id={`edit-amount-${goal.id}`}
                      type="number"
                      value={editTargetAmount || ""}
                      onChange={(e) => setEditTargetAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`edit-deadline-${goal.id}`}>Prazo</Label>
                    <Popover open={isEditCalendarOpen} onOpenChange={setIsEditCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          id={`edit-deadline-${goal.id}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {editDeadline ? editDeadline.toLocaleDateString("pt-BR") : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editDeadline}
                          onSelect={(date) => {
                            if (date) {
                              setEditDeadline(date)
                              setIsEditCalendarOpen(false)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`edit-type-${goal.id}`}>Tipo de Meta</Label>
                    <Select value={editType} onValueChange={(value) => setEditType(value as any)}>
                      <SelectTrigger id={`edit-type-${goal.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saving">Economia/Poupança</SelectItem>
                        <SelectItem value="revenue">Meta de Faturamento</SelectItem>
                        <SelectItem value="expense-reduction">Redução de Despesas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={cancelEdit}>
                      <X className="mr-1 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button onClick={() => saveEdit(goal.id)}>
                      <Save className="mr-1 h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Progresso:</span>
                      <span className={`ml-2 text-sm font-medium ${getGoalStatus(goal).color}`}>
                        {getGoalStatus(goal).text}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{calculateProgress(goal)}%</div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                    <div
                      className={`h-2.5 rounded-full ${
                        calculateProgress(goal) >= 100
                          ? "bg-green-500"
                          : isGoalOverdue(goal)
                            ? "bg-red-500"
                            : isGoalNearDeadline(goal)
                              ? "bg-amber-500"
                              : "bg-blue-500"
                      }`}
                      style={{ width: `${calculateProgress(goal)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="font-medium">Atual:</span> {formatCurrency(goal.currentAmount)}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Meta:</span> {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    {goal.type === "saving" && "Meta de economia"}
                    {goal.type === "revenue" && "Meta de faturamento"}
                    {goal.type === "expense-reduction" && "Meta de redução de despesas"}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
