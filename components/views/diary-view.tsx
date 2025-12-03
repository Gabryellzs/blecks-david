"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Edit3,
  FileText,
  ListChecks,
  Plus,
  Save,
  Trash,
  Trash2,
  Archive,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
} from "lucide-react"

// Dias da semana em português
const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

// Interface para as entradas do diário
interface DiaryEntry {
  id: string
  content: string
  date: string
  createdAt: Date
}

// Interface para tarefas
interface Task {
  id: string
  content: string
  date: string
  completed: boolean
  createdAt: Date
}

// Interface para as entradas organizadas por dia da semana
interface WeeklyEntries {
  [key: string]: DiaryEntry[]
}

// Interface para diários semanais arquivados
interface ArchivedWeek {
  id: string
  startDate: string
  endDate: string
  entries: WeeklyEntries
  tasks: Task[]
  archivedAt: Date
}

// Função para obter os dias da semana a partir de uma data
function getWeekDays(date: Date): Date[] {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Ajuste para começar na segunda-feira
  const monday = new Date(date)
  monday.setDate(diff)

  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday)
    nextDay.setDate(monday.getDate() + i)
    weekDays.push(nextDay)
  }

  return weekDays
}

// Função para formatar a data
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Função para formatar a data em formato legível
function formatReadableDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`
}

export default function DiaryView() {
  const { toast } = useToast()

  // Estados para controle de navegação entre semanas
  const [weekOffset, setWeekOffset] = useState(0)

  // Estados para o diário
  const [entry, setEntry] = useState("")
  const [isWritingMode, setIsWritingMode] = useState(true)
  const [lastCreatedEntryId, setLastCreatedEntryId] = useState<string | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // Estados para tarefas
  const [newTask, setNewTask] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Estado para o dia selecionado
  const [selectedDay, setSelectedDay] = useState<string>(
    diasDaSemana[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1],
  )

  // Estados para armazenamento local
  const [weeklyEntries, setWeeklyEntries] = useLocalStorage<WeeklyEntries>(
    "diary-entries",
    diasDaSemana.reduce((acc, day) => {
      acc[day] = []
      return acc
    }, {} as WeeklyEntries),
  )
  const [tasks, setTasks] = useLocalStorage<Task[]>("diary-tasks", [])
  const [archivedWeeks, setArchivedWeeks] = useLocalStorage<ArchivedWeek[]>("diary-archived-weeks", [])
  const [viewingArchives, setViewingArchives] = useState(false)
  const [selectedArchive, setSelectedArchive] = useState<ArchivedWeek | null>(null)

  // Calcular os dias da semana atual com base no offset
  const weekDates = useMemo(() => {
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + weekOffset * 7)
    return getWeekDays(targetDate)
  }, [weekOffset])

  // Função para obter o dia atual da semana
  const getCurrentDay = () => {
    const today = new Date().getDay() // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    return diasDaSemana[today === 0 ? 6 : today - 1]
  }

  // Atualizar o dia selecionado quando o dia atual mudar (à meia-noite)
  useEffect(() => {
    const updateCurrentDay = () => {
      if (weekOffset === 0) {
        const currentDay = getCurrentDay()
        if (selectedDay !== currentDay) {
          setSelectedDay(currentDay)
        }
      }
    }

    const interval = setInterval(updateCurrentDay, 60000)
    return () => clearInterval(interval)
  }, [selectedDay, weekOffset])

  // Verificar se hoje é domingo para mostrar a revisão semanal
  const isDomingo = getCurrentDay() === "Domingo"

  // Navegação entre semanas
  const goToPreviousWeek = () => {
    setWeekOffset((prev) => prev - 1)
    setIsWritingMode(true)
    setLastCreatedEntryId(null)
  }

  const goToCurrentWeek = () => {
    setWeekOffset(0)
    setSelectedDay(getCurrentDay())
    setIsWritingMode(true)
    setLastCreatedEntryId(null)
  }

  const goToNextWeek = () => {
    setWeekOffset((prev) => prev + 1)
    setIsWritingMode(true)
    setLastCreatedEntryId(null)
  }

  // Salvar entrada
  const saveEntry = () => {
    if (!entry.trim()) {
      toast({
        title: "Entrada vazia",
        description: "Por favor, escreva algo antes de salvar.",
        variant: "destructive",
      })
      return
    }

    const newEntryId = Date.now().toString()
    const selectedDateIndex = diasDaSemana.indexOf(selectedDay)
    const selectedDate = weekDates[selectedDateIndex]

    const newEntry = {
      id: newEntryId,
      content: entry,
      date: formatDate(selectedDate),
      createdAt: new Date(),
    }

    setWeeklyEntries((prev) => {
      const currentEntries = prev[selectedDay] || []

      return {
        ...prev,
        [selectedDay]: [newEntry, ...currentEntries],
      }
    })

    setEntry("")
    setIsWritingMode(false)
    setLastCreatedEntryId(newEntryId)

    toast({
      title: "Entrada salva",
      description: `Sua entrada para ${selectedDay} foi salva com sucesso.`,
    })
  }

  // Selecionar dia
  const selectDay = (day: string) => {
    setSelectedDay(day)

    const hasEntries = weeklyEntries[day] && weeklyEntries[day].length > 0

    if (hasEntries) {
      setIsWritingMode(false)
      setLastCreatedEntryId(weeklyEntries[day][0].id)
    } else {
      setIsWritingMode(true)
      setLastCreatedEntryId(null)
    }
  }

  // Voltar para modo escrita
  const switchToWritingMode = () => {
    setIsWritingMode(true)
    setLastCreatedEntryId(null)
  }

  // Editar entrada
  const startEditEntry = (entryId: string, content: string) => {
    setLastCreatedEntryId(null)
    setIsWritingMode(false)
    setEditingEntryId(entryId)
    setEditContent(content)
  }

  const saveEditEntry = () => {
    if (!editingEntryId || !editContent.trim()) return

    setWeeklyEntries((prev) => {
      const updatedEntries = { ...prev }

      updatedEntries[selectedDay] = updatedEntries[selectedDay].map((entry) =>
        entry.id === editingEntryId
          ? {
              ...entry,
              content: editContent,
              date: entry.date,
              createdAt: entry.createdAt,
            }
          : entry,
      )

      return updatedEntries
    })

    setEditingEntryId(null)
    setEditContent("")

    toast({
      title: "Entrada atualizada",
      description: "Sua entrada foi atualizada com sucesso.",
    })
  }

  const cancelEdit = () => {
    setEditingEntryId(null)
    setEditContent("")
  }

  const deleteEntry = (entryId: string) => {
    setWeeklyEntries((prev) => {
      const updatedEntries = { ...prev }
      updatedEntries[selectedDay] = updatedEntries[selectedDay].filter((entry) => entry.id !== entryId)
      return updatedEntries
    })

    toast({
      title: "Entrada excluída",
      description: "Sua entrada foi excluída com sucesso.",
    })
  }

  // Tarefas
  const addTask = () => {
    if (!selectedDay || !newTask.trim()) return

    const selectedDateIndex = diasDaSemana.indexOf(selectedDay)
    const selectedDate = weekDates[selectedDateIndex]

    const task: Task = {
      id: Date.now().toString(),
      content: newTask,
      date: formatDate(selectedDate),
      completed: false,
      createdAt: new Date(),
    }

    setTasks((prevTasks) => [...prevTasks, task])
    setNewTask("")

    toast({
      title: "Tarefa adicionada",
      description: "Sua tarefa foi adicionada com sucesso.",
    })
  }

  const updateTask = () => {
    if (!editingTask) return

    const updatedTasks = tasks.map((task) => (task.id === editingTask.id ? editingTask : task))

    setTasks(updatedTasks)
    setEditingTask(null)

    toast({
      title: "Tarefa atualizada",
      description: "Sua tarefa foi atualizada com sucesso.",
    })
  }

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id)
    setTasks(updatedTasks)

    toast({
      title: "Tarefa removida",
      description: "Sua tarefa foi removida com sucesso.",
    })
  }

  const toggleTaskCompletion = (id: string) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))

    setTasks(updatedTasks)
  }

  // Mover tarefas pendentes para próxima semana
  const moveUncompletedTasksToNextWeek = () => {
    const nextWeekStart = new Date(weekDates[0])
    nextWeekStart.setDate(nextWeekStart.getDate() + 7)
    const nextWeekDays = getWeekDays(nextWeekStart)

    const updatedTasks = tasks.map((task) => {
      const taskDate = new Date(task.date)
      const isCurrentWeekTask = weekDates[0] <= taskDate && taskDate <= weekDates[6]

      if (isCurrentWeekTask && !task.completed) {
        const dayOfWeek = new Date(task.date).getDay()
        const nextWeekSameDay = formatDate(nextWeekDays[dayOfWeek === 0 ? 6 : dayOfWeek - 1])
        return { ...task, date: nextWeekSameDay }
      }

      return task
    })

    setTasks(updatedTasks)

    toast({
      title: "Tarefas transferidas",
      description: "Tarefas não concluídas foram transferidas para a próxima semana.",
    })
  }

  // Arquivar semana
  const archiveCurrentWeek = () => {
    const weekStart = formatDate(weekDates[0])
    const weekEnd = formatDate(weekDates[6])

    const archivedWeek: ArchivedWeek = {
      id: Date.now().toString(),
      startDate: weekStart,
      endDate: weekEnd,
      entries: { ...weeklyEntries },
      tasks: [
        ...tasks.filter((task) => {
          const taskDate = new Date(task.date)
          return weekDates[0] <= taskDate && taskDate <= weekDates[6]
        }),
      ],
      archivedAt: new Date(),
    }

    setArchivedWeeks([...archivedWeeks, archivedWeek])

    setWeeklyEntries(
      diasDaSemana.reduce((acc, day) => {
        acc[day] = []
        return acc
      }, {} as WeeklyEntries),
    )

    setTasks(
      tasks.filter((task) => {
        const taskDate = new Date(task.date)
        return !(weekDates[0] <= taskDate && taskDate <= weekDates[6])
      }),
    )

    toast({
      title: "Semana arquivada",
      description: `A semana de ${formatReadableDate(weekDates[0])} a ${formatReadableDate(weekDates[6])} foi arquivada com sucesso.`,
    })
  }

  const viewArchive = (archive: ArchivedWeek) => {
    setSelectedArchive(archive)
  }

  const deleteArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    setArchivedWeeks(archivedWeeks.filter((archive) => archive.id !== id))

    if (selectedArchive?.id === id) {
      setSelectedArchive(null)
    }

    toast({
      title: "Arquivo excluído",
      description: "O arquivo semanal foi excluído com sucesso.",
    })
  }

  const restoreArchivedWeek = (id: string) => {
    const weekToRestore = archivedWeeks.find((week) => week.id === id)
    if (!weekToRestore) return

    setWeeklyEntries({
      ...weeklyEntries,
      ...weekToRestore.entries,
    })

    setTasks([...tasks, ...weekToRestore.tasks])

    setArchivedWeeks(archivedWeeks.filter((week) => week.id !== id))

    toast({
      title: "Semana restaurada",
      description: `A semana de ${formatReadableDate(new Date(weekToRestore.startDate))} a ${formatReadableDate(
        new Date(weekToRestore.endDate),
      )} foi restaurada.`,
    })
  }

  // Tarefas do dia selecionado
  const selectedDayTasks = useMemo(() => {
    const selectedDateIndex = diasDaSemana.indexOf(selectedDay)
    if (selectedDateIndex === -1) return []

    const selectedDate = weekDates[selectedDateIndex]
    const dateStr = formatDate(selectedDate)

    return tasks.filter((task) => task.date === dateStr)
  }, [tasks, selectedDay, weekDates])

  // Tarefas da semana atual
  const currentWeekTasks = useMemo(() => {
    const weekStart = formatDate(weekDates[0])
    const weekEnd = formatDate(weekDates[6])

    return tasks.filter((task) => {
      const taskDate = task.date
      return taskDate >= weekStart && taskDate <= weekEnd
    })
  }, [tasks, weekDates])

  // Stats semanais
  const weekStats = useMemo(() => {
    const totalTasks = currentWeekTasks.length
    const completedTasks = currentWeekTasks.filter((task) => task.completed).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      completionRate,
    }
  }, [currentWeekTasks])

  // Última entrada criada
  const lastCreatedEntry = lastCreatedEntryId
    ? weeklyEntries[selectedDay]?.find((entry) => entry.id === lastCreatedEntryId)
    : null

  // Título da semana
  const weekTitle = useMemo(() => {
    const startDate = formatReadableDate(weekDates[0])
    const endDate = formatReadableDate(weekDates[6])

    let prefix = ""
    if (weekOffset < 0) {
      prefix = "Semana Anterior: "
    } else if (weekOffset > 0) {
      prefix = "Próxima Semana: "
    } else {
      prefix = "Semana Atual: "
    }

    return `${prefix}${startDate} - ${endDate}`
  }, [weekDates, weekOffset])

  console.log("Tarefas atuais:", tasks)

  return (
<div className="relative min-h-screen w-full overflow-hidden">
      {/* Orbs de glow no fundo */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.16),transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(94,234,212,0.16),transparent_60%)] blur-3xl" />
      <div className="relative w-full px-6 lg:px-10 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 rounded-2xl bg-card/70 border border-white/5 backdrop-blur-xl px-4 py-4 md:px-6 md:py-5 shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
          <div>
            <h1 className="bg-gradient-to-r from-primary via-primary/80 to-sky-400 bg-clip-text text-transparent text-3xl md:text-4xl font-semibold tracking-tight">
              Diário Semanal
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground/80 mt-2">{weekTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="flex items-center gap-1 border-primary/40 bg-background/40 hover:bg-primary/10 hover:border-primary/60"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant={weekOffset === 0 ? "default" : "outline"}
              size="sm"
              onClick={goToCurrentWeek}
              className={weekOffset === 0 ? "shadow-[0_0_22px_rgba(59,130,246,0.55)]" : ""}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="flex items-center gap-1 border-primary/40 bg-background/40 hover:bg-primary/10 hover:border-primary/60"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant={viewingArchives ? "default" : "outline"}
              size="sm"
              className={`gap-2 ${
                viewingArchives
                  ? "shadow-[0_0_22px_rgba(59,130,246,0.55)]"
                  : "border-primary/40 bg-background/40 hover:bg-primary/10 hover:border-primary/60"
              }`}
              onClick={() => {
                setViewingArchives(!viewingArchives)
                if (!viewingArchives) {
                  setSelectedArchive(null)
                }
              }}
            >
              <Archive className="h-4 w-4" />
              {viewingArchives ? "Voltar" : "Arquivos"}
            </Button>
          </div>
        </div>

        <Separator className="my-6 bg-border/60" />

        {viewingArchives ? (
          // =================== ARQUIVOS ===================
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Archive className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Arquivos Semanais</h2>
            </div>

            {archivedWeeks.length === 0 ? (
              <Card className="border-dashed border-white/10 bg-card/60 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Archive className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhum arquivo encontrado</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Quando você arquivar semanas do seu diário, elas aparecerão aqui para consulta futura.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedWeeks.map((archive) => {
                  const totalEntries = Object.values(archive.entries).reduce(
                    (total, entries) => total + entries.length,
                    0,
                  )
                  const totalTasks = archive.tasks.length
                  const completedTasks = archive.tasks.filter((task) => task.completed).length

                  return (
                    <Card
                      key={archive.id}
                      className={`cursor-pointer bg-card/70 backdrop-blur-xl border border-white/5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_18px_60px_rgba(0,0,0,0.8)] ${
                        selectedArchive?.id === archive.id ? "border-primary/70" : "hover:border-primary/50"
                      }`}
                      onClick={() => viewArchive(archive)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Semana Arquivada
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => deleteArchive(archive.id, e)}
                            aria-label="Excluir arquivo"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription>
                          {formatReadableDate(new Date(archive.startDate))} -{" "}
                          {formatReadableDate(new Date(archive.endDate))}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="flex flex-col items-center p-2 bg-background/40 rounded-lg border border-white/5">
                            <span className="text-xs text-muted-foreground">Anotações</span>
                            <span className="text-lg font-semibold">{totalEntries}</span>
                          </div>
                          <div className="flex flex-col items-center p-2 bg-background/40 rounded-lg border border-white/5">
                            <span className="text-xs text-muted-foreground">Tarefas</span>
                            <span className="text-lg font-semibold">{totalTasks}</span>
                          </div>
                          <div className="flex flex-col items-center p-2 bg-background/40 rounded-lg border border-white/5">
                            <span className="text-xs text-muted-foreground">Concluídas</span>
                            <span className="text-lg font-semibold">{completedTasks}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-primary/40 hover:border-primary/70 hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            restoreArchivedWeek(archive.id)
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restaurar
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {selectedArchive && (
              <div className="space-y-4 mt-8 bg-card/70 p-6 rounded-2xl border border-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.75)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Detalhes do Arquivo
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatReadableDate(new Date(selectedArchive.startDate))} -{" "}
                      {formatReadableDate(new Date(selectedArchive.endDate))}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedArchive(null)}>
                    Voltar
                  </Button>
                </div>

                <Tabs defaultValue="entries">
                  <TabsList className="bg-background/60 border border-white/5 rounded-full p-1 inline-flex">
                    <TabsTrigger
                      value="entries"
                      className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Anotações
                    </TabsTrigger>
                    <TabsTrigger
                      value="tasks"
                      className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Tarefas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="entries" className="space-y-4 mt-4">
                    {diasDaSemana.map((dia) => {
                      const entries = selectedArchive.entries[dia] || []
                      return entries.length > 0 ? (
                        <Card
                          key={dia}
                          className="bg-card/70 border border-white/5 backdrop-blur-xl shadow-[0_16px_45px_rgba(0,0,0,0.6)]"
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{dia}</CardTitle>
                            <CardDescription>
                              {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {entries.map((entry) => (
                              <div
                                key={entry.id}
                                className="border border-white/5 rounded-md p-4 bg-background/60 backdrop-blur-xl"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(entry.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap">{entry.content}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ) : null
                    })}
                  </TabsContent>

                  <TabsContent value="tasks" className="space-y-4 mt-4">
                    {selectedArchive.tasks.length > 0 ? (
                      <div className="space-y-4">
                        <Card className="bg-card/70 border border-white/5 backdrop-blur-xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Tarefas Concluídas
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedArchive.tasks.filter((t) => t.completed).length > 0 ? (
                              <div className="space-y-2">
                                {selectedArchive.tasks
                                  .filter((t) => t.completed)
                                  .map((task) => (
                                    <div
                                      key={task.id}
                                      className="flex items-center gap-2 p-2 rounded border border-white/5 bg-card/60"
                                    >
                                      <Checkbox checked={true} disabled />
                                      <span className="flex-1 text-sm line-through text-muted-foreground">
                                        {task.content}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {formatReadableDate(new Date(task.date))}
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Nenhuma tarefa concluída.</p>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="bg-card/70 border border-white/5 backdrop-blur-xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-amber-500" />
                              Tarefas Pendentes
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedArchive.tasks.filter((t) => !t.completed).length > 0 ? (
                              <div className="space-y-2">
                                {selectedArchive.tasks
                                  .filter((t) => !t.completed)
                                  .map((task) => (
                                    <div
                                      key={task.id}
                                      className="flex items-center gap-2 p-2 rounded border border-white/5 bg-card/60"
                                    >
                                      <Checkbox checked={false} disabled />
                                      <span className="flex-1 text-sm">{task.content}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {formatReadableDate(new Date(task.date))}
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card className="bg-card/70 border border-white/5 backdrop-blur-xl">
                        <CardContent className="p-6 text-center text-muted-foreground">
                          Nenhuma tarefa encontrada nesta semana arquivada.
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        ) : (
          // =================== DIÁRIO / TAREFAS ===================
          <>
            <Tabs defaultValue="diary">
              <TabsList className="mb-6 bg-card/70 border border-white/5 rounded-full p-1 inline-flex backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
                <TabsTrigger
                  value="diary"
                  className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileText className="h-4 w-4" />
                  Diário
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <ListChecks className="h-4 w-4" />
                  Tarefas
                </TabsTrigger>
              </TabsList>

              {/* ------------ ABA DIÁRIO ------------ */}
              <TabsContent value="diary">
                {/* Grid de dias */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
                  {diasDaSemana.map((dia, index) => {
                    const isCurrentDay = dia === getCurrentDay() && weekOffset === 0
                    const dateForDay = weekDates[index]
                    const formattedDate = formatReadableDate(dateForDay)
                    const entryCount = weeklyEntries[dia]?.length || 0

                    return (
                      <Card
                        key={dia}
                        // REMOVIDO O NEON: apenas um shadow mais neutro
                        className={`group cursor-pointer bg-card/60 backdrop-blur-xl border border-white/5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.6)] ${
                          selectedDay === dia
                            ? "border-primary/70 bg-primary/5"
                            : isCurrentDay
                              ? "border-primary/40 bg-primary/5/40"
                              : "hover:border-primary/40"
                        }`}
                        onClick={() => selectDay(dia)}
                      >
                        <CardContent className="p-4 text-center">
                          <h3
                            className={`font-medium text-sm md:text-base ${
                              selectedDay === dia ? "text-primary" : ""
                            }`}
                          >
                            {dia}
                          </h3>
                          <div className="text-[11px] md:text-xs text-muted-foreground mt-1">{formattedDate}</div>
                          <div className="mt-2">
                            {entryCount > 0 ? (
                              <Badge
                                variant={selectedDay === dia ? "default" : "secondary"}
                                className="text-[11px] px-2"
                              >
                                {entryCount} {entryCount === 1 ? "entrada" : "entradas"}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Sem entradas</span>
                            )}
                          </div>
                          {isCurrentDay && (
                            <div className="mt-2 text-[11px] text-primary font-medium tracking-wide">Hoje</div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {isWritingMode ? (
                  // Nova entrada
                  <Card className="border border-primary/30 bg-card/70 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Nova Entrada para {selectedDay}
                      </CardTitle>
                      <CardDescription>Registre seus pensamentos para {selectedDay}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder={`Escreva aqui sua entrada de diário para ${selectedDay}...`}
                        className="min-h-[200px] resize-none focus-visible:ring-primary bg-background/60 border border-white/5"
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button onClick={saveEntry} className="gap-2 shadow-[0_0_22px_rgba(59,130,246,0.55)]">
                        <Save className="h-4 w-4" />
                        Salvar Entrada
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  lastCreatedEntry && (
                    <Card className="border border-primary/70 bg-card/80 backdrop-blur-xl shadow-[0_18px_70px_rgba(59,130,246,0.6)] mb-6">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="text-xs text-muted-foreground">
                            {new Date(lastCreatedEntry.createdAt).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditEntry(lastCreatedEntry.id, lastCreatedEntry.content)}
                              className="h-8 w-8 hover:bg-background/70"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteEntry(lastCreatedEntry.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{lastCreatedEntry.content}</p>
                      </CardContent>
                    </Card>
                  )
                )}

                {/* Entradas anteriores */}
                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-muted-foreground">Entradas Anteriores</h3>
                    <Button
                      onClick={switchToWritingMode}
                      variant="outline"
                      className="flex items-center gap-2 border-primary/40 hover:border-primary/70 hover:bg-primary/10"
                    >
                      <Plus className="h-4 w-4" />
                      Nova Entrada
                    </Button>
                  </div>

                  {!weeklyEntries[selectedDay] ||
                  weeklyEntries[selectedDay].length === 0 ||
                  (weeklyEntries[selectedDay].length === 1 && lastCreatedEntryId === weeklyEntries[selectedDay][0].id) ? (
                    <Card className="border-dashed border-white/10 bg-card/60 backdrop-blur-xl">
                      <CardContent className="p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Nenhuma entrada anterior</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Você ainda não tem entradas anteriores para {selectedDay}.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {weeklyEntries[selectedDay]
                        .filter((entry) => !lastCreatedEntryId || entry.id !== lastCreatedEntryId)
                        .map((entry) => (
                          <Card
                            key={entry.id}
                            className="w-full bg-card/70 backdrop-blur-xl border border-white/5 hover:border-primary/30 transition-colors shadow-[0_16px_45px_rgba(0,0,0,0.6)]"
                          >
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start gap-2 mb-3">
                                <div className="text-xs text-muted-foreground">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEditEntry(entry.id, entry.content)}
                                    className="h-8 w-8 hover:bg-muted/60"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteEntry(entry.id)}
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>

                {/* Edição */}
                {editingEntryId && (
                  <Card className="mt-8 border border-primary/50 bg-card/80 backdrop-blur-xl shadow-[0_18px_70px_rgba(59,130,246,0.55)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Edit className="h-4 w-4 text-primary" />
                        Editar Entrada
                      </CardTitle>
                      <CardDescription>Modifique sua entrada para {selectedDay}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Edite sua entrada..."
                        className="min-h-[200px] resize-none focus-visible:ring-primary bg-background/60 border border-white/5"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={cancelEdit} className="border-white/20">
                        Cancelar
                      </Button>
                      <Button onClick={saveEditEntry} className="gap-2 shadow-[0_0_22px_rgba(59,130,246,0.55)]">
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>

              {/* ------------ ABA TAREFAS ------------ */}
              <TabsContent value="tasks">
                {/* Grid de dias */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
                  {diasDaSemana.map((dia, index) => {
                    const isCurrentDay = dia === getCurrentDay() && weekOffset === 0
                    const dateForDay = weekDates[index]
                    const formattedDate = formatReadableDate(dateForDay)

                    const dayTasks = tasks.filter((task) => task.date === formatDate(dateForDay))
                    const completedTasks = dayTasks.filter((task) => task.completed).length

                    return (
                      <Card
                        key={dia}
                        // REMOVIDO NEON AQUI TAMBÉM
                        className={`group cursor-pointer bg-card/60 backdrop-blur-xl border border-white/5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.6)] ${
                          selectedDay === dia
                            ? "border-primary/70 bg-primary/5"
                            : isCurrentDay
                              ? "border-primary/40 bg-primary/5/40"
                              : "hover:border-primary/40"
                        }`}
                        onClick={() => selectDay(dia)}
                      >
                        <CardContent className="p-4 text-center">
                          <h3
                            className={`font-medium text-sm md:text-base ${
                              selectedDay === dia ? "text-primary" : ""
                            }`}
                          >
                            {dia}
                          </h3>
                          <div className="text-[11px] md:text-xs text-muted-foreground mt-1">{formattedDate}</div>
                          <div className="mt-2">
                            {dayTasks.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant={selectedDay === dia ? "default" : "secondary"}
                                  className="text-[11px] px-2"
                                >
                                  {dayTasks.length} {dayTasks.length === 1 ? "tarefa" : "tarefas"}
                                </Badge>
                                {completedTasks > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] bg-green-50/10 text-green-400 border-green-500/40"
                                  >
                                    {completedTasks} concluída{completedTasks !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Sem tarefas</span>
                            )}
                        </div>
                        {isCurrentDay && (
                          <div className="mt-2 text-[11px] text-primary font-medium tracking-wide">Hoje</div>
                        )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Tarefas do dia */}
                <Card className="bg-card/70 backdrop-blur-xl border border-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-primary" />
                      Tarefas para {selectedDay}
                    </CardTitle>
                  </CardHeader>
                  <CardDescription className="px-6 pb-2 text-sm text-muted-foreground">
                    {selectedDayTasks.length === 0
                      ? "Nenhuma tarefa para este dia. Adicione sua primeira tarefa abaixo."
                      : `${selectedDayTasks.length} tarefa(s) para este dia, ${
                          selectedDayTasks.filter((t) => t.completed).length
                        } concluída(s).`}
                  </CardDescription>

                  <CardContent className="space-y-4">
                    {/* Formulário */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="Adicionar nova tarefa..."
                          value={editingTask ? editingTask.content : newTask}
                          onChange={(e) =>
                            editingTask
                              ? setEditingTask({ ...editingTask, content: e.target.value })
                              : setNewTask(e.target.value)
                          }
                          className="flex-1 bg-background/60 border border-white/10"
                        />
                        <div className="flex gap-2 justify-end">
                          {editingTask ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingTask(null)}
                                className="border-white/20"
                              >
                                Cancelar
                              </Button>
                              <Button size="sm" onClick={updateTask} disabled={!editingTask.content.trim()}>
                                Atualizar
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" onClick={addTask} disabled={!newTask.trim()}>
                              Adicionar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lista */}
                    {selectedDayTasks.length > 0 ? (
                      <div className="space-y-4">
                        {/* Pendentes */}
                        {selectedDayTasks.filter((task) => !task.completed).length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-amber-500" />
                              Pendentes:
                            </div>
                            <div className="space-y-2">
                              {selectedDayTasks
                                .filter((task) => !task.completed)
                                .map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-2 p-2 rounded border border-white/10 bg-card/60"
                                  >
                                    <Checkbox
                                      id={`task-${task.id}`}
                                      checked={task.completed}
                                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                                    />
                                    <label
                                      htmlFor={`task-${task.id}`}
                                      className="flex-1 text-sm cursor-pointer leading-relaxed"
                                    >
                                      {task.content}
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEditingTask(task)}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => deleteTask(task.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Concluídas */}
                        {selectedDayTasks.filter((task) => task.completed).length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Concluídas:
                            </div>
                            <div className="space-y-2">
                              {selectedDayTasks
                                .filter((task) => task.completed)
                                .map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-2 p-2 rounded border border-white/10 bg-card/60"
                                  >
                                    <Checkbox
                                      id={`task-${task.id}`}
                                      checked={task.completed}
                                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                                    />
                                    <label
                                      htmlFor={`task-${task.id}`}
                                      className="flex-1 text-sm line-through text-muted-foreground cursor-pointer leading-relaxed"
                                    >
                                      {task.content}
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEditingTask(task)}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => deleteTask(task.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <ListChecks className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Nenhuma tarefa para este dia.</p>
                        <p className="text-sm">Adicione tarefas usando o formulário acima.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Revisão semanal (domingo) */}
            {isDomingo && weekOffset === 0 && (
              <Card className="border-t-4 border-t-amber-500 mt-6 bg-card/70 backdrop-blur-xl border border-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.8)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <ListChecks className="h-5 w-5" />
                    Revisão Semanal
                  </CardTitle>
                  <CardDescription>Hoje é domingo! Revise sua semana e planeje a próxima.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-card/70 border border-white/10 backdrop-blur-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Resumo da Semana</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total de anotações:</span>
                            <Badge variant="secondary">
                              {Object.values(weeklyEntries).reduce((total, entries) => total + entries.length, 0)}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Total de tarefas:</span>
                            <Badge variant="secondary">{weekStats.totalTasks}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Tarefas concluídas:</span>
                            <Badge
                              variant="outline"
                              className="bg-green-50/10 text-green-400 border-green-500/40"
                            >
                              {weekStats.completedTasks}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Tarefas pendentes:</span>
                            <Badge
                              variant="outline"
                              className="bg-amber-50/10 text-amber-300 border-amber-400/40"
                            >
                              {weekStats.pendingTasks}
                            </Badge>
                          </div>
                          <div className="pt-2 border-t border-white/10">
                            <div className="flex justify-between items-center">
                              <span>Taxa de conclusão:</span>
                              <Badge
                                variant={weekStats.completionRate >= 70 ? "default" : "outline"}
                                className={
                                  weekStats.completionRate >= 70
                                    ? "bg-green-600"
                                    : weekStats.completionRate >= 30
                                      ? "bg-amber-500/10 text-amber-300 border-amber-400/40"
                                      : "bg-red-500/10 text-red-300 border-red-500/40"
                                }
                              >
                                {weekStats.completionRate}%
                              </Badge>
                            </div>
                            <div className="w-full bg-muted/40 rounded-full h-2.5 mt-2 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full ${
                                  weekStats.completionRate >= 70
                                    ? "bg-green-500"
                                    : weekStats.completionRate >= 30
                                      ? "bg-amber-400"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${weekStats.completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/70 border border-white/10 backdrop-blur-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Ações</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start border-white/20 hover:border-primary/60 hover:bg-primary/10"
                          onClick={moveUncompletedTasksToNextWeek}
                        >
                          <ArrowRightCircle className="h-4 w-4 mr-2" />
                          Transferir tarefas pendentes
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start border-white/20 hover:border-primary/60 hover:bg-primary/10"
                          onClick={goToNextWeek}
                        >
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Planejar próxima semana
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start border-white/20 hover:border-amber-400/60 hover:bg-amber-500/10"
                          onClick={archiveCurrentWeek}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar semana atual
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {weekStats.pendingTasks > 0 && (
                    <Card className="bg-card/70 border border-white/10 backdrop-blur-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-amber-500" />
                          Tarefas Pendentes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {currentWeekTasks
                            .filter((task) => !task.completed)
                            .map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 p-2 rounded border border-white/10 bg-card/60"
                              >
                                <Checkbox
                                  id={`pending-${task.id}`}
                                  checked={task.completed}
                                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                                />
                                <label
                                  htmlFor={`pending-${task.id}`}
                                  className="flex-1 text-sm cursor-pointer leading-relaxed"
                                >
                                  {task.content}
                                </label>
                                <Badge variant="outline" className="text-xs">
                                  {
                                    diasDaSemana[
                                      new Date(task.date).getDay() === 0 ? 6 : new Date(task.date).getDay() - 1
                                    ]
                                  }
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
