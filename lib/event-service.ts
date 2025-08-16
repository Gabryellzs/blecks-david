"use client"

// Tipos de eventos disponíveis no sistema
export const EVENTS = {
  GATEWAY_CONFIGS_UPDATED: "gateway-configs-updated",
  TRANSACTIONS_UPDATED: "transactions-updated",
  FINANCE_TRANSACTIONS_UPDATED: "finance-transactions-updated",
  DATA_MIGRATION_COMPLETED: "data-migration-completed",
  MIGRATION_STATUS_CHANGED: "migration-status-changed",
  // Adicione outros eventos conforme necessário
}

type EventCallback = (data: any) => void

export class EventService {
  private static instance: EventService
  private listeners: Map<string, EventCallback[]> = new Map()

  private constructor() {}

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  // Publicar um evento
  publish(eventType: string, data: any): void {
    const eventListeners = this.listeners.get(eventType)
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${eventType}:`, error)
        }
      })
    }
  }

  // Assinar um evento
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }

    const eventListeners = this.listeners.get(eventType)!
    eventListeners.push(callback)

    // Retornar função para cancelar a assinatura
    return () => {
      const index = eventListeners.indexOf(callback)
      if (index !== -1) {
        eventListeners.splice(index, 1)
      }
    }
  }
}

export const eventService = EventService.getInstance()
