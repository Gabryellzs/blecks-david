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
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
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
    // Converter de 0-6 (domingo-sábado) para nosso formato (segunda-domingo)
    return diasDaSemana[today === 0 ? 6 : today - 1]
  }

  // Atualizar o dia selecionado quando o dia atual mudar (à meia-noite)
  useEffect(() => {
    // Função para atualizar o dia atual
    const updateCurrentDay = () => {
      if (weekOffset === 0) {
        // Apenas se estiver na semana atual
        const currentDay = getCurrentDay()
        if (selectedDay !== currentDay) {
          setSelectedDay(currentDay)
        }
      }
    }

    // Verificar a cada minuto se o dia mudou
    const interval = setInterval(updateCurrentDay, 60000) // Verificar a cada minuto

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(interval)
  }, [selectedDay, weekOffset])

  // Verificar se hoje é domingo para mostrar a revisão semanal
  const isDomingo = getCurrentDay() === "Domingo"

  // Funções para navegação entre semanas
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

  // Função para salvar uma entrada no dia selecionado
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
      // Verificar se realmente precisa atualizar
      const currentEntries = prev[selectedDay] || []

      return {
        ...prev,
        [selectedDay]: [newEntry, ...currentEntries],
      }
    })

    // Limpar o campo de entrada após salvar
    setEntry("")

    // Mudar para o modo de visualização e definir a entrada recém-criada como foco
    setIsWritingMode(false)
    setLastCreatedEntryId(newEntryId)

    toast({
      title: "Entrada salva",
      description: `Sua entrada para ${selectedDay} foi salva com sucesso.`,
    })
  }

  // Função para selecionar um dia da semana
  const selectDay = (day: string) => {
    setSelectedDay(day)

    // Verificar se o dia selecionado tem entradas
    const hasEntries = weeklyEntries[day] && weeklyEntries[day].length > 0

    // Se tiver entradas, mostrar a última entrada em modo de visualização
    if (hasEntries) {
      setIsWritingMode(false)
      setLastCreatedEntryId(weeklyEntries[day][0].id)
    } else {
      // Se não tiver entradas, mostrar o modo de escrita
      setIsWritingMode(true)
      setLastCreatedEntryId(null)
    }
  }

  // Função para voltar ao modo de escrita
  const switchToWritingMode = () => {
    setIsWritingMode(true)
    setLastCreatedEntryId(null)
  }

  // Função para iniciar a edição de uma entrada
  const startEditEntry = (entryId: string, content: string) => {
    setLastCreatedEntryId(null) // Clear the "last created" highlight when editing any entry
    setIsWritingMode(false) // Ensure we are in viewing mode when editing
    setEditingEntryId(entryId)
    setEditContent(content)
  }

  // Função para salvar a edição de uma entrada
  const saveEditEntry = () => {
    if (!editingEntryId || !editContent.trim()) return

    setWeeklyEntries((prev) => {
      const updatedEntries = { ...prev }

      // Encontrar e atualizar a entrada específica
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

    // Limpar o estado de edição
    setEditingEntryId(null)
    setEditContent("")

    toast({
      title: "Entrada atualizada",
      description: "Sua entrada foi atualizada com sucesso.",
    })
  }

  // Função para cancelar a edição
  const cancelEdit = () => {
    setEditingEntryId(null)
    setEditContent("")
  }

  // Função para excluir uma entrada
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

  // Funções para gerenciar tarefas
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

    // Usar o callback para garantir que estamos atualizando com base no estado mais recente
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

  // Função para mover tarefas não concluídas para a próxima semana
  const moveUncompletedTasksToNextWeek = () => {
    const nextWeekStart = new Date(weekDates[0])
    nextWeekStart.setDate(nextWeekStart.getDate() + 7)
    const nextWeekDays = getWeekDays(nextWeekStart)

    const updatedTasks = tasks.map((task) => {
      // Verificar se a tarefa é desta semana e não está concluída
      const taskDate = new Date(task.date)
      const isCurrentWeekTask = weekDates[0] <= taskDate && taskDate <= weekDates[6]

      if (isCurrentWeekTask && !task.completed) {
        // Mover para o mesmo dia da próxima semana
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

  // Função para arquivar o diário da semana atual
  const archiveCurrentWeek = () => {
    const weekStart = formatDate(weekDates[0])
    const weekEnd = formatDate(weekDates[6])

    // Criar objeto de semana arquivada
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

    // Adicionar à lista de semanas arquivadas
    setArchivedWeeks([...archivedWeeks, archivedWeek])

    // Limpar o diário atual
    setWeeklyEntries(
      diasDaSemana.reduce((acc, day) => {
        acc[day] = []
        return acc
      }, {} as WeeklyEntries),
    )

    // Remover tarefas da semana atual
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

  // Função para visualizar um arquivo de semana
  const viewArchive = (archive: ArchivedWeek) => {
    setSelectedArchive(archive)
  }

  // Função para excluir um arquivo de semana
  const deleteArchive = (id: string, e: React.MouseEvent) => {
    // Impedir a propagação do evento para não selecionar o arquivo ao excluí-lo
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

  // Função para restaurar uma semana arquivada
  const restoreArchivedWeek = (id: string) => {
    const weekToRestore = archivedWeeks.find((week) => week.id === id)
    if (!weekToRestore) return

    // Restaurar entradas
    setWeeklyEntries({
      ...weeklyEntries,
      ...weekToRestore.entries,
    })

    // Restaurar tarefas
    setTasks([...tasks, ...weekToRestore.tasks])

    // Remover da lista de arquivados
    setArchivedWeeks(archivedWeeks.filter((week) => week.id !== id))

    toast({
      title: "Semana restaurada",
      description: `A semana de ${formatReadableDate(new Date(weekToRestore.startDate))} a ${formatReadableDate(new Date(weekToRestore.endDate))} foi restaurada.`,
    })
  }

  // Filtrar tarefas para o dia selecionado
  const selectedDayTasks = useMemo(() => {
    const selectedDateIndex = diasDaSemana.indexOf(selectedDay)
    if (selectedDateIndex === -1) return []

    const selectedDate = weekDates[selectedDateIndex]
    const dateStr = formatDate(selectedDate)

    return tasks.filter((task) => task.date === dateStr)
  }, [tasks, selectedDay, weekDates])

  // Filtrar tarefas para a semana atual
  const currentWeekTasks = useMemo(() => {
    const weekStart = formatDate(weekDates[0])
    const weekEnd = formatDate(weekDates[6])

    return tasks.filter((task) => {
      const taskDate = task.date
      return taskDate >= weekStart && taskDate <= weekEnd
    })
  }, [tasks, weekDates])

  // Calcular estatísticas para a semana atual
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

  // Encontrar a entrada recém-criada para exibição
  const lastCreatedEntry = lastCreatedEntryId
    ? weeklyEntries[selectedDay]?.find((entry) => entry.id === lastCreatedEntryId)
    : null

  // Renderizar o título da semana
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

  // Adicionar após a função addTask
  console.log("Tarefas atuais:", tasks)

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diário Semanal</h1>
          <p className="text-muted-foreground mt-1">{weekTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button variant={weekOffset === 0 ? "default" : "outline"} size="sm" onClick={goToCurrentWeek}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek} className="flex items-center gap-1">
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant={viewingArchives ? "default" : "outline"}
            size="sm"
            className="gap-2"
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

      <Separator className="my-6" />

      {viewingArchives ? (
        // Visualização de arquivos
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Archive className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Arquivos Semanais</h2>
          </div>

          {archivedWeeks.length === 0 ? (
            <Card className="border-dashed">
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
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedArchive?.id === archive.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                        <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                          <span className="text-xs text-muted-foreground">Anotações</span>
                          <span className="text-lg font-semibold">{totalEntries}</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                          <span className="text-xs text-muted-foreground">Tarefas</span>
                          <span className="text-lg font-semibold">{totalTasks}</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                          <span className="text-xs text-muted-foreground">Concluídas</span>
                          <span className="text-lg font-semibold">{completedTasks}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
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
            <div className="space-y-4 mt-8 bg-card/50 p-6 rounded-lg border">
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
                <TabsList>
                  <TabsTrigger value="entries">Anotações</TabsTrigger>
                  <TabsTrigger value="tasks">Tarefas</TabsTrigger>
                </TabsList>

                <TabsContent value="entries" className="space-y-4 mt-4">
                  {diasDaSemana.map((dia) => {
                    // Verificar se o dia existe no arquivo e se tem entradas
                    const entries = selectedArchive.entries[dia] || []
                    return entries.length > 0 ? (
                      <Card key={dia}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{dia}</CardTitle>
                          <CardDescription>
                            {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {entries.map((entry) => (
                            <div key={entry.id} className="border rounded-md p-4 bg-background">
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
                      <Card>
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
                                  <div key={task.id} className="flex items-center gap-2 p-2 rounded border bg-card/50">
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

                      <Card>
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
                                  <div key={task.id} className="flex items-center gap-2 p-2 rounded border bg-card/50">
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
                    <Card>
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
        // Visualização do diário
        <>
          <Tabs defaultValue="diary">
            <TabsList className="mb-6">
              <TabsTrigger value="diary" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Diário
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1">
                <ListChecks className="h-4 w-4" />
                Tarefas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diary">
              {/* Grid de dias da semana */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
                {diasDaSemana.map((dia, index) => {
                  // Verificar se o dia é o dia atual da semana
                  const isCurrentDay = dia === getCurrentDay() && weekOffset === 0
                  const dateForDay = weekDates[index]
                  const formattedDate = formatReadableDate(dateForDay)
                  const entryCount = weeklyEntries[dia]?.length || 0

                  return (
                    <Card
                      key={dia}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedDay === dia
                          ? "border-primary bg-primary/10"
                          : isCurrentDay
                            ? "border-primary/30 bg-primary/5"
                            : "hover:border-primary/20"
                      }`}
                      onClick={() => selectDay(dia)}
                    >
                      <CardContent className="p-4 text-center">
                        <h3 className={`font-medium ${selectedDay === dia ? "text-primary" : ""}`}>{dia}</h3>
                        <div className="text-xs text-muted-foreground mt-1">{formattedDate}</div>
                        <div className="mt-2">
                          {entryCount > 0 ? (
                            <Badge variant={selectedDay === dia ? "default" : "secondary"} className="text-xs">
                              {entryCount} {entryCount === 1 ? "entrada" : "entradas"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem entradas</span>
                          )}
                        </div>
                        {isCurrentDay && <div className="mt-2 text-xs text-primary font-medium">Hoje</div>}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {isWritingMode ? (
                // Modo de escrita - Área de entrada para o dia selecionado
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Nova Entrada para {selectedDay}</CardTitle>
                    <CardDescription>Registre seus pensamentos para {selectedDay}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={`Escreva aqui sua entrada de diário para ${selectedDay}...`}
                      className="min-h-[200px] resize-none focus-visible:ring-primary"
                      value={entry}
                      onChange={(e) => setEntry(e.target.value)}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={saveEntry} className="gap-2">
                      <Save className="h-4 w-4" />
                      Salvar Entrada
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                // Modo de visualização - Mostrar a entrada recém-criada
                <>
                  {lastCreatedEntry && (
                    <Card className="border-primary bg-primary/5 mb-6">
                      <CardContent className="p-6">
                        <div className="flex justify-end items-center gap-2 mb-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditEntry(lastCreatedEntry.id, lastCreatedEntry.content)}
                            className="h-8 w-8 hover:bg-background"
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
                        <div className="text-xs text-muted-foreground mb-2">
                          {new Date(lastCreatedEntry.createdAt).toLocaleString()}
                        </div>
                        <p className="whitespace-pre-wrap">{lastCreatedEntry.content}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Entradas anteriores para o dia selecionado */}
              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-muted-foreground">Entradas Anteriores</h3>
                  <Button onClick={switchToWritingMode} variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Entrada
                  </Button>
                </div>

                {!weeklyEntries[selectedDay] ||
                weeklyEntries[selectedDay].length === 0 ||
                (weeklyEntries[selectedDay].length === 1 && lastCreatedEntryId === weeklyEntries[selectedDay][0].id) ? (
                  <Card className="border-dashed">
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
                      // Filtrar para não mostrar a entrada recém-criada que já está sendo exibida acima
                      .filter((entry) => !lastCreatedEntryId || entry.id !== lastCreatedEntryId)
                      .map((entry) => (
                        <Card key={entry.id} className="w-full hover:border-primary/20 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex justify-end items-center gap-2 mb-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditEntry(entry.id, entry.content)}
                                className="h-8 w-8 hover:bg-muted"
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
                            <div className="text-xs text-muted-foreground mb-2">
                              {new Date(entry.createdAt).toLocaleString()}
                            </div>
                            <p className="whitespace-pre-wrap">{entry.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>

              {/* Diálogo de edição */}
              {editingEntryId && (
                <Card className="mt-8 border-primary">
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
                      className="min-h-[200px] resize-none focus-visible:ring-primary"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                    <Button onClick={saveEditEntry} className="gap-2">
                      <Save className="h-4 w-4" />
                      Salvar Alterações
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks">
              {/* Grid de dias da semana */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
                {diasDaSemana.map((dia, index) => {
                  // Verificar se o dia é o dia atual da semana
                  const isCurrentDay = dia === getCurrentDay() && weekOffset === 0
                  const dateForDay = weekDates[index]
                  const formattedDate = formatReadableDate(dateForDay)

                  // Filtrar tarefas para este dia
                  const dayTasks = tasks.filter((task) => task.date === formatDate(dateForDay))
                  const completedTasks = dayTasks.filter((task) => task.completed).length

                  return (
                    <Card
                      key={dia}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedDay === dia
                          ? "border-primary bg-primary/10"
                          : isCurrentDay
                            ? "border-primary/30 bg-primary/5"
                            : "hover:border-primary/20"
                      }`}
                      onClick={() => selectDay(dia)}
                    >
                      <CardContent className="p-4 text-center">
                        <h3 className={`font-medium ${selectedDay === dia ? "text-primary" : ""}`}>{dia}</h3>
                        <div className="text-xs text-muted-foreground mt-1">{formattedDate}</div>
                        <div className="mt-2">
                          {dayTasks.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant={selectedDay === dia ? "default" : "secondary"} className="text-xs">
                                {dayTasks.length} {dayTasks.length === 1 ? "tarefa" : "tarefas"}
                              </Badge>
                              {completedTasks > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  {completedTasks} concluída{completedTasks !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem tarefas</span>
                          )}
                        </div>
                        {isCurrentDay && <div className="mt-2 text-xs text-primary font-medium">Hoje</div>}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Tarefas do dia selecionado */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    Tarefas para {selectedDay}
                  </CardTitle>
                  <CardDescription>
                    {selectedDayTasks.length === 0
                      ? "Nenhuma tarefa para este dia. Adicione sua primeira tarefa abaixo."
                      : `${selectedDayTasks.length} tarefa(s) para este dia, ${selectedDayTasks.filter((t) => t.completed).length} concluída(s).`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Formulário para adicionar/editar tarefas */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar nova tarefa..."
                        value={editingTask ? editingTask.content : newTask}
                        onChange={(e) =>
                          editingTask
                            ? setEditingTask({ ...editingTask, content: e.target.value })
                            : setNewTask(e.target.value)
                        }
                        className="flex-1"
                      />
                      {editingTask ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setEditingTask(null)}>
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

                  {/* Lista de tarefas */}
                  {selectedDayTasks.length > 0 ? (
                    <div className="space-y-4">
                      {/* Tarefas pendentes */}
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
                                <div key={task.id} className="flex items-center gap-2 p-2 rounded border bg-card/50">
                                  <Checkbox
                                    id={`task-${task.id}`}
                                    checked={task.completed}
                                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                                  />
                                  <label htmlFor={`task-${task.id}`} className="flex-1 text-sm cursor-pointer">
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

                      {/* Tarefas concluídas */}
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
                                <div key={task.id} className="flex items-center gap-2 p-2 rounded border bg-card/50">
                                  <Checkbox
                                    id={`task-${task.id}`}
                                    checked={task.completed}
                                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                                  />
                                  <label
                                    htmlFor={`task-${task.id}`}
                                    className="flex-1 text-sm line-through text-muted-foreground cursor-pointer"
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

          {/* Revisão semanal (visível apenas aos domingos) */}
          {isDomingo && weekOffset === 0 && (
            <Card className="border-t-4 border-t-amber-500 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <ListChecks className="h-5 w-5" />
                  Revisão Semanal
                </CardTitle>
                <CardDescription>Hoje é domingo! Revise sua semana e planeje a próxima.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Resumo da Semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
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
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {weekStats.completedTasks}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Tarefas pendentes:</span>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {weekStats.pendingTasks}
                          </Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span>Taxa de conclusão:</span>
                            <Badge
                              variant={weekStats.completionRate >= 70 ? "default" : "outline"}
                              className={
                                weekStats.completionRate >= 70
                                  ? "bg-green-600"
                                  : weekStats.completionRate >= 30
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {weekStats.completionRate}%
                            </Badge>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                            <div
                              className={`h-2.5 rounded-full ${
                                weekStats.completionRate >= 70
                                  ? "bg-green-600"
                                  : weekStats.completionRate >= 30
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${weekStats.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Ações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={moveUncompletedTasksToNextWeek}
                      >
                        <ArrowRightCircle className="h-4 w-4 mr-2" />
                        Transferir tarefas pendentes
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={goToNextWeek}>
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Planejar próxima semana
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={archiveCurrentWeek}>
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar semana atual
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Tarefas pendentes */}
                {weekStats.pendingTasks > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-amber-500" />
                        Tarefas Pendentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {currentWeekTasks
                          .filter((task) => !task.completed)
                          .map((task) => (
                            <div key={task.id} className="flex items-center gap-2 p-2 rounded border bg-card/50">
                              <Checkbox
                                id={`pending-${task.id}`}
                                checked={task.completed}
                                onCheckedChange={() => toggleTaskCompletion(task.id)}
                              />
                              <label htmlFor={`pending-${task.id}`} className="flex-1 text-sm cursor-pointer">
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
  )
}
