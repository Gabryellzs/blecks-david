"use client"

import { useEffect, useState } from "react"
import { useLocalStorage } from "./use-local-storage"
import { useNotification } from "@/components/notification-provider"
import { addMinutes, isAfter, isBefore, subMinutes } from "date-fns"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Interface para eventos do calendário
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  color: string
  allDay?: boolean
  notified?: boolean // Novo campo para rastrear se já enviamos notificação
}

// Interface para configurações de notificação
interface NotificationSettings {
  enabled: boolean
  timeBefore: number[] // Minutos antes do evento para notificar (ex: [15, 60, 1440] para 15min, 1h, 1 dia)
}

export function useCalendarNotifications(initialEvents: CalendarEvent[] = []) {
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(
    "calendar-notification-settings",
    {
      enabled: true,
      timeBefore: [5, 15, 60, 1440], // Padrão: 5min, 15min, 1h, 1 dia antes
    },
  )
  const { addNotification } = useNotification()
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)

  // Converter strings de data para objetos Date
  const parsedEvents = events.map((event) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }))

  // Verificar eventos próximos e enviar notificações
  useEffect(() => {
    if (!notificationSettings.enabled) return

    const checkInterval = setInterval(() => {
      const now = new Date()

      const updatedEvents = [...parsedEvents]
      let hasUpdates = false

      parsedEvents.forEach((event, index) => {
        // Para cada intervalo de tempo configurado
        notificationSettings.timeBefore.forEach((minutes) => {
          const notificationTime = subMinutes(event.start, minutes)

          // Verificar se está no momento de notificar (entre agora e 1 minuto atrás)
          const isTimeToNotify = isAfter(now, notificationTime) && isBefore(now, addMinutes(notificationTime, 1))

          if (isTimeToNotify && !event.notified) {
            // Determinar mensagem baseada no tempo
            let timeMessage = ""
            if (minutes === 5) timeMessage = "em 5 minutos"
            else if (minutes === 15) timeMessage = "em 15 minutos"
            else if (minutes === 60) timeMessage = "em 1 hora"
            else if (minutes === 1440) timeMessage = "amanhã"
            else timeMessage = `em ${minutes} minutos`

            // Enviar notificação com configuração explícita para reproduzir som
            addNotification({
              title: `Evento: ${event.title}`,
              message: `Você tem um evento ${timeMessage}: ${event.title} às ${format(event.start, "HH:mm", { locale: ptBR })}`,
              type: "info",
              category: "calendar",
              playSound: true, // Adicionar esta linha para garantir que o som seja reproduzido
              actions: [
                {
                  label: "Ver Calendário",
                  onClick: () => {
                    // Navegar para o calendário
                    window.dispatchEvent(new CustomEvent("navigate-to-view", { detail: "calendar" }))
                  },
                },
              ],
            })

            // Marcar como notificado
            updatedEvents[index] = { ...event, notified: true }
            hasUpdates = true
          }
        })
      })

      // Atualizar eventos se houve mudanças
      if (hasUpdates) {
        setEvents(updatedEvents)
      }
    }, 10000) // Verificar a cada 10 segundos

    return () => clearInterval(checkInterval)
  }, [parsedEvents, notificationSettings, addNotification, setEvents])

  // Função para atualizar configurações de notificação
  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...settings }))
  }

  // Função para resetar o status de notificação (útil quando um evento é editado)
  const resetNotificationStatus = (eventId: string) => {
    setEvents((prevEvents) => prevEvents.map((event) => (event.id === eventId ? { ...event, notified: false } : event)))
  }

  // Função para testar notificações manualmente
  const testNotification = () => {
    addNotification({
      title: "Teste de Calendário",
      message: "Esta é uma notificação de teste do calendário",
      type: "info",
      category: "calendar",
    })
    return true
  }

  return {
    events,
    setEvents,
    notificationSettings,
    updateNotificationSettings,
    resetNotificationStatus,
    testNotification, // Adicione esta linha
  }
}
