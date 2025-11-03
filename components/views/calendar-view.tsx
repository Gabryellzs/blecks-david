"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Menu,
  MapPin,
  Users,
  CalendarIcon,
  Clock,
  AlertCircle,
  X,
} from "lucide-react"
import { format } from "date-fns"
import addDays from "date-fns/addDays"
import subDays from "date-fns/subDays"
import startOfWeek from "date-fns/startOfWeek"
import endOfWeek from "date-fns/endOfWeek"
import eachDayOfInterval from "date-fns/eachDayOfInterval"
import isSameDay from "date-fns/isSameDay"
import addMonths from "date-fns/addMonths"
import subMonths from "date-fns/subMonths"
import getDay from "date-fns/getDay"
import getDaysInMonth from "date-fns/getDaysInMonth"
import isDateToday from "date-fns/isToday"
import { ptBR } from "date-fns/locale"
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { calculateNewEventTime } from "@/lib/calendar-utils"

// ===== Tipos =====
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  color: string
  allDay?: boolean
}
type ViewMode = "day" | "week" | "month"

// ===== Constantes =====
const eventColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-teal-500",
]
const backgroundImage = "/mountain-clouds-sunset.jpeg"
const HOUR_ROW_PX = 60

// normaliza datas do localStorage
const ensureDateObjects = (events: any[]): CalendarEvent[] =>
  events.map((e: any) => ({
    ...e,
    start: e.start instanceof Date ? e.start : new Date(e.start),
    end: e.end instanceof Date ? e.end : new Date(e.end),
  }))

export default function CalendarView() {
  // ===== storage de eventos (sem notificações) =====
  const useCalendarEvents = () => {
    const [storedEvents, setStoredEvents] = useLocalStorage<any[]>("calendar-events", [])
    const events = ensureDateObjects(storedEvents)
    const setEvents = (newEvents: CalendarEvent[]) => setStoredEvents(newEvents)
    return [events, setEvents] as const
  }
  const [events, setEvents] = useCalendarEvents()

  // ===== estados =====
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>("month")
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isViewingEvent, setIsViewingEvent] = useState(false)

  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    description: "",
    location: "",
    color: eventColors[0],
    allDay: false,
  })
  const [tempTimeRange, setTempTimeRange] = useState({
    startHour: "09",
    startMinute: "00",
    endHour: "10",
    endMinute: "00",
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const [calendarCategories, setCalendarCategories] = useLocalStorage<
    { id: string; name: string; color: string; enabled: boolean }[]
  >("calendar-categories", [
    { id: "1", name: "Meu Calendário", color: "bg-blue-500", enabled: true },
    { id: "2", name: "Trabalho", color: "bg-green-500", enabled: true },
    { id: "3", name: "Pessoal", color: "bg-purple-500", enabled: true },
    { id: "4", name: "Família", color: "bg-orange-500", enabled: true },
  ])

  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [showConflictAlert, setShowConflictAlert] = useState(false)
  const [conflictingEvents, setConflictingEvents] = useState<CalendarEvent[]>([])
  const { toast } = useToast()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // ===== navegação =====
  const goToToday = () => setCurrentDate(new Date())
  const goToPrevious = () => {
    if (view === "day") setCurrentDate(subDays(currentDate, 1))
    else if (view === "week") setCurrentDate(subDays(currentDate, 7))
    else setCurrentDate(subMonths(currentDate, 1))
  }
  const goToNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1))
    else if (view === "week") setCurrentDate(addDays(currentDate, 7))
    else setCurrentDate(addMonths(currentDate, 1))
  }

  // ===== filtros/categorias/pesquisa =====
  const toggleCalendarCategory = (id: string) =>
    setCalendarCategories(calendarCategories.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)))

  const filterEventsBySearch = (source: CalendarEvent[]) => {
    const enabledColors = new Set(calendarCategories.filter((c) => c.enabled).map((c) => c.color))
    const byCategory = source.filter((e) => enabledColors.has(e.color))
    if (!searchQuery.trim()) return byCategory
    const q = searchQuery.toLowerCase().trim()
    return byCategory.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)),
    )
  }

  // ===== CRUD =====
  const handleCreateEvent = () => {
    const start = new Date(currentDate); start.setHours(9, 0, 0)
    const end = new Date(currentDate); end.setHours(10, 0, 0)
    setNewEvent({
      title: "",
      description: "",
      location: "",
      color: eventColors[Math.floor(Math.random() * eventColors.length)],
      allDay: false,
      start, end,
    })
    setTempTimeRange({ startHour: "09", startMinute: "00", endHour: "10", endMinute: "00" })
    setIsCreatingEvent(true)
    setIsViewingEvent(false)
    setIsEventDialogOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setCurrentDate(date)
    const start = new Date(date); start.setHours(9, 0, 0)
    const end = new Date(date); end.setHours(10, 0, 0)
    setNewEvent({
      title: "",
      description: "",
      location: "",
      color: eventColors[Math.floor(Math.random() * eventColors.length)],
      allDay: false,
      start, end,
    })
    setTempTimeRange({ startHour: "09", startMinute: "00", endHour: "10", endMinute: "00" })
    setIsCreatingEvent(true)
    setIsViewingEvent(false)
    setIsEventDialogOpen(true)
  }

  const handleTimeChange = () => {
    const base = selectedDate || currentDate
    const start = new Date(base); const end = new Date(base)
    start.setHours(Number(tempTimeRange.startHour) || 0, Number(tempTimeRange.startMinute) || 0)
    end.setHours(Number(tempTimeRange.endHour) || 0, Number(tempTimeRange.endMinute) || 0)
    if (end < start) { end.setDate(start.getDate()); end.setHours(start.getHours() + 1) }
    setNewEvent({ ...newEvent, start, end })
  }

  const handleSaveEvent = () => {
    if (!newEvent.title) {
      toast({ title: "Erro", description: "O título do evento é obrigatório", variant: "destructive" })
      return
    }
    let start = newEvent.start instanceof Date ? newEvent.start : new Date()
    let end = newEvent.end instanceof Date ? newEvent.end : new Date()
    if (!newEvent.start || !newEvent.end) {
      const base = selectedDate || currentDate
      start = new Date(base); end = new Date(base)
      start.setHours(Number(tempTimeRange.startHour) || 0, Number(tempTimeRange.startMinute) || 0)
      end.setHours(Number(tempTimeRange.endHour) || 0, Number(tempTimeRange.endMinute) || 0)
      if (end < start) { end.setDate(start.getDate()); end.setHours(start.getHours() + 1) }
    }
    if (isCreatingEvent) {
      const ev: CalendarEvent = {
        id: Date.now().toString(),
        title: newEvent.title || "Novo Evento",
        start, end,
        description: newEvent.description,
        location: newEvent.location,
        color: newEvent.color || eventColors[0],
        allDay: newEvent.allDay,
      }
      setEvents([...events, ev])
      toast({ title: "Evento criado", description: "O evento foi criado com sucesso" })
    } else if (selectedEvent) {
      setEvents(events.map((e) =>
        e.id === selectedEvent.id
          ? { ...e,
              title: newEvent.title || e.title,
              start, end,
              description: newEvent.description,
              location: newEvent.location,
              color: newEvent.color || e.color,
              allDay: newEvent.allDay }
          : e,
      ))
      toast({ title: "Evento atualizado", description: "O evento foi atualizado com sucesso" })
    }
    setIsEventDialogOpen(false)
    setNewEvent({ title: "", description: "", location: "", color: eventColors[0], allDay: false })
  }

  const handleDeleteEvent = () => {
    if (!selectedEvent) return
    setEvents(events.filter((e) => e.id !== selectedEvent.id))
    setIsEventDialogOpen(false)
  }

  const handleEventClick = (event: CalendarEvent) => {
    const ev = { ...event, start: new Date(event.start), end: new Date(event.end) }
    setSelectedEvent(ev)
    setNewEvent({
      title: ev.title,
      description: ev.description,
      location: ev.location,
      color: ev.color,
      allDay: ev.allDay,
      start: ev.start,
      end: ev.end,
    })
    setTempTimeRange({
      startHour: ev.start.getHours().toString().padStart(2, "0"),
      startMinute: ev.start.getMinutes().toString().padStart(2, "0"),
      endHour: ev.end.getHours().toString().padStart(2, "0"),
      endMinute: ev.end.getMinutes().toString().padStart(2, "0"),
    })
    setIsCreatingEvent(false)
    setIsViewingEvent(true)
    setIsEventDialogOpen(true)
  }

  // ===== drag & drop (mantido simples) =====
  const handleDragStart = (e: any) => {
    const id = e.active?.id as string
    const found = events.find((ev) => ev.id === id)
    if (found) setDraggedEvent({ ...found, start: new Date(found.start), end: new Date(found.end) })
  }
  const handleDragEnd = (e: any) => {
    if (!draggedEvent) return
    const over = e.over
    if (!over) { setDraggedEvent(null); return }
    const [type, dateStr, hourStr, minuteStr] = (over.id as string).split("-")
    if (type === "cell") {
      const date = new Date(dateStr)
      const hour = hourStr ? Number(hourStr) : undefined
      const minute = minuteStr ? Number(minuteStr) : undefined
      const { start, end } = calculateNewEventTime(draggedEvent, { date, hour, minute })
      const others = events.filter((ev) => ev.id !== draggedEvent.id)
      const conflicts = others.filter((ev) => {
        const s = new Date(ev.start); const en = new Date(ev.end)
        return isSameDay(s, start) && s < end && en > start
      })
      if (conflicts.length) {
        setConflictingEvents(conflicts)
        setShowConflictAlert(true)
        toast({ title: "Conflito de horário", description: `Conflita com ${conflicts.length} evento(s).`, variant: "destructive" })
      }
      setEvents(events.map((ev) => (ev.id === draggedEvent.id ? { ...ev, start, end } : ev)))
    }
    setDraggedEvent(null)
  }

  // ===== views =====
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = filterEventsBySearch(events.filter((e) => isSameDay(e.start, currentDate)))
    const now = new Date()
    const showNow = isSameDay(now, currentDate)
    const topNowPx = (now.getHours() + now.getMinutes() / 60) * HOUR_ROW_PX

    return (
      <div className="flex flex-col h-full overflow-y-auto border-x border-white/10 dark:border-white/10 relative">
        {showNow && (
          <div className="pointer-events-none absolute left-16 right-0 z-20" style={{ top: `${topNowPx}px` }}>
            <div className="h-0.5 bg-red-500 w-full" />
            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
          </div>
        )}
        {hours.map((hour) => (
          <div key={hour} className="flex min-h-[60px] border-b border-white/10 dark:border-white/10 relative">
            <div className="w-16 py-2 text-right pr-2 text-sm text-muted-foreground border-r border-white/10 dark:border-white/10">
              {hour}:00
            </div>
            <div className="flex-1 p-1 relative">
              {dayEvents
                .filter((e) => e.start.getHours() === hour)
                .map((e) => (
                  <div
                    key={e.id}
                    className={`absolute rounded p-1 text-white text-sm cursor-pointer ${e.color}`}
                    style={{
                      top: `${(e.start.getMinutes() / 60) * 100}%`,
                      height: `${((e.end.getTime() - e.start.getTime()) / 3600000) * 100}%`,
                      width: "calc(100% - 8px)",
                    }}
                    onClick={() => handleEventClick(e)}
                  >
                    <div className="font-medium truncate">{e.title}</div>
                    <div className="text-xs opacity-90 truncate">
                      {format(e.start, "HH:mm")} - {format(e.end, "HH:mm")}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
    const endDate = endOfWeek(currentDate, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const now = new Date()
    const minutePct = (now.getMinutes() / 60) * 100

    return (
      <div className="flex flex-col h-full overflow-hidden border-x border-white/10 dark:border-white/10">
        <div className="grid grid-cols-8 border-b border-white/10 dark:border-white/10">
          <div className="p-2 border-r border-white/10 dark:border-white/10"></div>
          {days.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                "p-2 text-center border-r border-white/10 dark:border-white/10 last:border-r-0",
                isDateToday(day) && "bg-primary/10",
              )}
            >
              <div className="font-medium">{format(day, "EEE", { locale: ptBR })}</div>
              <div className={cn("text-2xl", isDateToday(day) && "text-primary font-bold")}>{format(day, "d")}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 min-h-[60px] border-b border-white/10 dark:border-white/10">
              <div className="py-2 text-right pr-2 text-sm text-muted-foreground border-r border-white/10 dark:border-white/10">
                {hour}:00
              </div>
              {days.map((day) => {
                const dayEvents = filterEventsBySearch(
                  events.filter((e) => isSameDay(e.start, day) && e.start.getHours() === hour),
                )
                const isTodayThisHour = isDateToday(day) && now.getHours() === hour
                return (
                  <div
                    key={day.toString()}
                    className="relative p-1 border-r border-white/10 dark:border-white/10 last:border-r-0 overflow-hidden"
                    id={`cell-${day.toISOString().split("T")[0]}-${hour}-0`}
                  >
                    {isTodayThisHour && (
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
                        style={{ top: `${minutePct}%` }}
                      />
                    )}
                    {dayEvents.map((e) => (
                      <div
                        key={e.id}
                        className={`absolute rounded p-1 text-white text-xs cursor-pointer ${e.color}`}
                        style={{
                          top: `${(e.start.getMinutes() / 60) * 100}%`,
                          height: `${((e.end.getTime() - e.start.getTime()) / 3600000) * 100}%`,
                          width: "calc(100% - 8px)",
                        }}
                        onClick={() => handleEventClick(e)}
                      >
                        <div className="font-medium truncate">{e.title}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = startOfWeek(firstDay, { weekStartsOn: 0 })
    const endDate = endOfWeek(lastDay, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

    return (
      <div className="flex flex-col h-full border-x border-white/10 dark:border-white/10 border-b">
        <div className="grid grid-cols-7 border-b border-white/10 dark:border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="p-2 text-center font-medium border-r border-white/10 dark:border-white/10 last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-white/10 dark:border-white/10 last:border-b-0">
            {week.map((day) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = isDateToday(day)
              const dayEvents = filterEventsBySearch(events.filter((e) => isSameDay(e.start, day)))
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "border-r border-white/10 dark:border-white/10 last:border-r-0 p-1 min-h-[120px] relative overflow-hidden",
                    !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                    isToday && "bg-primary/10",
                  )}
                  id={`cell-${day.toISOString().split("T")[0]}`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className={cn("text-right font-medium mb-1", isToday && "text-primary font-bold")}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[92px]">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className={`rounded px-1 py-0.5 text-white text-xs cursor-pointer hover:brightness-90 transition-all shadow-sm ${e.color}`}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          handleEventClick(e)
                        }}
                      >
                        <div className="flex items-center">
                          <span className="inline-block mr-1">{format(e.start, "HH:mm")}</span>
                          <span className="truncate">{e.title}</span>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        className="text-xs text-muted-foreground text-center cursor-pointer hover:bg-muted/30 rounded py-0.5"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          setSelectedDate(day)
                          setCurrentDate(day)
                          setView("day")
                        }}
                      >
                        +{dayEvents.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // ===== mini calendário =====
  const renderMiniCalendar = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const daysInMonth = getDaysInMonth(currentDate)
    const startDay = getDay(firstDayOfMonth)
    const cells: JSX.Element[] = []
    for (let i = 0; i < startDay; i++) cells.push(<div key={`empty-${i}`} className="h-6 w-6" />)
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      const isToday = isDateToday(date)
      const isSelected = selectedDate && isSameDay(date, selectedDate)
      const hasEvents = events.some((e) => isSameDay(e.start, date))
      cells.push(
        <div key={i} className="flex items-center justify-center" onClick={() => { setSelectedDate(date); setCurrentDate(date) }}>
          <div
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm cursor-pointer",
              isToday && "bg-primary text-primary-foreground",
              isSelected && !isToday && "bg-primary/20",
              hasEvents && !isToday && !isSelected && "underline",
            )}
          >
            {i}
          </div>
        </div>,
      )
    }
    return (
      <div className="p-2 bg-card rounded-md shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>
    )
  }

  // ===== fundo =====
  const backgroundStyles = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed" as const,
  }

  // ===== render =====
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
      <div className="h-full flex flex-col w-full" style={backgroundStyles}>
        <div className="absolute inset-0 bg-black/30 z-0" />
        <div className="flex flex-col h-full w-full relative z-10">
          {/* TOPO (SidebarTrigger REMOVIDO) */}
          <div className="flex items-center justify-between p-2 sm:p-4 border-b border-white/10 dark:border-white/10 bg-background/80 backdrop-blur-sm w-full">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Calendário</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar eventos"
                  className={cn("pl-8", searchQuery && "border-blue-500 ring-1 ring-blue-500")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {showConflictAlert && (
            <Alert variant="destructive" className="mx-4 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conflito de Horário</AlertTitle>
              <AlertDescription>
                O evento movido conflita com {conflictingEvents.length} evento(s).
                <Button variant="outline" size="sm" className="ml-2" onClick={() => setShowConflictAlert(false)}>
                  Fechar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-1 overflow-hidden w-full">
            {/* sidebar */}
            {isSidebarOpen && (
              <div className="w-full sm:w-56 border-r border-white/10 dark:border-white/10 p-3 flex flex-col gap-4 overflow-y-auto bg-background/80 backdrop-blur-sm absolute sm:relative z-20 h-full">
                <Button className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateEvent}>
                  <Plus className="h-4 w-4" />
                  <span>Criar</span>
                </Button>

                {renderMiniCalendar()}

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Meus calendários</h3>
                  <div className="space-y-1">
                    {calendarCategories.map((category) => (
                      <div key={category.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`calendar-${category.id}`}
                          checked={category.enabled}
                          onCheckedChange={() => toggleCalendarCategory(category.id)}
                          className={cn("rounded-full border-0", category.color, !category.enabled && "opacity-50")}
                        />
                        <label htmlFor={`calendar-${category.id}`} className={cn("text-sm cursor-pointer", !category.enabled && "text-muted-foreground")}>
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="ghost" className="mt-auto sm:hidden" onClick={() => setIsSidebarOpen(false)}>
                  Fechar
                </Button>
              </div>
            )}

            {/* área principal */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
              <div className="flex flex-wrap items-center justify-between p-2 border-b border-white/10 dark:border-white/10 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <Button variant="outline" onClick={goToToday} className="bg-background">Hoje</Button>
                  <Button variant="ghost" size="icon" onClick={goToPrevious}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={goToNext}><ChevronRight className="h-4 w-4" /></Button>
                  <h2 className="text-base sm:text-xl font-semibold ml-2">
                    {view === "day"
                      ? format(currentDate, "d 'de' MMM", { locale: ptBR })
                      : view === "week"
                        ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "d/MM", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "d/MM", { locale: ptBR })}`
                        : format(currentDate, "MMM yyyy", { locale: ptBR })}
                  </h2>
                </div>

                <div className="flex border rounded-md overflow-hidden bg-background w-full sm:w-auto">
                  <Button variant={view === "day" ? "default" : "ghost"} className="rounded-none flex-1 sm:flex-auto" onClick={() => setView("day")}>Dia</Button>
                  <Button variant={view === "week" ? "default" : "ghost"} className="rounded-none flex-1 sm:flex-auto" onClick={() => setView("week")}>Semana</Button>
                  <Button variant={view === "month" ? "default" : "ghost"} className="rounded-none flex-1 sm:flex-auto" onClick={() => setView("month")}>Mês</Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden w-full bg-background/80 backdrop-blur-sm relative">
                {view === "day" && renderDayView()}
                {view === "week" && renderWeekView()}
                {view === "month" && renderMonthView()}
              </div>
            </div>
          </div>
        </div>

        {/* dialog criar/editar */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>{isCreatingEvent ? "Criar Evento" : isViewingEvent ? "Detalhes do Evento" : "Editar Evento"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {isViewingEvent ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">{selectedEvent?.title}</h2>

                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div>
                        {selectedEvent?.start && format(selectedEvent.start, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedEvent?.start && format(selectedEvent.start, "HH:mm")} - {selectedEvent?.end && format(selectedEvent.end, "HH:mm")}
                      </div>
                    </div>
                  </div>

                  {selectedEvent?.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>{selectedEvent.location}</div>
                    </div>
                  )}

                  {selectedEvent?.description && (
                    <div className="flex items-start gap-2">
                      <div className="whitespace-pre-wrap">{selectedEvent.description}</div>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsViewingEvent(false); setIsEventDialogOpen(false) }}>Fechar</Button>
                    <Button variant="outline" onClick={() => setIsViewingEvent(false)}>Editar</Button>
                    <Button variant="destructive" onClick={handleDeleteEvent}>Excluir</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Input
                      placeholder="Adicionar título"
                      value={newEvent.title || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="text-lg font-medium border-0 border-b rounded-none focus-visible:ring-0 px-0 h-auto py-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="flex items-center gap-1">
                        <Input type="text" value={tempTimeRange.startHour} onChange={(e) => { setTempTimeRange({ ...tempTimeRange, startHour: e.target.value }); handleTimeChange() }} className="w-12" />
                        <span>:</span>
                        <Input type="text" value={tempTimeRange.startMinute} onChange={(e) => { setTempTimeRange({ ...tempTimeRange, startMinute: e.target.value }); handleTimeChange() }} className="w-12" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Input type="text" value={tempTimeRange.endHour} onChange={(e) => { setTempTimeRange({ ...tempTimeRange, endHour: e.target.value }); handleTimeChange() }} className="w-12" />
                        <span>:</span>
                        <Input type="text" value={tempTimeRange.endMinute} onChange={(e) => { setTempTimeRange({ ...tempTimeRange, endMinute: e.target.value }); handleTimeChange() }} className="w-12" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <Input placeholder="Adicionar local" value={newEvent.location || ""} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                    <Textarea placeholder="Adicionar descrição" value={newEvent.description || ""} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="min-h-[100px]" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">Cor:</div>
                    <div className="flex gap-1 flex-wrap">
                      {eventColors.map((color) => (
                        <div
                          key={color}
                          className={cn(
                            "w-6 h-6 rounded-full cursor-pointer border-2",
                            color,
                            newEvent.color === color ? "border-black dark:border-white" : "border-transparent",
                          )}
                          onClick={() => setNewEvent({ ...newEvent, color })}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isViewingEvent && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveEvent} className="bg-blue-600 hover:bg-blue-700">
                  {isCreatingEvent ? "Criar" : "Salvar"}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  )
}
