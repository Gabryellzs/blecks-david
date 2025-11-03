"use client"

import { useEffect, useRef, useState } from "react"
import {
  ChevronLeft, ChevronRight, Plus, Search, Menu,
  MapPin, Users, CalendarIcon, Clock, AlertCircle, X,
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
import {
  DndContext, type DragEndEvent, type DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core"
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

const backgroundImage = "/mountain-clouds-sunset.jpeg"
const HOUR_ROW_PX = 60

const ensureDateObjects = (evs: any[]): CalendarEvent[] =>
  evs.map((e) => ({ ...e, start: e.start instanceof Date ? e.start : new Date(e.start), end: e.end instanceof Date ? e.end : new Date(e.end) }))

// Linhas utilitárias
function HLine({ top, z = 60 }: { top: number; z?: number }) {
  return <div className="absolute left-0 right-0 pointer-events-none" style={{ top, zIndex: z }}>
    <div className="h-px w-full bg-white/20" />
  </div>
}
function VLine({ left, height, z = 60 }: { left: number; height: number; z?: number }) {
  return <div className="absolute top-0 pointer-events-none" style={{ left, height, zIndex: z }}>
    <div className="w-px h-full bg-white/12" />
  </div>
}
// Linha vermelha “agora”
function NowLine({ top, left, right = 0, z = 80 }: { top: number; left: number; right?: number; z?: number }) {
  return <div className="absolute pointer-events-none" style={{ top, left, right, zIndex: z }}>
    <div className="h-0.5 w-full bg-red-500" />
  </div>
}

export default function CalendarView() {
  // eventos
  const useCalendarEvents = () => {
    const [stored, setStored] = useLocalStorage<any[]>("calendar-events", [])
    const events = ensureDateObjects(stored)
    const setEvents = (e: CalendarEvent[]) => setStored(e)
    return [events, setEvents] as const
  }
  const [events, setEvents] = useCalendarEvents()

  // estado
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>("week")
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isViewingEvent, setIsViewingEvent] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({ title: "", description: "", location: "", color: "bg-blue-500", allDay: false })
  const [tempTimeRange, setTempTimeRange] = useState({ startHour: "09", startMinute: "00", endHour: "10", endMinute: "00" })
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarCategories, setCalendarCategories] = useLocalStorage<{ id: string; name: string; color: string; enabled: boolean }[]>("calendar-categories", [
    { id: "1", name: "Meu Calendário", color: "bg-blue-500", enabled: true },
    { id: "2", name: "Trabalho", color: "bg-green-500", enabled: true },
    { id: "3", name: "Pessoal", color: "bg-purple-500", enabled: true },
    { id: "4", name: "Família", color: "bg-orange-500", enabled: true },
  ])
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [showConflictAlert, setShowConflictAlert] = useState(false)
  const [conflictingEvents, setConflictingEvents] = useState<CalendarEvent[]>([])
  const { toast } = useToast()

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // cor default habilitada
  const getDefaultEventColor = () => calendarCategories.find((c) => c.enabled)?.color ?? calendarCategories[0]?.color ?? "bg-blue-500"

  // navegação
  const goToToday = () => setCurrentDate(new Date())
  const goToPrevious = () => setCurrentDate(view === "day" ? subDays(currentDate, 1) : view === "week" ? subDays(currentDate, 7) : subMonths(currentDate, 1))
  const goToNext = () => setCurrentDate(view === "day" ? addDays(currentDate, 1) : view === "week" ? addDays(currentDate, 7) : addMonths(currentDate, 1))

  // filtros
  const toggleCalendarCategory = (id: string) => setCalendarCategories(calendarCategories.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)))
  const filterEventsBySearch = (source: CalendarEvent[]) => {
    const enabled = new Set(calendarCategories.filter((c) => c.enabled).map((c) => c.color))
    const byCat = source.filter((e) => enabled.has(e.color))
    if (!searchQuery.trim()) return byCat
    const q = searchQuery.toLowerCase().trim()
    return byCat.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q)),
    )
  }

  // criar / data
  const handleCreateEvent = () => {
    const s = new Date(currentDate); s.setHours(9, 0, 0)
    const e = new Date(currentDate); e.setHours(10, 0, 0)
    setNewEvent({ title: "", description: "", location: "", color: getDefaultEventColor(), allDay: false, start: s, end: e })
    setTempTimeRange({ startHour: "09", startMinute: "00", endHour: "10", endMinute: "00" })
    setIsCreatingEvent(true); setIsViewingEvent(false); setIsEventDialogOpen(true)
  }
  const handleDateClick = (date: Date) => {
    setSelectedDate(date); setCurrentDate(date)
    const s = new Date(date); s.setHours(9, 0, 0)
    const e = new Date(date); e.setHours(10, 0, 0)
    setNewEvent({ title: "", description: "", location: "", color: getDefaultEventColor(), allDay: false, start: s, end: e })
    setTempTimeRange({ startHour: "09", startMinute: "00", endHour: "10", endMinute: "00" })
    setIsCreatingEvent(true); setIsViewingEvent(false); setIsEventDialogOpen(true)
  }
  const handleTimeChange = () => {
    const base = selectedDate || currentDate
    const s = new Date(base); const e = new Date(base)
    s.setHours(Number(tempTimeRange.startHour) || 0, Number(tempTimeRange.startMinute) || 0)
    e.setHours(Number(tempTimeRange.endHour) || 0, Number(tempTimeRange.endMinute) || 0)
    if (e < s) { e.setDate(s.getDate()); e.setHours(s.getHours() + 1) }
    setNewEvent({ ...newEvent, start: s, end: e })
  }

  // salvar
  const handleSaveEvent = () => {
    if (!newEvent.title) { toast({ title: "Erro ao criar evento", description: "O título do evento é obrigatório", variant: "destructive" }); return }
    let s = newEvent.start instanceof Date ? newEvent.start : new Date()
    let e = newEvent.end instanceof Date ? newEvent.end : new Date()
    if (!newEvent.start || !newEvent.end) {
      const base = selectedDate || currentDate
      s = new Date(base); e = new Date(base)
      s.setHours(Number(tempTimeRange.startHour) || 0, Number(tempTimeRange.startMinute) || 0)
      e.setHours(Number(tempTimeRange.endHour) || 0, Number(tempTimeRange.endMinute) || 0)
      if (e < s) { e.setDate(s.getDate()); e.setHours(s.getHours() + 1) }
    }
    const valid = new Set(calendarCategories.map((c) => c.color))
    const safeColor = (newEvent.color && valid.has(newEvent.color) && newEvent.color) || getDefaultEventColor()

    if (isCreatingEvent) {
      const ev: CalendarEvent = { id: Date.now().toString(), title: newEvent.title || "Novo Evento", start: s, end: e, description: newEvent.description, location: newEvent.location, color: safeColor, allDay: newEvent.allDay }
      setEvents([...events, ev]); toast({ title: "Evento criado", description: "O evento foi criado com sucesso" })
    } else if (selectedEvent) {
      setEvents(events.map((ev) => ev.id === selectedEvent.id ? { ...ev, title: newEvent.title || ev.title, start: s, end: e, description: newEvent.description, location: newEvent.location, color: safeColor, allDay: newEvent.allDay } : ev))
      toast({ title: "Evento atualizado", description: "O evento foi atualizado com sucesso" })
    }
    setIsEventDialogOpen(false)
    setNewEvent({ title: "", description: "", location: "", color: getDefaultEventColor(), allDay: false })
  }

  const handleDeleteEvent = () => { if (!selectedEvent) return; setEvents(events.filter((e) => e.id !== selectedEvent.id)); setIsEventDialogOpen(false) }
  const handleEventClick = (event: CalendarEvent) => {
    const ev = { ...event, start: new Date(event.start), end: new Date(event.end) }
    setSelectedEvent(ev)
    setNewEvent({ title: ev.title, description: ev.description, location: ev.location, color: ev.color, allDay: ev.allDay, start: ev.start, end: ev.end })
    setTempTimeRange({
      startHour: ev.start.getHours().toString().padStart(2, "0"),
      startMinute: ev.start.getMinutes().toString().padStart(2, "0"),
      endHour: ev.end.getHours().toString().padStart(2, "0"),
      endMinute: ev.end.getMinutes().toString().padStart(2, "0"),
    })
    setIsCreatingEvent(false); setIsViewingEvent(true); setIsEventDialogOpen(true)
  }

  // DnD
  const handleDragStart = (e: DragStartEvent) => {
    const id = e.active.id as string
    const f = events.find((ev) => ev.id === id)
    if (f) setDraggedEvent({ ...f, start: new Date(f.start), end: new Date(f.end) })
  }
  const handleDragEnd = (e: DragEndEvent) => {
    if (!draggedEvent) return
    const { over } = e
    if (!over) { setDraggedEvent(null); return }
    const [type, dateStr, hourStr, minuteStr] = (over.id as string).split("-")
    if (type === "cell") {
      const date = new Date(dateStr)
      const hour = hourStr ? Number.parseInt(hourStr) : undefined
      const minute = minuteStr ? Number.parseInt(minuteStr) : undefined
      const { start: ns, end: ne } = calculateNewEventTime(draggedEvent, { date, hour, minute })
      const upd = { ...draggedEvent, start: ns, end: ne }
      const conflicts = events.filter((ev) => ev.id !== draggedEvent.id).filter((ev) => {
        const s = new Date(ev.start); const en = new Date(ev.end)
        return isSameDay(s, ns) && s < ne && en > ns
      })
      if (conflicts.length > 0) {
        setConflictingEvents(conflicts); setShowConflictAlert(true)
      }
      setEvents(events.map((ev) => (ev.id === draggedEvent.id ? upd : ev)))
    }
    setDraggedEvent(null)
  }

  /* ----------------------- DIA ----------------------- */
  const dayScrollRef = useRef<HTMLDivElement>(null)
  const dayGutterRef = useRef<HTMLDivElement>(null)
  const [dayGutterPx, setDayGutterPx] = useState(0)

  useEffect(() => {
    const el = dayScrollRef.current
    const gut = dayGutterRef.current
    if (!el || !gut) return
    const ro = new ResizeObserver(() => setDayGutterPx(gut.offsetWidth))
    ro.observe(gut)
    return () => ro.disconnect()
  }, [])

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = filterEventsBySearch(events.filter((e) => isSameDay(e.start instanceof Date ? e.start : new Date(e.start), currentDate)))
    const now = new Date()
    const showNow = isSameDay(now, currentDate)
    const topNowPx = (now.getHours() + now.getMinutes() / 60) * HOUR_ROW_PX

    return (
      <div className="relative flex flex-col h-full overflow-hidden border-x border-white/15">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-white/15 flex items-center p-2">
          <div className="text-xl font-semibold">{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
        </div>

        <div ref={dayScrollRef} className="relative flex-1 overflow-auto min-h-0">
          {hours.map((_, i) => <HLine key={i} top={i * HOUR_ROW_PX} />)}
          {showNow && <NowLine top={topNowPx} left={dayGutterPx} />}

          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((e) => (e.start instanceof Date ? e.start : new Date(e.start)).getHours() === hour)
            return (
              <div key={hour} className="relative flex min-h-[60px]">
                <div ref={hour === 0 ? dayGutterRef : undefined} className="w-16 py-2 text-right pr-2 text-sm text-muted-foreground border-r border-white/15 z-[80]">
                  {hour}:00
                </div>
                <div className="flex-1 p-1 relative overflow-visible z-[50]">
                  {hourEvents.map((ev) => {
                    const s = ev.start instanceof Date ? ev.start : new Date(ev.start)
                    const en = ev.end instanceof Date ? ev.end : new Date(ev.end)
                    const startMin = s.getMinutes()
                    const durMin = Math.min((en.getTime() - s.getTime()) / 60000, 60 - startMin)
                    const hPct = (durMin / 60) * 100
                    return (
                      <div
                        key={ev.id}
                        id={ev.id}
                        className={cn("absolute rounded p-1 text-white text-sm cursor-move hover:brightness-90 transition-all shadow-sm overflow-hidden", ev.color, draggedEvent?.id === ev.id && "opacity-50")}
                        style={{ top: `${(s.getMinutes() / 60) * 100}%`, height: `${hPct}%`, width: "calc(100% - 8px)" }}
                        onClick={(e) => { e.stopPropagation(); handleEventClick(ev) }}
                      >
                        <div className="font-medium truncate">{ev.title}</div>
                        <div className="text-xs opacity-90 truncate">{format(s, "HH:mm")} - {format(en, "HH:mm")}</div>
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

  /* --------------------- SEMANA ---------------------- */
  const weekScrollRef = useRef<HTMLDivElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const [gutterPx, setGutterPx] = useState(0)
  const [weekHeight, setWeekHeight] = useState(0)
  const [weekWidth, setWeekWidth] = useState(0)

  useEffect(() => {
    const el = weekScrollRef.current
    const gutter = gutterRef.current
    if (!el || !gutter) return
    const ro = new ResizeObserver(() => {
      setGutterPx(gutter.offsetWidth)
      setWeekHeight(el.scrollHeight)
      setWeekWidth(el.clientWidth)
    })
    ro.observe(el); ro.observe(gutter)
    return () => ro.disconnect()
  }, [])

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
    const endDate = endOfWeek(currentDate, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const hours = Array.from({ length: 24 }, (_, i) => i)

    const now = new Date()
    const isThisWeek = now >= startDate && now <= endDate
    const nowTopPx = (now.getHours() + now.getMinutes() / 60) * HOUR_ROW_PX
    const colWidth = Math.max((weekWidth - gutterPx) / 7, 0)

    return (
      <div className="flex flex-col h-full overflow-hidden border-x border-white/10">
        <div className="grid grid-cols-8 border-b border-white/10 relative z-[80] bg-background/80 backdrop-blur-sm">
          <div className="p-2 border-r border-white/10" />
          {days.map((day) => (
            <div key={day.toString()} className={cn("p-2 text-center border-r border-white/10 last:border-r-0", isDateToday(day) && "bg-primary/10")}>
              <div className="font-medium">{format(day, "EEE", { locale: ptBR })}</div>
              <div className={cn("text-2xl", isDateToday(day) && "text-primary font-bold")}>{format(day, "d")}</div>
            </div>
          ))}
        </div>

        <div ref={weekScrollRef} className="relative flex-1 overflow-y-auto min-h-0">
          {hours.map((_, i) => <HLine key={`h-${i}`} top={i * HOUR_ROW_PX} />)}
          {Array.from({ length: 8 }, (_, i) => <VLine key={`v-${i}`} left={gutterPx + i * colWidth} height={weekHeight} />)}
          {isThisWeek && <NowLine top={nowTopPx} left={gutterPx} right={0} />}

          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 min-h-[60px]">
              <div ref={hour === 0 ? gutterRef : undefined} className="py-2 text-right pr-2 text-sm text-muted-foreground border-r border-white/10 z-[80]">
                {hour}:00
              </div>
              {days.map((day) => {
                const dayEvents = filterEventsBySearch(events.filter((e) => {
                  const s = e.start instanceof Date ? e.start : new Date(e.start)
                  return isSameDay(s, day) && s.getHours() === hour
                }))
                return (
                  <div key={day.toString()} className="relative p-1 overflow-visible border-r border-white/10 last:border-r-0" id={`cell-${day.toISOString().split("T")[0]}-${hour}-0`}>
                    {dayEvents.map((ev) => {
                      const s = ev.start instanceof Date ? ev.start : new Date(ev.start)
                      const en = ev.end instanceof Date ? ev.end : new Date(ev.end)
                      const startMin = s.getMinutes()
                      const durMin = Math.min((en.getTime() - s.getTime()) / 60000, 60 - startMin)
                      const hPct = (durMin / 60) * 100
                      return (
                        <div
                          key={ev.id}
                          id={ev.id}
                          className={cn("absolute rounded p-1 text-white text-xs cursor-move hover:brightness-90 transition-all shadow-sm overflow-hidden z-[50]", ev.color, draggedEvent?.id === ev.id && "opacity-50")}
                          style={{ top: `${(s.getMinutes() / 60) * 100}%`, height: `${hPct}%`, width: "calc(100% - 8px)" }}
                          onClick={(e) => { e.stopPropagation(); handleEventClick(ev) }}
                        >
                          <div className="font-medium truncate">{ev.title}</div>
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

  /* ---------------------- MÊS ----------------------- */
  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = startOfWeek(firstDay, { weekStartsOn: 0 })
    const endDate = endOfWeek(lastDay, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

    return (
      <div className="flex flex-col h-full border-x border-white/15 border-b">
        <div className="grid grid-cols-7 border-b border-white/15 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="p-2 text-center font-medium border-r border-white/15 last:border-r-0">{d}</div>
          ))}
        </div>

        <div className="relative flex-1 overflow-hidden min-h-0">
          {/* grade 6x7 */}
          <div
            className="absolute inset-0 z-[60] pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent calc(100% / 6))," +
                "repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent calc(100% / 7))",
            }}
          />
          <div className="grid h-full" style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
            {weeks.flatMap((week, wi) =>
              week.map((day, di) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const isToday = isDateToday(day)
                const dayEvents = filterEventsBySearch(events.filter((e) => isSameDay(e.start instanceof Date ? e.start : new Date(e.start), day)))

                return (
                  <div
                    key={`${wi}-${di}`}
                    className={cn("p-1 h-full min-h-0 flex flex-col relative z-[50]", !isCurrentMonth && "bg-muted/20 text-muted-foreground", isToday && "bg-primary/10")}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className={cn("text-right font-medium", isToday && "text-primary font-bold")}>{format(day, "d")}</div>
                    <div className="mt-1 space-y-1 overflow-auto min-h-0">
                      {dayEvents.slice(0, 6).map((ev) => {
                        const s = ev.start instanceof Date ? ev.start : new Date(ev.start)
                        return (
                          <div
                            key={ev.id}
                            className={cn("rounded px-1 py-0.5 text-white text-xs cursor-pointer hover:brightness-90 transition-all shadow-sm", ev.color)}
                            onClick={(e) => { e.stopPropagation(); handleEventClick(ev) }}
                          >
                            <div className="flex items-center gap-1">
                              <span>{format(s, "HH:mm")}</span>
                              <span className="truncate">{ev.title}</span>
                            </div>
                          </div>
                        )
                      })}
                      {dayEvents.length > 6 && (
                        <div className="text-[11px] text-muted-foreground text-center cursor-pointer hover:bg-muted/30 rounded py-0.5"
                          onClick={(e) => { e.stopPropagation(); setSelectedDate(day); setCurrentDate(day); setView("day") }}>
                          +{dayEvents.length - 6} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              }),
            )}
          </div>
        </div>
      </div>
    )
  }

  // mini calendário
  const renderMiniCalendar = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const daysInMonth = getDaysInMonth(currentDate)
    const startDay = getDay(firstDayOfMonth)
    const cells: JSX.Element[] = []
    for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} className="h-6 w-6" />)
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      const isToday = isDateToday(date)
      const isSelected = selectedDate && isSameDay(date, selectedDate)
      const hasEvents = events.some((e) => isSameDay(e.start instanceof Date ? e.start : new Date(e.start), date))
      cells.push(
        <div key={`d-${i}`} className="flex items-center justify-center" onClick={() => { setSelectedDate(date); setCurrentDate(date) }}>
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-sm cursor-pointer",
            isToday && "bg-primary text-primary-foreground",
            isSelected && !isToday && "bg-primary/20",
            hasEvents && !isToday && !isSelected && "underline")}>
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
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>
    )
  }

  // fundo
  const backgroundStyles = { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" as const }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
      <div className="h-full flex flex-col w-full" style={backgroundStyles}>
        <div className="absolute inset-0 bg-black/30 z-0" />

        <div className="flex flex-col h-full w-full relative z-10">
          {/* Topbar */}
          <div className="flex items-center justify-between p-2 sm:p-4 border-b border-white/10 bg-background/80 backdrop-blur-sm w-full">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu className="h-5 w-5" /></Button>
              <h1 className="text-xl sm:text-2xl font-bold">Calendário</h1>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar eventos" className={cn("pl-8", searchQuery && "border-blue-500 ring-1 ring-blue-500")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => setSearchQuery("")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {showConflictAlert && (
            <Alert variant="destructive" className="mx-4 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conflito de Horário</AlertTitle>
              <AlertDescription>
                O evento movido conflita com {conflictingEvents.length} evento(s).
                <Button variant="outline" size="sm" className="ml-2" onClick={() => setShowConflictAlert(false)}>Fechar</Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-1 overflow-hidden w-full">
            {/* Sidebar */}
            {isSidebarOpen && (
              <div className="w-full sm:w-56 border-r border-white/10 p-3 flex flex-col gap-4 overflow-y-auto bg-background/80 backdrop-blur-sm absolute sm:relative z-20 h-full">
                <Button className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateEvent}>
                  <Plus className="h-4 w-4" /><span>Criar</span>
                </Button>
                {renderMiniCalendar()}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Meus calendários</h3>
                  <div className="space-y-1">
                    {calendarCategories.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <Checkbox id={`calendar-${c.id}`} checked={c.enabled} onCheckedChange={() => toggleCalendarCategory(c.id)} className={cn("rounded-full border-0", c.color, !c.enabled && "opacity-50")} />
                        <label htmlFor={`calendar-${c.id}`} className={cn("text-sm cursor-pointer", !c.enabled && "text-muted-foreground")}>{c.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" className="mt-auto sm:hidden" onClick={() => setIsSidebarOpen(false)}>Fechar</Button>
              </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden w-full min-h-0">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-between p-2 border-b border-white/10 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 md:gap-3">
                  <Button variant="outline" onClick={goToToday} className="bg-background">Hoje</Button>
                  <Button variant="ghost" size="icon" onClick={goToPrevious}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={goToNext}><ChevronRight className="h-4 w-4" /></Button>
                  <h2 className="text-base sm:text-xl font-semibold ml-1 sm:ml-2 whitespace-nowrap">
                    {view === "day"
                      ? format(currentDate, "d 'de' MMM", { locale: ptBR })
                      : view === "week"
                        ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "d/MM", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "d/MM", { locale: ptBR })}`
                        : format(currentDate, "MMM yyyy", { locale: ptBR })}
                  </h2>
                </div>
                <div className="flex border rounded-md overflow-hidden bg-background whitespace-nowrap shrink-0 shadow-sm">
                  <Button variant={view === "day" ? "default" : "ghost"} className="rounded-none px-4 py-2 text-sm sm:text-base" onClick={() => setView("day")}>Dia</Button>
                  <Button variant={view === "week" ? "default" : "ghost"} className="rounded-none px-4 py-2 text-sm sm:text-base" onClick={() => setView("week")}>Semana</Button>
                  <Button variant={view === "month" ? "default" : "ghost"} className="rounded-none px-4 py-2 text-sm sm:text-base" onClick={() => setView("month")}>Mês</Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden w-full bg-background/80 backdrop-blur-sm relative min-h-0">
                {view === "day" && renderDayView()}
                {view === "week" && renderWeekView()}
                {view === "month" && renderMonthView()}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
            <DialogHeader><DialogTitle>{isCreatingEvent ? "Criar Evento" : isViewingEvent ? "Detalhes do Evento" : "Editar Evento"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              {isViewingEvent ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">{selectedEvent?.title}</h2>
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{selectedEvent?.start && format(selectedEvent.start, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedEvent?.start && format(selectedEvent.start, "HH:mm")} - {selectedEvent?.end && format(selectedEvent.end, "HH:mm")}
                      </div>
                    </div>
                  </div>
                  {selectedEvent?.location && (<div className="flex items-start gap-2"><MapPin className="h-5 w-5 text-muted-foreground mt-0.5" /><div>{selectedEvent.location}</div></div>)}
                  {selectedEvent?.description && (<div className="flex items-start gap-2"><div className="whitespace-pre-wrap">{selectedEvent.description}</div></div>)}
                  <div className="flex flex-wrap justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsViewingEvent(false); setIsEventDialogOpen(false) }}>Fechar</Button>
                    <Button variant="outline" onClick={() => setIsViewingEvent(false)}>Editar</Button>
                    <Button variant="destructive" onClick={handleDeleteEvent}>Excluir</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Input placeholder="Adicionar título" value={newEvent.title || ""} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="text-lg font-medium border-0 border-b rounded-none focus-visible:ring-0 px-0 h-auto py-1" />
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
                      {calendarCategories.map((cat) => (
                        <div key={cat.id} className={cn("w-6 h-6 rounded-full cursor-pointer border-2", cat.color, newEvent.color === cat.color ? "border-black dark:border-white" : "border-transparent")} onClick={() => setNewEvent({ ...newEvent, color: cat.color })} title={cat.name} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {!isViewingEvent && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveEvent} className="bg-blue-600 hover:bg-blue-700">{isCreatingEvent ? "Criar" : "Salvar"}</Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  )
}
