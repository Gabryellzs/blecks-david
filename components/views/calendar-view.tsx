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

// ===================== Tipos =====================
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

// ===================== Constantes =====================
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

// Garante que start/end sejam Date
const ensureDateObjects = (events: any[]): CalendarEvent[] => {
  return events.map((event) => ({
    ...event,
    start: event.start instanceof Date ? event.start : new Date(event.start),
    end: event.end instanceof Date ? event.end : new Date(event.end),
  }))
}

export default function CalendarView() {
  // Hook para persistência no localStorage
  const useCalendarEvents = () => {
    const [storedEvents, setStoredEvents] = useLocalStorage<any[]>("calendar-events", [])
    const events = ensureDateObjects(storedEvents)
    const setEvents = (newEvents: CalendarEvent[]) => setStoredEvents(newEvents)
    return [events, setEvents] as const
  }

  const [events, setEvents] = useCalendarEvents()

  // ===== Estados =====
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week" | "month">("week")
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
  const hourHeight = 60 // px

  // DnD sensores
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  useEffect(() => {
    // Inicialização
    // setEvents([]) // opcional para limpar
  }, [])

  // ======= Navegação =======
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

  // ======= CRUD Evento =======
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
      const updatedEvents = events.filter((event) => event.id !== selectedEvent.id)
      setEvents(updatedEvents)
      setIsEventDialogOpen(false)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    const eventWithDateObjects = {
      ...event,
      start: event.start instanceof Date ? event.start : new Date(event.start),
      end: event.end instanceof Date ? event.end : new Date(event.end),
    }

    setSelectedEvent(eventWithDateObjects)
    setNewEvent({
      title: eventWithDateObjects.title,
      description: eventWithDateObjects.description,
      location: eventWithDateObjects.location,
      color: eventWithDateObjects.color,
      allDay: eventWithDateObjects.allDay,
      start: eventWithDateObjects.start,
      end: eventWithDateObjects.end,
    })

    setTempTimeRange({
      startHour: eventWithDateObjects.start.getHours().toString().padStart(2, "0"),
      startMinute: eventWithDateObjects.start.getMinutes().toString().padStart(2, "0"),
      endHour: eventWithDateObjects.end.getHours().toString().padStart(2, "0"),
      endMinute: eventWithDateObjects.end.getMinutes().toString().padStart(2, "0"),
    })

    setIsCreatingEvent(false)
    setIsViewingEvent(true)
    setIsEventDialogOpen(true)
  }

  const handleTimeChange = () => {
    try {
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
    } catch (error) {
      console.error("Erro ao processar horários:", error)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setCurrentDate(date)

    const defaultStart = new Date(date)
    defaultStart.setHours(9, 0, 0)
    const defaultEnd = new Date(date)
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

  // ======= Categorias =======
  const toggleCalendarCategory = (id: string) => {
    setCalendarCategories(calendarCategories.map((cat) => (cat.id === id ? { ...cat, enabled: !cat.enabled } : cat)))
  }

  // ======= Busca =======
  const filterEventsBySearch = (eventsToFilter: CalendarEvent[]) => {
    if (!searchQuery || searchQuery.trim() === "") return eventsToFilter
    const query = searchQuery.toLowerCase().trim()
    return eventsToFilter.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query)),
    )
  }

  // ======= DnD =======
  const handleDragStart = (event: DragStartEvent) => {
    const eventId = event.active.id as string
    const dragged = events.find((e) => e.id === eventId)
    if (dragged) {
      setDraggedEvent({
        ...dragged,
        start: dragged.start instanceof Date ? dragged.start : new Date(dragged.start),
        end: dragged.end instanceof Date ? dragged.end : new Date(dragged.end),
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

      // Conflitos
      const otherEvents = events.filter((e) => e.id !== draggedEvent.id)
      const conflicts = otherEvents.filter((e) => {
        const eStart = e.start instanceof Date ? e.start : new Date(e.start)
        const eEnd = e.end instanceof Date ? e.end : new Date(e.end)
        return isSameDay(eStart, newStart) && eStart < newEnd && eEnd > newStart
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

      const updatedEvents = events.map((e) => (e.id === draggedEvent.id ? updatedEvent : e))
      setEvents(updatedEvents)
    }

    setDraggedEvent(null)
  }

  useEffect(() => {
    // Re-render ao mudar a busca
  }, [searchQuery])

  useEffect(() => {
    console.log("Eventos atualizados:", events)
  }, [events])

  // ======= Views =======
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = filterEventsBySearch(
      events.filter((event) => {
        const eventStart = event.start instanceof Date ? event.start : new Date(event.start)
        return (
          isSameDay(eventStart, currentDate) &&
          calendarCategories.some((cat) => cat.color === event.color && cat.enabled)
        )
      }),
    )

    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b flex items-center p-2">
          <div className="text-xl font-semibold">{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((event) => {
              const eventStart = event.start instanceof Date ? event.start : new Date(event.start)
              return eventStart.getHours() === hour
            })

            return (
              <div key={hour} className="flex border-b min-h-[60px] relative">
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
                  {hourEvents.map((event) => {
                    const eventStart = event.start instanceof Date ? event.start : new Date(event.start)
                    const eventEnd = event.end instanceof Date ? event.end : new Date(event.end)
                    const startMinutesInHour = eventStart.getMinutes()
                    const durationMinutes = Math.min(
                      (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60),
                      60 - startMinutesInHour,
                    )
                    const heightPercentage = (durationMinutes / 60) * 100

                    return (
                      <div
                        key={event.id}
                        id={event.id}
                        className={`absolute rounded p-1 text-white text-sm cursor-move ${event.color} hover:brightness-90 transition-all shadow-sm overflow-hidden ${draggedEvent?.id === event.id ? "opacity-50" : ""}`}
                        style={{
                          top: `${(eventStart.getMinutes() / 60) * 100}%`,
                          height: `${heightPercentage}%`,
                          width: "calc(100% - 8px)",
                          maxHeight: "calc(100% - 4px)",
                          zIndex: 10,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="flex flex-col justify-center h-full">
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-90 truncate">
                            {format(eventStart, "HH:mm")} - {format(eventEnd, "HH:mm")}
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
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 border-r"></div>
            {days.map((day) => (
              <div key={day.toString()} className={cn("p-2 text-center border-r", isDateToday(day) && "bg-primary/10")}>
                <div className="font-medium">{format(day, "EEE", { locale: ptBR })}</div>
                <div className={cn("text-2xl", isDateToday(day) && "text-primary font-bold")}>{format(day, "d")}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
              <div className="py-2 text-right pr-2 text-sm text-muted-foreground border-r">{hour}:00</div>
              {days.map((day) => {
                const dayEvents = filterEventsBySearch(
                  events.filter((event) => {
                    const eventStart = event.start instanceof Date ? event.start : new Date(event.start)
                    return (
                      isSameDay(eventStart, day) &&
                      eventStart.getHours() === hour &&
                      calendarCategories.some((cat) => cat.color === event.color && cat.enabled)
                    )
                  }),
                )

                return (
                  <div
                    key={day.toString()}
                    className="relative p-1 border-r overflow-hidden"
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
                    {dayEvents.map((event) => {
                      const eventStart = event.start instanceof Date ? event.start : new Date(event.start)
                      const eventEnd = event.end instanceof Date ? event.end : new Date(event.end)
                      const startMinutesInHour = eventStart.getMinutes()
                      const durationMinutes = Math.min(
                        (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60),
                        60 - startMinutesInHour,
                      )
                      const heightPercentage = (durationMinutes / 60) * 100

                      return (
                        <div
                          key={event.id}
                          id={event.id}
                          className={`absolute rounded p-1 text-white text-xs cursor-move ${event.color} hover:brightness-90 transition-all shadow-sm overflow-hidden ${draggedEvent?.id === event.id ? "opacity-50" : ""}`}
                          style={{
                            top: `${(eventStart.getMinutes() / 60) * 100}%`,
                            height: `${heightPercentage}%`,
                            width: "calc(100% - 8px)",
                            maxHeight: "calc(100% - 4px)",
                            zIndex: 10,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                        >
                          <div className="flex flex-col justify-center h-full">
                            <div className="font-medium truncate">{event.title}</div>
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

    const weeks: Date[][] = []
    let currentWeek: Date[] = []

    days.forEach((day) => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })

    return (
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="p-2 text-center font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-rows-6">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b h-full">
              {week.map((day) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const isToday = isDateToday(day)
                const dayEvents = filterEventsBySearch(
                  events.filter((event) => {
                    const eventStart = event.start instanceof Date ? event.start : new Date(event.start)
                    return (
                      isSameDay(eventStart, day) &&
                      calendarCategories.some((cat) => cat.color === event.color && cat.enabled)
                    )
                  }),
                )

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "border-r p-1 min-h-[100px] relative overflow-hidden",
                      !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                      isToday && "bg-primary/10",
                    )}
                    id={`cell-${day.toISOString().split("T")[0]}`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className={cn("text-right font-medium mb-1", isToday && "text-primary font-bold")}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {dayEvents.slice(0, 3).map((event) => {
                        const eventStart = event.start instanceof Date ? event.start : new Date(event.start)

                        return (
                          <div
                            key={event.id}
                            id={event.id}
                            className={`rounded px-1 py-0.5 text-white text-xs cursor-move ${event.color} hover:brightness-90 transition-all shadow-sm ${draggedEvent?.id === event.id ? "opacity-50" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                          >
                            <div className="flex items-center">
                              <span className="inline-block mr-1">{format(eventStart, "HH:mm")}</span>
                              <span className="truncate">{event.title}</span>
                            </div>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div
                          className="text-xs text-muted-foreground text-center cursor-pointer hover:bg-muted/30 rounded py-0.5"
                          onClick={(e) => {
                            e.stopPropagation()
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
      const hasEvents = events.some((event) => {
        const eventStart = event.start instanceof Date ? event.start : new Date(event.start)
        return isSameDay(eventStart, date) && calendarCategories.some((cat) => cat.color === event.color && cat.enabled)
      })

      days.push(
        <div key={`day-${i}`} className="flex items-center justify-center" onClick={() => { setSelectedDate(date); setCurrentDate(date) }}>
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
          {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
            <div key={i}>{day}</div>
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
        (view === "week" && isSameDay(now, now)) // mostra na semana, baseado no dia atual

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

  useEffect(() => {
    // re-render quando searchQuery muda
  }, [searchQuery])

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
      <div className="h-full flex flex-col w-full" style={backgroundStyles}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 z-0"></div>

        {/* Conteúdo */}
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
            {/* Sidebar */}
            {isSidebarOpen && (
              <div className="w-full sm:w-64 border-r p-4 flex flex-col gap-4 overflow-y-auto bg-background/80 backdrop-blur-sm absolute sm:relative z-20 h-full">
                <Button className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateEvent}>
                  <Plus className="h-4 w-4" />
                  <span>Criar</span>
                </Button>

                {renderMiniCalendar()}

                {/* (REMOVIDO: seção de Notificações + Testar Notificação) */}

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
                          format(
                            selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start),
                            "HH:mm",
                          )}{" "}
                        -{" "}
                        {selectedEvent?.end &&
                          format(
                            selectedEvent.end instanceof Date ? selectedEvent.end : new Date(selectedEvent.end),
                            "HH:mm",
                          )}
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
