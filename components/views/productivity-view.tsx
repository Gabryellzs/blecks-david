"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Circle, Plus, Trash, Clock, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useNotification } from "@/components/notification-provider"

// Interfaces para os tipos de dados
interface WeeklyGoal {
  id: string
  title: string
  progress: number // 0-100
  dailyChecks: {
    [day: string]: boolean // segunda, terca, quarta, etc.
  }
}

interface Habit {
  id: string
  title: string
  completed: boolean
  streak: number
  lastCompleted?: string
}

interface TimeBlock {
  id: string
  hour: string
  title: string
  description?: string
  tags: string[]
  notified?: boolean // Para controlar se já foi enviada notificação
}

interface Tag {
  id: string
  name: string
  color: string
}

interface Note {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  favorite: boolean
}

interface Category {
  id: string
  name: string
  color: string
}

// Dias da semana em português
const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

// Cores para tags
const TAG_COLORS = [
  { name: "Vermelho", value: "bg-red-500" },
  { name: "Laranja", value: "bg-orange-500" },
  { name: "Amarelo", value: "bg-yellow-500" },
  { name: "Verde", value: "bg-green-500" },
  { name: "Azul", value: "bg-blue-500" },
  { name: "Roxo", value: "bg-purple-500" },
  { name: "Rosa", value: "bg-pink-500" },
  { name: "Cinza", value: "bg-gray-500" },
]

// Tags predefinidas
const DEFAULT_TAGS: Tag[] = [
  { id: "1", name: "Urgente", color: "bg-red-500" },
  { id: "2", name: "Importante", color: "bg-orange-500" },
  { id: "3", name: "Pra depois", color: "bg-blue-500" },
  { id: "4", name: "Rápido", color: "bg-green-500" },
  { id: "5", name: "Mental", color: "bg-purple-500" },
]

// Categorias predefinidas para anotações
const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Pessoal", color: "bg-blue-500" },
  { id: "2", name: "Trabalho", color: "bg-green-500" },
  { id: "3", name: "Estudos", color: "bg-purple-500" },
  { id: "4", name: "Projetos", color: "bg-orange-500" },
  { id: "5", name: "Ideias", color: "bg-yellow-500" },
]

export default function ProductivityView() {
  // Sistema de notificações
  const { addNotification } = useNotification()

  // Estados para as diferentes funcionalidades
  const [weeklyGoals, setWeeklyGoals] = useLocalStorage<WeeklyGoal[]>("productivity-weekly-goals", [])
  const [habits, setHabits] = useLocalStorage<Habit[]>("productivity-habits", [])
  const [timeBlocks, setTimeBlocks] = useLocalStorage<TimeBlock[]>("productivity-time-blocks", [])
  const [tags, setTags] = useLocalStorage<Tag[]>("productivity-tags", DEFAULT_TAGS)

  // Estados para anotações
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", [])
  const [categories, setCategories] = useLocalStorage<Category[]>("note-categories", DEFAULT_CATEGORIES)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Estados para diálogos
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  // Estados para formulários
  const [newGoal, setNewGoal] = useState({ title: "" })
  const [newHabit, setNewHabit] = useState({ title: "" })
  const [newBlock, setNewBlock] = useState({ hour: "08:00", title: "", description: "", tags: [] as string[] })
  const [newTag, setNewTag] = useState({ name: "", color: "bg-blue-500" })
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
  })
  const [newCategory, setNewCategory] = useState({ name: "", color: "bg-blue-500" })

  // Estado para edição
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  // Estado para o relógio atual (horário de Brasília)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Obter o dia atual da semana
  const getCurrentDay = () => {
    const today = new Date().getDay()
    // Converter de 0-6 (domingo-sábado) para nosso formato (segunda-domingo)
    return diasDaSemana[today === 0 ? 6 : today - 1]
  }

  const currentDay = getCurrentDay()

  // Atualizar o relógio a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Atualiza a cada minuto

    return () => clearInterval(timer)
  }, [])

  // Verificar blocos de tempo para notificações
  useEffect(() => {
    // Função para verificar se algum bloco de tempo está programado para agora
    const checkTimeBlocks = () => {
      const now = new Date()
      const currentHour = now.getHours().toString().padStart(2, "0")
      const currentMinute = now.getMinutes().toString().padStart(2, "0")
      const currentTimeString = `${currentHour}:${currentMinute}`

      // Encontrar blocos que precisam ser notificados
      const blocksToNotify = timeBlocks.filter((block) => {
        // Verificar se o formato da hora é HH:MM
        if (block.hour.match(/^\d{1,2}:\d{2}$/)) {
          // Normalizar para o formato HH:MM
          const [hours, minutes] = block.hour.split(":")
          const normalizedHour = hours.padStart(2, "0")
          const blockTime = `${normalizedHour}:${minutes}`

          // Se o horário atual corresponde ao bloco e ainda não foi notificado
          return blockTime === currentTimeString && !block.notified
        }
        return false
      })

      // Só processar se houver blocos para notificar
      if (blocksToNotify.length > 0) {
        // Enviar notificações
        blocksToNotify.forEach((block) => {
          addNotification({
            title: "Compromisso Agendado!",
            message: `${block.hour} - ${block.title}`,
            type: "alert",
            category: "productivity",
            actions: [
              {
                label: "Ver Detalhes",
                onClick: () => {
                  window.dispatchEvent(new CustomEvent("navigate-to-view", { detail: "productivity" }))
                },
              },
            ],
          })
        })

        // Atualizar os blocos notificados
        setTimeBlocks((prev) =>
          prev.map((block) => {
            if (blocksToNotify.some((b) => b.id === block.id)) {
              return { ...block, notified: true }
            }
            return block
          }),
        )
      }
    }

    // Verificar a cada 15 segundos para ser mais responsivo
    const timer = setInterval(checkTimeBlocks, 15000)
    // Verificar também imediatamente
    checkTimeBlocks()

    return () => clearInterval(timer)
  }, [timeBlocks, addNotification, setTimeBlocks])

  // Resetar as notificações dos blocos à meia-noite
  useEffect(() => {
    const resetNotifications = () => {
      const now = new Date()
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setTimeBlocks((prev) => prev.map((block) => ({ ...block, notified: false })))
      }
    }

    const timer = setInterval(resetNotifications, 60000)
    return () => clearInterval(timer)
  }, [setTimeBlocks])

  // Funções para metas semanais
  const addWeeklyGoal = () => {
    if (!newGoal.title.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um título para a meta.",
        variant: "destructive",
      })
      return
    }

    const dailyChecks = diasDaSemana.reduce(
      (acc, day) => {
        acc[day] = false
        return acc
      },
      {} as { [key: string]: boolean },
    )

    const goal: WeeklyGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      progress: 0,
      dailyChecks,
    }

    setWeeklyGoals([...weeklyGoals, goal])
    setNewGoal({ title: "" })
    setIsGoalDialogOpen(false)

    toast({
      title: "Meta adicionada",
      description: "Sua meta semanal foi adicionada com sucesso.",
    })
  }

  const updateGoalProgress = (goalId: string, day: string, checked: boolean) => {
    setWeeklyGoals(
      weeklyGoals.map((goal) => {
        if (goal.id === goalId) {
          const updatedChecks = { ...goal.dailyChecks, [day]: checked }
          const checkedDays = Object.values(updatedChecks).filter(Boolean).length
          const progress = Math.round((checkedDays / diasDaSemana.length) * 100)

          return {
            ...goal,
            dailyChecks: updatedChecks,
            progress,
          }
        }
        return goal
      }),
    )
  }

  const deleteGoal = (id: string) => {
    setWeeklyGoals(weeklyGoals.filter((goal) => goal.id !== id))
    toast({
      title: "Meta removida",
      description: "A meta foi removida com sucesso.",
    })
  }

  // Funções para hábitos
  const addHabit = () => {
    if (!newHabit.title.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um título para o hábito.",
        variant: "destructive",
      })
      return
    }

    const habit: Habit = {
      id: Date.now().toString(),
      title: newHabit.title,
      completed: false,
      streak: 0,
    }

    setHabits([...habits, habit])
    setNewHabit({ title: "" })
    setIsHabitDialogOpen(false)

    toast({
      title: "Hábito adicionado",
      description: "Seu hábito foi adicionado com sucesso.",
    })
  }

  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split("T")[0]

    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          // Se já estava completo hoje, desmarcar
          if (habit.completed && habit.lastCompleted === today) {
            return {
              ...habit,
              completed: false,
              streak: Math.max(0, habit.streak - 1),
            }
          }

          // Se não estava completo, marcar como completo
          return {
            ...habit,
            completed: true,
            streak: habit.streak + 1,
            lastCompleted: today,
          }
        }
        return habit
      }),
    )
  }

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((habit) => habit.id !== id))
    toast({
      title: "Hábito removido",
      description: "O hábito foi removido com sucesso.",
    })
  }

  // Funções para blocos de tempo
  const addTimeBlock = () => {
    if (!newBlock.hour || !newBlock.title.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o horário e o título.",
        variant: "destructive",
      })
      return
    }

    // Garantir que o formato da hora seja válido (HH:MM)
    let formattedHour = newBlock.hour
    if (!formattedHour.match(/^\d{1,2}:\d{2}$/)) {
      toast({
        title: "Erro",
        description: "O formato do horário deve ser HH:MM.",
        variant: "destructive",
      })
      return
    }

    // Normalizar o formato da hora (adicionar zero à esquerda se necessário)
    const [hours, minutes] = formattedHour.split(":")
    formattedHour = `${hours.padStart(2, "0")}:${minutes}`

    const block: TimeBlock = {
      id: Date.now().toString(),
      hour: formattedHour,
      title: newBlock.title,
      description: newBlock.description || "",
      tags: newBlock.tags,
      notified: false,
    }

    setTimeBlocks([...timeBlocks, block])
    setNewBlock({ hour: "08:00", title: "", description: "", tags: [] })
    setIsBlockDialogOpen(false)

    toast({
      title: "Bloco adicionado",
      description: "Seu bloco de tempo foi adicionado com sucesso.",
    })
  }

  const deleteTimeBlock = (id: string) => {
    setTimeBlocks(timeBlocks.filter((block) => block.id !== id))
    toast({
      title: "Bloco removido",
      description: "O bloco de tempo foi removido com sucesso.",
    })
  }

  // Funções para tags
  const addTag = () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para a tag.",
        variant: "destructive",
      })
      return
    }

    const tag: Tag = {
      id: Date.now().toString(),
      name: newTag.name,
      color: newTag.color,
    }

    setTags([...tags, tag])
    setNewTag({ name: "", color: "bg-blue-500" })
    setIsTagDialogOpen(false)

    toast({
      title: "Tag adicionada",
      description: "Sua tag foi adicionada com sucesso.",
    })
  }

  const deleteTag = (id: string) => {
    // Remover a tag de todos os blocos de tempo que a utilizam
    setTimeBlocks(
      timeBlocks.map((block) => ({
        ...block,
        tags: block.tags.filter((tagId) => tagId !== id),
      })),
    )

    // Remover a tag das anotações
    setNotes(
      notes.map((note) => ({
        ...note,
        tags: note.tags.filter((tagId) => tagId !== id),
      })),
    )

    // Remover a tag
    setTags(tags.filter((tag) => tag.id !== id))

    toast({
      title: "Tag removida",
      description: "A tag foi removida com sucesso.",
    })
  }

  // Funções para anotações
  const addNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e o conteúdo da anotação.",
        variant: "destructive",
      })
      return
    }

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      category: newNote.category || categories[0]?.id || "",
      tags: newNote.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      favorite: false,
    }

    setNotes([note, ...notes])
    setNewNote({ title: "", content: "", category: "", tags: [] })
    setIsNoteDialogOpen(false)

    toast({
      title: "Anotação adicionada",
      description: "Sua anotação foi adicionada com sucesso.",
    })
  }

  const updateNote = () => {
    if (!editingNote) return

    setNotes(
      notes.map((note) =>
        note.id === editingNote.id
          ? {
              ...editingNote,
              updatedAt: new Date(),
            }
          : note,
      ),
    )

    setEditingNote(null)

    toast({
      title: "Anotação atualizada",
      description: "Sua anotação foi atualizada com sucesso.",
    })
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
    toast({
      title: "Anotação removida",
      description: "A anotação foi removida com sucesso.",
    })
  }

  const toggleNoteFavorite = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? {
              ...note,
              favorite: !note.favorite,
              updatedAt: new Date(),
            }
          : note,
      ),
    )
  }

  // Funções para categorias
  const addCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para a categoria.",
        variant: "destructive",
      })
      return
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      color: newCategory.color,
    }

    setCategories([...categories, category])
    setNewCategory({ name: "", color: "bg-blue-500" })
    setIsCategoryDialogOpen(false)

    toast({
      title: "Categoria adicionada",
      description: "Sua categoria foi adicionada com sucesso.",
    })
  }

  const deleteCategory = (id: string) => {
    // Mover todas as anotações desta categoria para a primeira categoria disponível
    const firstCategory = categories.find((cat) => cat.id !== id)
    if (firstCategory) {
      setNotes(
        notes.map((note) =>
          note.category === id
            ? {
                ...note,
                category: firstCategory.id,
                updatedAt: new Date(),
              }
            : note,
        ),
      )
    }

    setCategories(categories.filter((category) => category.id !== id))

    toast({
      title: "Categoria removida",
      description: "A categoria foi removida com sucesso.",
    })
  }

  // Filtrar e ordenar anotações
  const filteredAndSortedNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === "all" || note.category === selectedCategory

      const matchesTags = selectedTags.length === 0 || selectedTags.some((tagId) => note.tags.includes(tagId))

      return matchesSearch && matchesCategory && matchesTags
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "category":
          const categoryA = categories.find((cat) => cat.id === a.category)?.name || ""
          const categoryB = categories.find((cat) => cat.id === b.category)?.name || ""
          comparison = categoryA.localeCompare(categoryB)
          break
        case "date":
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  // Ordenar blocos de tempo por hora
  const sortedTimeBlocks = [...timeBlocks].sort((a, b) => {
    return a.hour.localeCompare(b.hour)
  })

  // Formatar a hora atual (horário de Brasília)
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    })
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Organização / Produtividade</h1>
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{formatCurrentTime()} (Brasília)</span>
        </div>
      </div>

      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList className="flex flex-wrap w-full overflow-x-auto gap-1 p-1 justify-between">
          <TabsTrigger className="flex-1 min-w-[80px] text-xs sm:text-sm whitespace-nowrap" value="goals">
            <span className="hidden sm:inline">Metas da Semana</span>
            <span className="sm:hidden">Metas</span>
          </TabsTrigger>
          <TabsTrigger className="flex-1 min-w-[80px] text-xs sm:text-sm whitespace-nowrap" value="habits">
            <span className="hidden sm:inline">Hábitos</span>
            <span className="sm:hidden">Hábitos</span>
          </TabsTrigger>
          <TabsTrigger className="flex-1 min-w-[80px] text-xs sm:text-sm whitespace-nowrap" value="notes">
            <span className="hidden sm:inline">Anotações</span>
            <span className="sm:hidden">Notas</span>
          </TabsTrigger>
        </TabsList>

        {/* Metas da Semana */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Metas da Semana</h2>
            <Button onClick={() => setIsGoalDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </div>

          {weeklyGoals.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Você ainda não tem metas definidas para esta semana.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {weeklyGoals.map((goal) => (
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
                      <Progress value={goal.progress} className="h-2" />
                      <span className="text-sm font-medium">{goal.progress}%</span>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {diasDaSemana.map((day) => (
                        <div key={day} className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground mb-1">{day.substring(0, 3)}</span>
                          <Checkbox
                            checked={goal.dailyChecks[day]}
                            onCheckedChange={(checked) => updateGoalProgress(goal.id, day, checked === true)}
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
          <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
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
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="gap-3 sm:gap-0">
                <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={addWeeklyGoal}>Adicionar Meta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Hábitos */}
        <TabsContent value="habits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Hábitos Diários</h2>
            <Button onClick={() => setIsHabitDialogOpen(true)}>
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
          <Dialog open={isHabitDialogOpen} onOpenChange={setIsHabitDialogOpen}>
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
                    value={newHabit.title}
                    onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="gap-3 sm:gap-0">
                <Button variant="outline" onClick={() => setIsHabitDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={addHabit}>Adicionar Hábito</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Anotações do Dia a Dia */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-semibold">Anotações do Dia a Dia</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Categoria
              </Button>
              <Button onClick={() => setIsNoteDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Anotação
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Buscar anotações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-filter">Categoria</Label>
                  <select
                    id="category-filter"
                    className="w-full p-2 border rounded-md"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort-by">Ordenar por</Label>
                  <select
                    id="sort-by"
                    className="w-full p-2 border rounded-md"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "date" | "title" | "category")}
                  >
                    <option value="date">Data</option>
                    <option value="title">Título</option>
                    <option value="category">Categoria</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort-order">Ordem</Label>
                  <select
                    id="sort-order"
                    className="w-full p-2 border rounded-md"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  >
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de anotações */}
          {filteredAndSortedNotes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                {notes.length === 0
                  ? "Você ainda não tem anotações. Crie sua primeira anotação!"
                  : "Nenhuma anotação encontrada com os filtros aplicados."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedNotes.map((note) => {
                const category = categories.find((cat) => cat.id === note.category)
                const noteTags = note.tags.map((tagId) => tags.find((tag) => tag.id === tagId)).filter(Boolean)

                return (
                  <Card key={note.id} className={note.favorite ? "border-yellow-500/50 bg-yellow-500/5" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{note.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {category && (
                              <Badge variant="outline" className={`${category.color} text-white border-none`}>
                                {category.name}
                              </Badge>
                            )}
                            {noteTags.map((tag) => (
                              <Badge key={tag.id} variant="secondary" className={`${tag.color} text-white`}>
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleNoteFavorite(note.id)}
                            className={note.favorite ? "text-yellow-500" : "text-muted-foreground"}
                          >
                            ⭐
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingNote(note)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                      <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                        <span>Criado: {new Date(note.createdAt).toLocaleDateString()}</span>
                        <span>Atualizado: {new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Diálogo para adicionar anotação */}
          <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Anotação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title">Título</Label>
                  <Input
                    id="note-title"
                    placeholder="Título da anotação"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note-category">Categoria</Label>
                  <select
                    id="note-category"
                    className="w-full p-2 border rounded-md"
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note-content">Conteúdo</Label>
                  <Textarea
                    id="note-content"
                    placeholder="Escreva sua anotação aqui..."
                    className="min-h-[200px]"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={newNote.tags.includes(tag.id) ? "default" : "outline"}
                        className={`cursor-pointer ${newNote.tags.includes(tag.id) ? `${tag.color} text-white` : ""}`}
                        onClick={() => {
                          const updatedTags = newNote.tags.includes(tag.id)
                            ? newNote.tags.filter((t) => t !== tag.id)
                            : [...newNote.tags, tag.id]
                          setNewNote({ ...newNote, tags: updatedTags })
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-3 sm:gap-0">
                <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={addNote}>Adicionar Anotação</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo para editar anotação */}
          <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Anotação</DialogTitle>
              </DialogHeader>
              {editingNote && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-note-title">Título</Label>
                    <Input
                      id="edit-note-title"
                      value={editingNote.title}
                      onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-note-category">Categoria</Label>
                    <select
                      id="edit-note-category"
                      className="w-full p-2 border rounded-md"
                      value={editingNote.category}
                      onChange={(e) => setEditingNote({ ...editingNote, category: e.target.value })}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-note-content">Conteúdo</Label>
                    <Textarea
                      id="edit-note-content"
                      className="min-h-[200px]"
                      value={editingNote.content}
                      onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={editingNote.tags.includes(tag.id) ? "default" : "outline"}
                          className={`cursor-pointer ${editingNote.tags.includes(tag.id) ? `${tag.color} text-white` : ""}`}
                          onClick={() => {
                            const updatedTags = editingNote.tags.includes(tag.id)
                              ? editingNote.tags.filter((t) => t !== tag.id)
                              : [...editingNote.tags, tag.id]
                            setEditingNote({ ...editingNote, tags: updatedTags })
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="gap-3 sm:gap-0">
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  Cancelar
                </Button>
                <Button onClick={updateNote}>Salvar Alterações</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo para adicionar categoria */}
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nome da Categoria</Label>
                  <Input
                    id="category-name"
                    placeholder="Ex: Trabalho, Pessoal, Estudos"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cor da Categoria</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_COLORS.map((color) => (
                      <div
                        key={color.value}
                        className={`w-8 h-8 rounded cursor-pointer border-2 ${color.value} ${
                          newCategory.color === color.value ? "border-black" : "border-transparent"
                        }`}
                        onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-3 sm:gap-0">
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={addCategory}>Adicionar Categoria</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
