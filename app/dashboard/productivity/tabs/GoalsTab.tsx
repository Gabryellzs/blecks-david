"use client"

import { useState } from "react"
import { Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

type Goal = {
  id: string
  title: string
  progress: number
  daily_checks: Record<string, boolean>
}

interface GoalsTabProps {
  diasDaSemana: string[]
  currentDay: string
  goals: Goal[]
  addGoal: (title: string) => Promise<void> | void
  toggleDay: (goalId: string, day: string, value: boolean) => Promise<void> | void
  deleteGoal: (id: string) => Promise<void> | void
}

const GoalsTab = ({
  diasDaSemana,
  currentDay,
  goals,
  addGoal,
  toggleDay,
  deleteGoal,
}: GoalsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState("")

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um título para a meta.",
        variant: "destructive",
      })
      return
    }

    await addGoal(newGoalTitle)
    setNewGoalTitle("")
    setIsDialogOpen(false)

    toast({
      title: "Meta adicionada",
      description: "Sua meta semanal foi adicionada com sucesso.",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Metas da Semana</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Você ainda não tem metas definidas para esta semana.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{goal.title}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Progress value={goal.progress ?? 0} className="h-2" />
                  <span className="text-sm font-medium">{goal.progress ?? 0}%</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {diasDaSemana.map((day) => (
                    <div key={day} className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-1">{day.substring(0, 3)}</span>
                      <Checkbox
                        checked={goal.daily_checks?.[day] ?? false}
                        onCheckedChange={(checked) => toggleDay(goal.id, day, checked === true)}
                        className={day === currentDay ? "border-primary" : ""}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo para adicionar meta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Meta Semanal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Título da Meta</Label>
              <Input
                id="goal-title"
                placeholder="Ex: Estudar 1 hora por dia"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddGoal}>Adicionar Meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GoalsTab
