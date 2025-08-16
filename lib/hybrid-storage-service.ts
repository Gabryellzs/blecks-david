"use client"

import { indexedDBService } from "./indexed-db-service"
import { supabaseStorage } from "./supabase-storage-service"
import { eventService, EVENTS } from "./event-service"
import { supabase } from "@/lib/supabaseClient"
import type { PaymentGatewayConfig, PaymentTransaction } from "./payment-gateway-types"
import type { Transaction } from "@/components/views/finances-view"

interface SyncStatus {
  inProgress: boolean
  lastSync: Date | null
  error: string | null
}

export class HybridStorageService {
  private static _instance: HybridStorageService | null = null

  private syncStatus: SyncStatus = {
    inProgress: false,
    lastSync: null,
    error: null,
  }
  private userId: string | null = null
  private syncInterval: NodeJS.Timeout | null = null

  private constructor() {
    // O construtor não deve chamar initialize() ou checkUser() diretamente aqui
    // Eles serão chamados de forma segura no cliente.
  }

  public static getInstance(): HybridStorageService {
    if (typeof window === "undefined") {
      console.warn("HybridStorageService.getInstance() called on server. This service is client-side only.")
      if (!HybridStorageService._instance) {
        HybridStorageService._instance = new HybridStorageService()
      }
      return HybridStorageService._instance
    }

    if (!HybridStorageService._instance) {
      HybridStorageService._instance = new HybridStorageService()
      HybridStorageService._instance.initializeClientSide() // Inicializa no cliente
    }
    return HybridStorageService._instance
  }

  private initializeClientSide() {
    if (typeof window !== "undefined") {
      indexedDBService.initialize().catch((error) => {
        console.error("Erro ao inicializar IndexedDB no HybridStorageService:", error)
      })
      this.checkUser()
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  private async checkUser() {
    if (typeof window === "undefined") return // Apenas no cliente
    try {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        this.userId = data.user.id
        this.startAutoSync()
      }

      // Escutar mudanças de autenticação
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          this.userId = session.user.id
          this.startAutoSync()
        } else if (event === "SIGNED_OUT") {
          this.userId = null
          this.stopAutoSync()
        }
      })
    } catch (error) {
      console.error("Erro ao verificar usuário:", error)
    }
  }

  // Gateway Configs
  async saveGatewayConfigs(configs: PaymentGatewayConfig[]): Promise<boolean> {
    try {
      // Primeiro salva localmente para resposta rápida
      await indexedDBService.saveGatewayConfigs(configs)

      // Depois sincroniza com o servidor se o usuário estiver logado
      if (this.userId) {
        await supabaseStorage.saveGatewayConfigs(this.userId, configs)
      }

      // Notifica outros componentes sobre a mudança
      eventService.publish(EVENTS.GATEWAY_CONFIGS_UPDATED, { configs })

      return true
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      return false
    }
  }

  async getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
    try {
      // Primeiro tenta buscar localmente para resposta rápida
      const localConfigs = await indexedDBService.getGatewayConfigs()

      // Se o usuário estiver logado, busca do servidor em segundo plano
      if (this.userId) {
        this.syncStatus.inProgress = true
        eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })

        const serverConfigs = await supabaseStorage.getGatewayConfigs(this.userId)

        this.syncStatus.inProgress = false
        this.syncStatus.lastSync = new Date()
        eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })

        // Se houver dados no servidor e forem diferentes dos locais, atualiza local
        if (serverConfigs.length > 0 && JSON.stringify(serverConfigs) !== JSON.stringify(localConfigs)) {
          await indexedDBService.saveGatewayConfigs(serverConfigs)
          eventService.publish(EVENTS.GATEWAY_CONFIGS_UPDATED, { configs: serverConfigs })
          return serverConfigs
        }
      }

      return localConfigs
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
      this.syncStatus.inProgress = false
      this.syncStatus.error = error instanceof Error ? error.message : "Erro desconhecido"
      eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })
      return []
    }
  }

  // Gateway Transactions
  async saveTransactions(transactions: PaymentTransaction[]): Promise<boolean> {
    try {
      // Primeiro salva localmente para resposta rápida
      await indexedDBService.saveTransactions(transactions)

      // Depois sincroniza com o servidor se o usuário estiver logado
      if (this.userId) {
        await supabaseStorage.saveTransactions(this.userId, transactions)
      }

      // Notifica outros componentes sobre a mudança
      eventService.publish(EVENTS.GATEWAY_TRANSACTIONS_UPDATED, { transactions })

      return true
    } catch (error) {
      console.error("Erro ao salvar transações:", error)
      return false
    }
  }

  async getTransactions(): Promise<PaymentTransaction[]> {
    try {
      // Primeiro tenta buscar localmente para resposta rápida
      const localTransactions = await indexedDBService.getTransactions()

      // Se o usuário estiver logado, busca do servidor em segundo plano
      if (this.userId) {
        this.syncStatus.inProgress = true
        eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })

        const serverTransactions = await supabaseStorage.getTransactions(this.userId)

        this.syncStatus.inProgress = false
        this.syncStatus.lastSync = new Date()
        eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })

        // Se houver dados no servidor e forem diferentes dos locais, atualiza local
        if (serverTransactions.length > 0 && JSON.stringify(serverTransactions) !== JSON.stringify(localTransactions)) {
          await indexedDBService.saveTransactions(serverTransactions)
          eventService.publish(EVENTS.GATEWAY_TRANSACTIONS_UPDATED, { transactions: serverTransactions })
          return serverTransactions
        }
      }

      return localTransactions
    } catch (error) {
      console.error("Erro ao buscar transações:", error)
      this.syncStatus.inProgress = false
      this.syncStatus.error = error instanceof Error ? error.message : "Erro desconhecido"
      eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })
      return []
    }
  }

  // Finance Transactions
  async saveFinanceTransactions(transactions: Transaction[]): Promise<boolean> {
    try {
      // Primeiro salva localmente para resposta rápida
      await indexedDBService.saveFinanceTransactions(transactions)

      // Depois sincroniza com o servidor se o usuário estiver logado
      if (this.userId) {
        await supabaseStorage.saveFinanceTransactions(this.userId, transactions)
      }

      // Notifica outros componentes sobre a mudança
      eventService.publish(EVENTS.FINANCE_TRANSACTIONS_UPDATED, { transactions })

      return true
    } catch (error) {
      console.error("Erro ao salvar transações financeiras:", error)
      return false
    }
  }

  async getFinanceTransactions(): Promise<Transaction[]> {
    try {
      // Primeiro tenta buscar localmente para resposta rápida
      const localTransactions = await indexedDBService.getFinanceTransactions()

      // Se o usuário estiver logado, busca do servidor em segundo plano
      if (this.userId) {
        this.syncStatus.inProgress = true
        eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })

        const serverTransactions = await supabaseStorage.getFinanceTransactions(this.userId)

        this.syncStatus.inProgress = false
        this.syncStatus.lastSync = new Date()
        eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })

        // Se houver dados no servidor e forem diferentes dos locais, atualiza local
        if (serverTransactions.length > 0 && JSON.stringify(serverTransactions) !== JSON.stringify(localTransactions)) {
          await indexedDBService.saveFinanceTransactions(serverTransactions)
          eventService.publish(EVENTS.FINANCE_TRANSACTIONS_UPDATED, { transactions: serverTransactions })
          return serverTransactions
        }
      }

      return localTransactions
    } catch (error) {
      console.error("Erro ao buscar transações financeiras:", error)
      this.syncStatus.inProgress = false
      this.syncStatus.error = error instanceof Error ? error.message : "Erro desconhecido"
      eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })
      return []
    }
  }

  // Sincronização automática
  startAutoSync(intervalMinutes = 5) {
    if (typeof window === "undefined") return // Apenas no cliente
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(
      async () => {
        if (this.userId && !this.syncStatus.inProgress) {
          await this.syncWithServer()
        }
      },
      intervalMinutes * 60 * 1000,
    )
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async syncWithServer(): Promise<boolean> {
    if (!this.userId) return false

    try {
      this.syncStatus.inProgress = true
      eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })

      // Sincronizar configurações
      const localConfigs = await indexedDBService.getGatewayConfigs()
      await supabaseStorage.saveGatewayConfigs(this.userId, localConfigs)

      // Sincronizar transações
      const localTransactions = await indexedDBService.getTransactions()
      await supabaseStorage.saveTransactions(this.userId, localTransactions)

      // Sincronizar transações financeiras
      const localFinanceTransactions = await indexedDBService.getFinanceTransactions()
      await supabaseStorage.saveFinanceTransactions(this.userId, localFinanceTransactions)

      this.syncStatus.inProgress = false
      this.syncStatus.lastSync = new Date()
      this.syncStatus.error = null
      eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })

      return true
    } catch (error) {
      console.error("Erro na sincronização:", error)
      this.syncStatus.inProgress = false
      this.syncStatus.error = error instanceof Error ? error.message : "Erro desconhecido"
      eventService.publish(EVENTS.SYNC_STATUS_CHANGED, { status: this.syncStatus })
      return false
    }
  }
}

export const getHybridStorageService = () => HybridStorageService.getInstance()
