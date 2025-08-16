import { addMinutes, differenceInMinutes, setHours, setMinutes } from "date-fns"

// Função para calcular a nova data/hora quando um evento é arrastado
export function calculateNewEventTime(
  event: {
    start: Date
    end: Date
  },
  destination: {
    date: Date
    hour?: number
    minute?: number
  },
) {
  // Calcular a duração do evento em minutos
  const durationMinutes = differenceInMinutes(event.end, event.start)

  // Criar nova data de início
  let newStart = new Date(destination.date)

  // Se temos hora e minuto específicos (visualização de dia/semana)
  if (typeof destination.hour === "number" && typeof destination.minute === "number") {
    newStart = setHours(newStart, destination.hour)
    newStart = setMinutes(newStart, destination.minute)
  } else {
    // Manter a mesma hora do evento original, apenas mudar a data
    newStart = setHours(newStart, event.start.getHours())
    newStart = setMinutes(newStart, event.start.getMinutes())
  }

  // Calcular nova data de término mantendo a mesma duração
  const newEnd = addMinutes(newStart, durationMinutes)

  return { start: newStart, end: newEnd }
}

// Função para verificar se um evento tem conflito com outros
export function hasEventConflict(
  event: {
    id: string
    start: Date
    end: Date
  },
  otherEvents: {
    id: string
    start: Date
    end: Date
  }[],
) {
  return otherEvents.some(
    (otherEvent) =>
      event.id !== otherEvent.id && // Não comparar com o próprio evento
      event.start < otherEvent.end &&
      event.end > otherEvent.start,
  )
}

// Função para calcular a posição vertical de um evento na visualização de dia/semana
export function calculateEventPosition(event: { start: Date; end: Date }, containerHeight: number, hourHeight: number) {
  const startHour = event.start.getHours()
  const startMinute = event.start.getMinutes()
  const durationMinutes = differenceInMinutes(event.end, event.start)

  // Posição vertical baseada na hora de início
  const top = (startHour + startMinute / 60) * hourHeight

  // Altura baseada na duração
  const height = (durationMinutes / 60) * hourHeight

  return { top, height }
}
