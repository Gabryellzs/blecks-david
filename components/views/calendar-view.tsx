"use client"

import { useState, useEffect, useRef } from "react"
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
import { DndContext, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { calculateNewEventTime } from "@/lib/calendar-utils"
import { useToast } from "@/components/ui/use-toast"

// Tipos
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

// Cores
const eventColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-teal-500",
]

// Background
const backgroundImage = "/mountain-clouds-sunset.jpeg"

// Normaliza datas
const ensureDateObjects = (events: any[]): CalendarEvent[] =>
  events.map((event) => ({
    ...event,
    start: event.start instanceof Date ? event.start : new Date(event.start),
    end: event.end instanceof Date ? event.end : new Date(event.end),
  }))

export default function CalendarView() {
  // Persistência local
  const useCalendarEvents = () => {
    const [storedEvents, setStoredEvents] = useLocalStorage<any[]>("calendar-events", [])
    const events = ensureDateObjects(storedEvents)
    const setEvents = (newEvents: CalendarEvent[]) => setStoredEvents(newEvents)
    return [events, setEvents] as const
  }

  const [events, setEvents] = useCalendarEvents()

  // Estado
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week" | "month">("month") // abre no Mês
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
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
  const [isViewingEvent, setIsViewingEvent] = useState(false)
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

  const calendarRef = useRef<HTMLDivElement>(null)
  const hourHeight = 60

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // Navegação
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

  // CRUD evento
  const handleCreateEvent = () => {
    const defaultStart = new Date(currentDate)
    defaultStart.setHours(9, 0, 0)
    const defaultEnd = new Date(currentDate)
    defaultEnd.setHours(10, 0, 0)

    setNewEvent({
      title: "",
      description: "",
      location: "",
      color: eventColors[Math.floor(Math.random() * eventColors.length)],
      allDay: false,
      start: defaultStart,
      end: defaultEnd,
    })

    setTempTimeRange({ startHour: "09", startMinute: "00", endHour: "10", endMinute: "00" })
    setIsCreatingEvent(true)
    setIsViewingEvent(false)
    setIsEventDialogOpen(true)
  }

  const handleSaveEvent = () => {
    if (!newEvent.title) {
      toast({ title: "Erro ao criar evento", description: "O título do evento é obrigatório", variant: "destructive" })
      return
    }

    try {
      let startDate = newEvent.start instanceof Date ? newEvent.start : new Date()
      let endDate = newEvent.end instanceof Date ? newEvent.end : new Date()

      if (!newEvent.start || !newEvent.end) {
        const baseDate = selectedDate || currentDate
        startDate = new Date(baseDate)
        endDate = new Date(baseDate)

        startDate.setHours(Number.parseInt(tempTimeRange.startHour) || 0, Number.parseInt(tempTimeRange.startMinute) || 0)
        endDate.setHours(Number.parseInt(tempTimeRange.endHour) || 0, Number.parseInt(tempTimeRange.endMinute) || 0)

        if (endDate < startDate) {
          endDate.setDate(startDate.getDate())
          endDate.setHours(startDate.getHours() + 1)
        }
      }

      if (isCreatingEvent) {
        const event: CalendarEvent = {
          id: Date.now().toString(),
          title: newEvent.title || "Novo Evento",
          start: startDate,
          end: endDate,
          description: newEvent.description,
          location: newEvent.location,
          color: newEvent.color || eventColors[0],
          allDay: newEvent.allDay,
        }

        setEvents([...events, event])
        toast({ title: "Evento criado", description: "O evento foi criado com sucesso" })
      } else {
        const updatedEvents = events.map((event) =>
          event.id === selectedEvent?.id
            ? {
                ...event,
                title: newEvent.title || event.title,
                start: startDate,
                end: endDate,
                description: newEvent.description,
                location: newEvent.location,
                color: newEvent.color || event.color,
                allDay: newEvent.allDay,
              }
            : event,
        )
        setEvents(updatedEvents)
        toast({ title: "Evento atualizado", description: "O evento foi atualizado com sucesso" })
      }

      setIsEventDialogOpen(false)
      setNewEvent({ title: "", description: "", location: "", color: eventColors[0], allDay: false })
    } catch (error) {
      console.error("Erro ao salvar evento:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao salvar o evento. Tente novamente.", variant: "destructive" })
    }
  }

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id))
      setIsEventDialogOpen(false)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    const ev = {
      ...event,
      start: event.start instanceof Date ? event.start : new Date(event.start),
      end: event.end instanceof Date ? event.end : new Date(event.end),
    }

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

  const handleTimeChange = () => {
    const baseDate = selectedDate || currentDate
    const startDate = new Date(baseDate)
    const endDate = new Date(baseDate)

    startDate.setHours(Number.parseInt(tempTimeRange.startHour) || 0, Number.parseInt(tempTimeRange.startMinute) || 0)
    endDate.setHours(Number.parseInt(tempTimeRange.endHour) || 0, Number.parseInt(tempTimeRange.endMinute) || 0)

    if (endDate < startDate) {
      endDate.setDate(startDate.getDate())
      endDate.setHours(startDate.getHours() + 1)
    }

    setNewEvent({ ...newEvent, start: startDate, end: endDate })
  }

  // Categorias
  const toggleCalendarCategory = (id: string) =>
    setCalendarCategories(calendarCategories.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)))

  // Busca
  const filterEventsBySearch = (eventsToFilter: CalendarEvent[]) => {
    if (!searchQuery.trim()) return eventsToFilter
    const q = searchQuery.toLowerCase().trim()
    return eventsToFilter.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)),
    )
  }

  // DnD
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string
    const found = events.find((e) => e.id === id)
    if (found) {
      setDraggedEvent({
        ...found,
        start: found.start instanceof Date ? found.start : new Date(found.start),
        end: found.end instanceof Date ? found.end : new Date(found.end),
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!draggedEvent) return
    const { over } = event
    if (!over) {
      setDraggedEvent(null)
      return
    }

    const [type, dateStr, hourStr, minuteStr] = (over.id as string).split("-")
    if (type === "cell") {
      const date = new Date(dateStr)
      const hour = hourStr ? Number.parseInt(hourStr) : undefined
      const minute = minuteStr ? Number.parseInt(minuteStr) : undefined

      const { start: newStart, end: newEnd } = calculateNewEventTime(draggedEvent, { date, hour, minute })
      const updatedEvent = { ...draggedEvent, start: newStart, end: newEnd }

      const other = events.filter((e) => e.id !== draggedEvent.id)
      const conflicts = other.filter((e) => {
        const s = e.start instanceof Date ? e.start : new Date(e.start)
        const en = e.end instanceof Date ? e.end : new Date(e.end)
        return isSameDay(s, newStart) && s < newEnd && en > newStart
      })

      if (conflicts.length > 0) {
        setConflictingEvents(conflicts)
        setShowConflictAlert(true)
        toast({
          title: "Conflito de horário",
          description: `Este horário conflita com ${conflicts.length} evento(s) existente(s)`,
          variant: "destructive",
        })
      }

      setEvents(events.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)))
    }

    setDraggedEvent(null)
  }

  // Views
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = filterEventsBySearch(
      events.filter((e) => {
        const s = e.start instanceof Date ? e.start : new Date(e.start)
        return isSameDay(s, currentDate) && calendarCategories.some((c) => c.color === e.color && c.enabled)
      }),
    )

    return (
      <div className="flex flex-col h-full overflow-y-auto border-x"> {/* bordas externas */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b flex items-center p-2">
          <div className="text-xl font-semibold">{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour, idx) => {
            const hourEvents = dayEvents.filter((e) => {
              const s = e.start instanceof Date ? e.start : new Date(e.start)
              return s.getHours() === hour
            })

            return (
              <div
                key={hour}
                className={cn("flex min-h-[60px] relative border-b", idx === hours.length - 1 && "last:border-b-0")}
              >
                <div className="w-16 py-2 text-right pr-2 text-sm text-muted-foreground border-r">{hour}:00</div>
                <div
                  className="flex-1 p-1 relative overflow-hidden"
                  id={`cell-${currentDate.toISOString().split("T")[0]}-${hour}-0`}
                  onClick={() => {
                    const date = new Date(currentDate)
                    date.setHours(hour, 0, 0)
                    setNewEvent({
                      title: "",
                      description: "",
                      location: "",
                      color: eventColors[Math.floor(Math.random() * eventColors.length)],
                      allDay: false,
                      start: date,
                      end: new Date(date.getTime() + 60 * 60 * 1000),
                    })
                    setTempTimeRange({
                      startHour: hour.toString().padStart(2, "0"),
                      startMinute: "00",
                      endHour: (hour + 1).toString().padStart(2, "0"),
                      endMinute: "00",
                    })
                    setIsCreatingEvent(true)
                    setIsViewingEvent(false)
                    setIsEventDialogOpen(true)
                  }}
                >
                  {hourEvents.map((e) => {
                    const s = e.start instanceof Date ? e.start : new Date(e.start)
                    const en = e.end instanceof Date ? e.end : new Date(e.end)
                    const startMin = s.getMinutes()
                    const durMin = Math.min((en.getTime() - s.getTime()) / 60000, 60 - startMin)
                    const hPct = (durMin / 60) * 100

                    return (
                      <div
                        key={e.id}
                        id={e.id}
                        className={cn(
                          "absolute rounded p-1 text-white text-sm cursor-move hover:brightness-90 transition-all shadow-sm overflow-hidden",
                          e.color,
                          draggedEvent?.id === e.id && "opacity-50",
                        )}
                        style={{
                          top: `${(s.getMinutes() / 60) * 100}%`,
                          height: `${hPct}%`,
                          width: "calc(100% - 8px)",
                          maxHeight: "calc(100% - 4px)",
                          zIndex: 10,
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          handleEventClick(e)
                        }}
                      >
                        <div className="flex flex-col justify-center h-full">
                          <div className="font-medium truncate">{e.title}</div>
                          <div className="text-xs opacity-90 truncate">
                            {format(s, "HH:mm")} - {format(en, "HH:mm")}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
    const endDate = endOfWeek(currentDate, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* header com borda completa */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-x">
          <div className="grid grid-cols-8">
            <div className="p-2 border-r"></div>
            {days.map((day, i) => (
              <div
                key={day.toString()}
                className={cn(
                  "p-2 text-center border-r last:border-r-0",
                  isDateToday(day) && "bg-primary/10",
                )}
              >
                <div className="font-medium">{format(day, "EEE", { locale: ptBR })}</div>
                <div className={cn("text-2xl", isDateToday(day) && "text-primary font-bold")}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* corpo com borda completa */}
        <div className="flex-1 overflow-y-auto border-x">
          {hours.map((hour, rowIdx) => (
            <div
              key={hour}
              className={cn("grid grid-cols-8 min-h-[60px] border-b last:border-b-0")}
            >
              <div className="py-2 text-right pr-2 text-sm text-muted-foreground border-r">{hour}:00</div>

              {days.map((day, colIdx) => {
                const dayEvents = filterEventsBySearch(
                  events.filter((e) => {
                    const s = e.start instanceof Date ? e.start : new Date(e.start)
                    return (
                      isSameDay(s, day) &&
                      s.getHours() === hour &&
                      calendarCategories.some((c) => c.color === e.color && c.enabled)
                    )
                  }),
                )

                return (
                  <div
                    key={day.toString()}
                    className={cn("relative p-1 overflow-hidden border-r last:border-r-0")}
                    id={`cell-${day.toISOString().split("T")[0]}-${hour}-0`}
                    onClick={() => {
                      const date = new Date(day)
                      date.setHours(hour, 0, 0)
                      setNewEvent({
                        title: "",
                        description: "",
                        location: "",
                        color: eventColors[Math.floor(Math.random() * eventColors.length)],
                        allDay: false,
                        start: date,
                        end: new Date(date.getTime() + 60 * 60 * 1000),
                      })
                      setTempTimeRange({
                        startHour: hour.toString().padStart(2, "0"),
                        startMinute: "00",
                        endHour: (hour + 1).toString().padStart(2, "0"),
                        endMinute: "00",
                      })
                      setIsCreatingEvent(true)
                      setIsViewingEvent(false)
                      setIsEventDialogOpen(true)
                    }}
                  >
                    {dayEvents.map((e) => {
                      const s = e.start instanceof Date ? e.start : new Date(e.start)
                      const en = e.end instanceof Date ? e.end : new Date(e.end)
                      const startMin = s.getMinutes()
                      const durMin = Math.min((en.getTime() - s.getTime()) / 60000, 60 - startMin)
                      const hPct = (durMin / 60) * 100

                      return (
                        <div
                          key={e.id}
                          id={e.id}
                          className={cn(
                            "absolute rounded p-1 text-white text-xs cursor-move hover:brightness-90 transition-all shadow-sm overflow-hidden",
                            e.color,
                            draggedEvent?.id === e.id && "opacity-50",
                          )}
                          style={{
                            top: `${(s.getMinutes() / 60) * 100}%`,
                            height: `${hPct}%`,
                            width: "calc(100% - 8px)",
                            maxHeight: "calc(100% - 4px)",
                            zIndex: 10,
                          }}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            handleEventClick(e)
                          }}
                        >
                          <div className="flex flex-col justify-center h-full">
                            <div className="font-medium truncate">{e.title}</div>
                          </div>
                        </div>
                      )
                    })}
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
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 })
    const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // agrupar em semanas
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

    return (
      <div className="flex flex-col h-full">
        {/* header com borda completa */}
        <div className="grid grid-cols-7 border-b border-x bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
            <div key={d} className="p-2 text-center font-medium border-r last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* corpo com borda completa */}
        <div className="flex-1 grid grid-rows-6 border-x border-b">
          {weeks.map((week, wi) => (
            <div key={wi} className={cn("grid grid-cols-7 border-b last:border-b-0")}>
              {week.map((day, di) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const isToday = isDateToday(day)
                const dayEvents = filterEventsBySearch(
                  events.filter((e) => {
                    const s = e.start instanceof Date ? e.start : new Date(e.start)
                    return isSameDay(s, day) && calendarCategories.some((c) => c.color === e.color && c.enabled)
                  }),
                )

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "border-r last:border-r-0 p-1 min-h-[120px] relative overflow-hidden",
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
                      {dayEvents.slice(0, 3).map((e) => {
                        const s = e.start instanceof Date ? e.start : new Date(e.start)
                        return (
                          <div
                            key={e.id}
                            id={e.id}
                            className={cn(
                              "rounded px-1 py-0.5 text-white text-xs cursor-move hover:brightness-90 transition-all shadow-sm",
                              e.color,
                              draggedEvent?.id === e.id && "opacity-50",
                            )}
                            onClick={(ev) => {
                              ev.stopPropagation()
                              handleEventClick(e)
                            }}
                          >
                            <div className="flex items-center">
                              <span className="inline-block mr-1">{format(s, "HH:mm")}</span>
                              <span className="truncate">{e.title}</span>
                            </div>
                          </div>
                        )
                      })}
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
      </div>
    )
  }

  const renderMiniCalendar = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const daysInMonth = getDaysInMonth(currentDate)
    const startDay = getDay(firstDayOfMonth)
    const days = []

    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-6 w-6" />)

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      const isToday = isDateToday(date)
      const isSelected = selectedDate && isSameDay(date, selectedDate)
      const hasEvents = events.some((e) => {
        const s = e.start instanceof Date ? e.start : new Date(e.start)
        return isSameDay(s, date) && calendarCategories.some((c) => c.color === e.color && c.enabled)
      })

      days.push(
        <div
          key={`day-${i}`}
          className="flex items-center justify-center"
          onClick={() => {
            setSelectedDate(date)
            setCurrentDate(date)
          }}
        >
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
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    )
  }

  // Linha do horário atual
  const renderTimeIndicator = () => {
    if (view === "day" || view === "week") {
      const now = new Date()
      const show =
        (view === "day" && isSameDay(now, currentDate)) ||
        (view === "week" && true) // sempre mostra na semana

      if (show) {
        const hour = now.getHours()
        const minute = now.getMinutes()
        const top = (hour + minute / 60) * hourHeight

        return (
          <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none" style={{ top: `${top}px` }}>
            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
          </div>
        )
      }
    }
    return null
  }

  const backgroundStyles = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
      <div className="h-full flex flex-col w-full" style={backgroundStyles}>
        <div className="absolute inset-0 bg-black/30 z-0"></div>

        <div className="flex flex-col h-full w-full relative z-10">
          <div className="flex items-center justify-between p-2 sm:p-4 border-b bg-background/80 backdrop-blur-sm w-full">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Calendário</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {searchQuery && (
                  <div className="absolute -bottom-6 left-0 right-0 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs p-1 rounded">
                    Pesquisando: "{searchQuery}" ({filterEventsBySearch(events).length} resultados)
                  </div>
                )}
              </div>
            </div>
          </div>

          {showConflictAlert && (
            <Alert variant="destructive" className="mx-4 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conflito de Horário</AlertTitle>
              <AlertDescription>
                O evento movido conflita com {conflictingEvents.length} evento(s) existente(s).
                <Button variant="outline" size="sm" className="ml-2" onClick={() => setShowConflictAlert(false)}>
                  Fechar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-1 overflow-hidden w-full">
            {/* Sidebar (um pouco mais estreita) */}
            {isSidebarOpen && (
              <div className="w-full sm:w-56 border-r p-3 flex flex-col gap-4 overflow-y-auto bg-background/80 backdrop-blur-sm absolute sm:relative z-20 h-full">
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
                        <label
                          htmlFor={`calendar-${category.id}`}
                          className={cn("text-sm cursor-pointer", !category.enabled && "text-muted-foreground")}
                        >
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

            {/* Área principal */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
              <div className="flex flex-wrap items-center justify-between p-2 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <Button variant="outline" onClick={goToToday} className="bg-background">
                    Hoje
                  </Button>
                  <Button variant="ghost" size="icon" onClick={goToPrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={goToNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <h2 className="text-base sm:text-xl font-semibold ml-2">
                    {view === "day"
                      ? format(currentDate, "d 'de' MMM", { locale: ptBR })
                      : view === "week"
                        ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "d/MM", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "d/MM", { locale: ptBR })}`
                        : format(currentDate, "MMM yyyy", { locale: ptBR })}
                  </h2>
                </div>

                <div className="flex border rounded-md overflow-hidden bg-background w-full sm:w-auto">
                  <Button variant={view === "day" ? "default" : "ghost"} className="rounded-none flex-1 sm:flex-auto" onClick={() => setView("day")}>
                    Dia
                  </Button>
                  <Button variant={view === "week" ? "default" : "ghost"} className="rounded-none flex-1 sm:flex-auto" onClick={() => setView("week")}>
                    Semana
                  </Button>
                  <Button variant={view === "month" ? "default" : "ghost"} className="rounded-none flex-1 sm:flex-auto" onClick={() => setView("month")}>
                    Mês
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden w-full" ref={calendarRef}>
                <div className="h-full w-full border-0 rounded-none bg-background/80 backdrop-blur-sm relative">
                  <div className="p-0 h-full">
                    {view === "day" && renderDayView()}
                    {view === "week" && renderWeekView()}
                    {view === "month" && renderMonthView()}
                    {renderTimeIndicator()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog criar/editar */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>
                {isCreatingEvent ? "Criar Evento" : isViewingEvent ? "Detalhes do Evento" : "Editar Evento"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {isViewingEvent ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">{selectedEvent?.title}</h2>

                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div>
                        {selectedEvent?.start &&
                          format(
                            selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start),
                            "EEEE, d 'de' MMMM",
                            { locale: ptBR },
                          )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedEvent?.start &&
                          format(selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start), "HH:mm")}{" "}
                        -{" "}
                        {selectedEvent?.end &&
                          format(selectedEvent.end instanceof Date ? selectedEvent.end : new Date(selectedEvent.end), "HH:mm")}
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
                    <Button variant="outline" onClick={() => { setIsViewingEvent(false); setIsEventDialogOpen(false) }}>
                      Fechar
                    </Button>
                    <Button variant="outline" onClick={() => { setIsViewingEvent(false) }}>
                      Editar
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteEvent}>
                      Excluir
                    </Button>
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
                        <Input
                          type="text"
                          value={tempTimeRange.startHour}
                          onChange={(e) => { setTempTimeRange({ ...tempTimeRange, startHour: e.target.value }); handleTimeChange() }}
                          className="w-12"
                        />
                        <span>:</span>
                        <Input
                          type="text"
                          value={tempTimeRange.startMinute}
                          onChange={(e) => { setTempTimeRange({ ...tempTimeRange, startMinute: e.target.value }); handleTimeChange() }}
                          className="w-12"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="text"
                          value={tempTimeRange.endHour}
                          onChange={(e) => { setTempTimeRange({ ...tempTimeRange, endHour: e.target.value }); handleTimeChange() }}
                          className="w-12"
                        />
                        <span>:</span>
                        <Input
                          type="text"
                          value={tempTimeRange.endMinute}
                          onChange={(e) => { setTempTimeRange({ ...tempTimeRange, endMinute: e.target.value }); handleTimeChange() }}
                          className="w-12"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Adicionar local"
                      value={newEvent.location || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                    <Textarea
                      placeholder="Adicionar descrição"
                      value={newEvent.description || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="min-h-[100px]"
                    />
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
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                  Cancelar
                </Button>
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
