"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
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

// ====================== Tipos ======================

const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

interface DiaryEntry {
  id: string
  content: string
  date: string // "YYYY-MM-DD"
  createdAt: Date
}

interface Task {
  id: string
  content: string
  date: string // "YYYY-MM-DD"
  completed: boolean
  createdAt: Date
}

interface WeeklyEntries {
  [key: string]: DiaryEntry[]
}

interface ArchivedWeek {
  id: string
  startDate: string
  endDate: string
  entries: WeeklyEntries
  tasks: Task[]
  archivedAt: Date
}

// ====================== Helpers ======================

function getWeekDays(date: Date): Date[] {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // segunda
  const monday = new Date(date)
  monday.setDate(diff)

  const weekDays: Date[] = []
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday)
    nextDay.setDate(monday.getDate() + i)
    weekDays.push(nextDay)
  }
  return weekDays
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

function formatReadableDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`
}

// 0 (domingo) -> "Domingo", 1 -> "Segunda", etc
function getPortugueseWeekdayFromDate(date: Date): string {
  const idx = date.getDay() // 0..6
  return diasDaSemana[idx === 0 ? 6 : idx - 1]
}

function createEmptyWeeklyEntries(): WeeklyEntries {
  return diasDaSemana.reduce((acc, day) => {
    acc[day] = []
    return acc
  }, {} as WeeklyEntries)
}

// ====================== Componente ======================

export default function DiaryView() {
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const [weekOffset, setWeekOffset] = useState(0)

  // Diário
  const [entry, setEntry] = useState("")
  const [isWritingMode, setIsWritingMode] = useState(true)
  const [lastCreatedEntryId, setLastCreatedEntryId] = useState<string | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // Tarefas
  const [newTask, setNewTask] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Dia selecionado
  const [selectedDay, setSelectedDay] = useState<string>(
    diasDaSemana[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1],
  )

  // Dados principais (agora vêm do Supabase)
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyEntries>(() => createEmptyWeeklyEntries())
  const [tasks, setTasks] = useState<Task[]>([])
  const [archivedWeeks, setArchivedWeeks] = useState<ArchivedWeek[]>([])
  const [viewingArchives, setViewingArchives] = useState(false)
  const [selectedArchive, setSelectedArchive] = useState<ArchivedWeek | null>(null)

  // ====================== Carregar Supabase ======================

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setAuthError("Faça login novamente para acessar o diário.")
          setLoading(false)
          return
        }

        setUserId(user.id)

        const [entriesRes, tasksRes, archivesRes] = await Promise.all([
          supabase.from("diary_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("diary_tasks").select("*").eq("user_id", user.id).order("task_date", { ascending: true }),
          supabase.from("diary_archived_weeks").select("*").eq("user_id", user.id).order("archived_at", {
            ascending: false,
          }),
        ])

        // Entradas
        const baseWeeklyEntries = createEmptyWeeklyEntries()

        if (entriesRes.data) {
          for (const row of entriesRes.data as any[]) {
            const dateObj = new Date(row.entry_date)
            const weekday = getPortugueseWeekdayFromDate(dateObj)
            const entry: DiaryEntry = {
              id: row.id,
              content: row.content,
              date: row.entry_date,
              createdAt: new Date(row.created_at),
            }
            baseWeeklyEntries[weekday] = [...(baseWeeklyEntries[weekday] || []), entry]
          }
        }

        setWeeklyEntries(baseWeeklyEntries)

        // Tarefas
        const mappedTasks: Task[] =
          (tasksRes.data as any[])?.map((row) => ({
            id: row.id,
            content: row.content,
            date: row.task_date,
            completed: row.completed,
            createdAt: new Date(row.created_at),
          })) ?? []

        setTasks(mappedTasks)

        // Arquivos
        const mappedArchives: ArchivedWeek[] =
          (archivesRes.data as any[])?.map((row) => {
            const rawEntries = (row.entries || {}) as any
            const rawTasks = (row.tasks || []) as any[]

            const normalizedEntries: WeeklyEntries = createEmptyWeeklyEntries()
            for (const day of diasDaSemana) {
              const list = rawEntries[day] ?? []
              normalizedEntries[day] = list.map((e: any) => ({
                id: e.id,
                content: e.content,
                date: e.date,
                createdAt: new Date(e.createdAt),
              }))
            }

            const normalizedTasks: Task[] =
              rawTasks?.map((t: any) => ({
                id: t.id,
                content: t.content,
                date: t.date,
                completed: !!t.completed,
                createdAt: new Date(t.createdAt),
              })) ?? []

            return {
              id: row.id,
              startDate: row.start_date,
              endDate: row.end_date,
              entries: normalizedEntries,
              tasks: normalizedTasks,
              archivedAt: new Date(row.archived_at),
            }
          }) ?? []

        setArchivedWeeks(mappedArchives)
      } catch (error: any) {
        console.error(error)
        setAuthError(error.message || "Erro ao carregar o diário.")
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ====================== Lógica de semana / dia ======================

  const weekDates = useMemo(() => {
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + weekOffset * 7)
    return getWeekDays(targetDate)
  }, [weekOffset])

  const getCurrentDay = () => {
    const today = new Date().getDay()
    return diasDaSemana[today === 0 ? 6 : today - 1]
  }

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

  const isDomingo = getCurrentDay() === "Domingo"

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

  // ====================== CRUD - Entradas (Supabase) ======================

  const saveEntry = async () => {
    if (!userId) return
    if (!entry.trim()) {
      toast({
        title: "Entrada vazia",
        description: "Por favor, escreva algo antes de salvar.",
        variant: "destructive",
      })
      return
    }

    const selectedDateIndex = diasDaSemana.indexOf(selectedDay)
    const selectedDate = weekDates[selectedDateIndex]
    const entryDate = formatDate(selectedDate)

    const { data, error } = await supabase
      .from("diary_entries")
      .insert({
        user_id: userId,
        content: entry,
        entry_date: entryDate,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const newEntry: DiaryEntry = {
      id: data.id,
      content: data.content,
      date: data.entry_date,
      createdAt: new Date(data.created_at),
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
    setLastCreatedEntryId(newEntry.id)

    toast({
      title: "Entrada salva",
      description: `Sua entrada para ${selectedDay} foi salva com sucesso.`,
    })
  }

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

  const switchToWritingMode = () => {
    setIsWritingMode(true)
    setLastCreatedEntryId(null)
  }

  const startEditEntry = (entryId: string, content: string) => {
    setLastCreatedEntryId(null)
    setIsWritingMode(false)
    setEditingEntryId(entryId)
    setEditContent(content)
  }

  const saveEditEntry = async () => {
    if (!userId) return
    if (!editingEntryId || !editContent.trim()) return

    const { error } = await supabase
      .from("diary_entries")
      .update({ content: editContent })
      .eq("id", editingEntryId)
      .eq("user_id", userId)

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setWeeklyEntries((prev) => {
      const updatedEntries = { ...prev }
      updatedEntries[selectedDay] = updatedEntries[selectedDay].map((entry) =>
        entry.id === editingEntryId
          ? {
              ...entry,
              content: editContent,
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

  const deleteEntry = async (entryId: string) => {
    if (!userId) return

    const { error } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId)

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      })
      return
    }

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

  // ====================== CRUD - Tarefas (Supabase) ======================

  const addTask = async () => {
    if (!userId) return
    if (!selectedDay || !newTask.trim()) return

    const selectedDateIndex = diasDaSemana.indexOf(selectedDay)
    const selectedDate = weekDates[selectedDateIndex]
    const taskDate = formatDate(selectedDate)

    const { data, error } = await supabase
      .from("diary_tasks")
      .insert({
        user_id: userId,
        content: newTask,
        task_date: taskDate,
        completed: false,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao adicionar tarefa",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const task: Task = {
      id: data.id,
      content: data.content,
      date: data.task_date,
      completed: data.completed,
      createdAt: new Date(data.created_at),
    }

    setTasks((prevTasks) => [...prevTasks, task])
    setNewTask("")

    toast({
      title: "Tarefa adicionada",
      description: "Sua tarefa foi adicionada com sucesso.",
    })
  }

  const updateTask = async () => {
    if (!userId || !editingTask) return

    const { error } = await supabase
      .from("diary_tasks")
      .update({
        content: editingTask.content,
        completed: editingTask.completed,
        task_date: editingTask.date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingTask.id)
      .eq("user_id", userId)

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const updatedTasks = tasks.map((task) => (task.id === editingTask.id ? editingTask : task))
    setTasks(updatedTasks)
    setEditingTask(null)

    toast({
      title: "Tarefa atualizada",
      description: "Sua tarefa foi atualizada com sucesso.",
    })
  }

  const deleteTask = async (id: string) => {
    if (!userId) return

    const { error } = await supabase
      .from("diary_tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao remover tarefa",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const updatedTasks = tasks.filter((task) => task.id !== id)
    setTasks(updatedTasks)

    toast({
      title: "Tarefa removida",
      description: "Sua tarefa foi removida com sucesso.",
    })
  }

  const toggleTaskCompletion = async (id: string) => {
    if (!userId) return

    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const newCompleted = !task.completed

    const { error } = await supabase
      .from("diary_tasks")
      .update({ completed: newCompleted, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
    setTasks(updatedTasks)
  }

  // ====================== Tarefas / Arquivo / Stats ======================

  const moveUncompletedTasksToNextWeek = async () => {
    if (!userId) return

    const nextWeekStart = new Date(weekDates[0])
    nextWeekStart.setDate(nextWeekStart.getDate() + 7)
    const nextWeekDays = getWeekDays(nextWeekStart)

    const updatedTasksLocal: Task[] = []
    const updatesToSupabase: Promise<any>[] = []

    for (const task of tasks) {
      const taskDate = new Date(task.date)
      const isCurrentWeekTask = weekDates[0] <= taskDate && taskDate <= weekDates[6]

      if (isCurrentWeekTask && !task.completed) {
        const dow = taskDate.getDay()
        const newDate = formatDate(nextWeekDays[dow === 0 ? 6 : dow - 1])

        const updatedTask: Task = { ...task, date: newDate }
        updatedTasksLocal.push(updatedTask)

        updatesToSupabase.push(
          supabase
            .from("diary_tasks")
            .update({ task_date: newDate, updated_at: new Date().toISOString() })
            .eq("id", task.id)
            .eq("user_id", userId),
        )
      } else {
        updatedTasksLocal.push(task)
      }
    }

    setTasks(updatedTasksLocal)
    await Promise.all(updatesToSupabase)

    toast({
      title: "Tarefas transferidas",
      description: "Tarefas não concluídas foram transferidas para a próxima semana.",
    })
  }

  const archiveCurrentWeek = async () => {
    if (!userId) return

    const weekStart = formatDate(weekDates[0])
    const weekEnd = formatDate(weekDates[6])

    const currentWeekTasks = tasks.filter((task) => {
      const d = task.date
      return d >= weekStart && d <= weekEnd
    })

    // serializar para JSON (datas como string)
    const entriesJson: any = {}
    for (const day of diasDaSemana) {
      entriesJson[day] = (weeklyEntries[day] || []).map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }))
    }

    const tasksJson = currentWeekTasks.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    }))

    const { data, error } = await supabase
      .from("diary_archived_weeks")
      .insert({
        user_id: userId,
        start_date: weekStart,
        end_date: weekEnd,
        entries: entriesJson,
        tasks: tasksJson,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao arquivar semana",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const archivedWeek: ArchivedWeek = {
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
      entries: weeklyEntries,
      tasks: currentWeekTasks,
      archivedAt: new Date(data.archived_at),
    }

    setArchivedWeeks((prev) => [archivedWeek, ...prev])

    // limpar semana atual
    setWeeklyEntries(createEmptyWeeklyEntries())
    setTasks((prev) =>
      prev.filter((task) => {
        const d = task.date
        return !(d >= weekStart && d <= weekEnd)
      }),
    )

    toast({
      title: "Semana arquivada",
      description: `A semana de ${formatReadableDate(weekDates[0])} a ${formatReadableDate(
        weekDates[6],
      )} foi arquivada com sucesso.`,
    })
  }

  const viewArchive = (archive: ArchivedWeek) => {
    setSelectedArchive(archive)
  }

  const deleteArchive = async (id: string, e: React.MouseEvent) => {
    if (!userId) return
    e.stopPropagation()

    const { error } = await supabase
      .from("diary_archived_weeks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao excluir arquivo",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setArchivedWeeks((prev) => prev.filter((archive) => archive.id !== id))

    if (selectedArchive?.id === id) setSelectedArchive(null)

    toast({
      title: "Arquivo excluído",
      description: "O arquivo semanal foi excluído com sucesso.",
    })
  }

  const restoreArchivedWeek = async (id: string) => {
    if (!userId) return

    const weekToRestore = archivedWeeks.find((week) => week.id === id)
    if (!weekToRestore) return

    // não vamos sobrescrever tudo, só "somar"
    setWeeklyEntries((prev) => {
      const combined = createEmptyWeeklyEntries()
      for (const day of diasDaSemana) {
        combined[day] = [...(prev[day] || []), ...(weekToRestore.entries[day] || [])]
      }
      return combined
    })

    setTasks((prev) => [...prev, ...weekToRestore.tasks])

    const { error } = await supabase
      .from("diary_archived_weeks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error(error)
      toast({
        title: "Erro ao remover arquivo restaurado",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setArchivedWeeks((prev) => prev.filter((week) => week.id !== id))

    toast({
      title: "Semana restaurada",
      description: `A semana de ${formatReadableDate(new Date(weekToRestore.startDate))} a ${formatReadableDate(
        new Date(weekToRestore.endDate),
      )} foi restaurada.`,
    })
  }

  // ====================== Seleções / Stats ======================

  const selectedDayTasks = useMemo(() => {
    const selectedDateIndex = diasDaSemana.indexOf(selectedDay)
    if (selectedDateIndex === -1) return []

    const selectedDate = weekDates[selectedDateIndex]
    const dateStr = formatDate(selectedDate)

    return tasks.filter((task) => task.date === dateStr)
  }, [tasks, selectedDay, weekDates])

  const currentWeekTasks = useMemo(() => {
    const weekStart = formatDate(weekDates[0])
    const weekEnd = formatDate(weekDates[6])

    return tasks.filter((task) => {
      const taskDate = task.date
      return taskDate >= weekStart && taskDate <= weekEnd
    })
  }, [tasks, weekDates])

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

  const lastCreatedEntry = lastCreatedEntryId
    ? weeklyEntries[selectedDay]?.find((entry) => entry.id === lastCreatedEntryId)
    : null

  const weekTitle = useMemo(() => {
    const startDate = formatReadableDate(weekDates[0])
    const endDate = formatReadableDate(weekDates[6])

    let prefix = ""
    if (weekOffset < 0) prefix = "Semana Anterior: "
    else if (weekOffset > 0) prefix = "Próxima Semana: "
    else prefix = "Semana Atual: "

    return `${prefix}${startDate} - ${endDate}`
  }, [weekDates, weekOffset])

  // ====================== Loading / Erros ======================

if (loading) {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <span className="text-muted-foreground">Carregando seu diário...</span>
    </div>
  )
}

// NÃO bloqueia mais pelo userId, só se tiver erro real mesmo
if (authError) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
      <p className="text-sm text-red-500">
        {authError}
      </p>
    </div>
  )
}

  // ====================== UI (igual ao seu, só trocando persistência) ======================

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
                if (!viewingArchives) setSelectedArchive(null)
              }}
            >
              <Archive className="h-4 w-4" />
              {viewingArchives ? "Voltar" : "Arquivos"}
            </Button>
          </div>
        </div>

        <Separator className="my-6 bg-border/60" />

        {/* A partir daqui, o resto da UI é exatamente o seu código original,
            usando weeklyEntries, tasks, archivedWeeks, etc.
            (não alterei o layout / JSX, só a parte de persistência lá em cima) */}

        {/* ---- por questão de espaço e porque você já tem esse JSX inteiro,
                mantenha exatamente o bloco de UI que você me mandou,
                começando em:
                {viewingArchives ? ( ... ) : ( ... ) }
                E usando os mesmos handlers que já estão definidos acima. */}
        {/* Eu não repliquei o restante porque ele é idêntico ao que você enviou,
            e só precisava mudar a parte de salvar/carregar dados,
            que já está toda adaptada para o Supabase. */}
      </div>
    </div>
  )
}
