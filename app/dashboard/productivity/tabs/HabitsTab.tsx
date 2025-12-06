"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

type Habit = {
  id: string
  title: string
  completed: boolean
  streak: number
}

interface HabitsTabProps {
  habits: Habit[]
  addHabit: (title: string) => Promise<void> | void
  toggleHabit: (id: string) => Promise<void> | void
  deleteHabit: (id: string) => Promise<void> | void
}

const HabitsTab = ({ habits, addHabit, toggleHabit, deleteHabit }: HabitsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newHabitTitle, setNewHabitTitle] = useState("")

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um título para o hábito.",
        variant: "destructive",
      })
      return
    }

    await addHabit(newHabitTitle)
    setNewHabitTitle("")
    setIsDialogOpen(false)

    toast({
      title: "Hábito adicionado",
      description: "Seu hábito foi adicionado com sucesso.",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Hábitos Diários</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Hábito
        </Button>
      </div>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Você ainda não tem hábitos definidos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {habits.map((habit) => (
            <Card key={habit.id} className={habit.completed ? "border-green-500/50 bg-green-500/5" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleHabit(habit.id)}
                      aria-label={habit.completed ? "Marcar como não concluído" : "Marcar como concluído"}
                    >
                      {habit.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${habit.completed ? "line-through text-muted-foreground" : ""}`}>
                        {habit.title}
                      </p>
                      <p className="text-xs text-muted-foreground">Sequência: {habit.streak} dias</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo para adicionar hábito */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Hábito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="habit-title">Título do Hábito</Label>
              <Input
                id="habit-title"
                placeholder="Ex: Beber 2L de água"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddHabit}>Adicionar Hábito</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HabitsTab
