"use client" // Garante que este módulo é tratado como um Client Component

import { indexedDBService } from "./indexed-db-service"
import { supabaseStorage } from "./supabase-storage-service"
import { eventService, EVENTS } from "./event-service"

export interface MigrationStatus {
  inProgress: boolean
  step: string
  progress: number
  error: string | null
  completed: boolean
}

export class MigrationService {
  private status: MigrationStatus = {
    inProgress: false,
    step: "",
    progress: 0,
    error: null,
    completed: false,
  }
  private static _instance: MigrationService | null = null // Instância Singleton

  // Construtor privado para forçar o uso de getInstance()
  private constructor() {
    // Inicializa o IndexedDBService apenas se estiver no cliente
    if (typeof window !== "undefined") {
      indexedDBService.initialize().catch((error) => {
        console.error("Erro ao inicializar IndexedDB no MigrationService:", error)
      })
    }
  }

  public static getInstance(): MigrationService {
    if (typeof window === "undefined") {
      // Se estiver no servidor, retorna uma instância que não faz nada
      console.warn("MigrationService.getInstance() chamado no servidor. Retornando instância no-op.")
      return new NoOpMigrationService()
    }
    if (!MigrationService._instance) {
      MigrationService._instance = new MigrationService()
    }
    return MigrationService._instance
  }

  getStatus(): MigrationStatus {
    return { ...this.status }
  }

  private updateStatus(newStatus: Partial<MigrationStatus>) {
    this.status = { ...this.status, ...newStatus }
    eventService.publish(EVENTS.MIGRATION_STATUS_CHANGED, { status: this.status })
  }

  async hasDataToMigrate(): Promise<boolean> {
    if (typeof window === "undefined") return false // Apenas verifica no cliente
    try {
      // Verifica se o IndexedDB tem dados nos stores antigos
      const gatewayConfigs = await indexedDBService.getGatewayConfigs()
      const gatewayTransactions = await indexedDBService.getTransactions()
      const financeTransactions = await indexedDBService.getFinanceTransactions()

      return gatewayConfigs.length > 0 || gatewayTransactions.length > 0 || financeTransactions.length > 0
    } catch (error) {
      console.error("Erro ao verificar dados para migração:", error)
      return false
    }
  }

  async startMigration(userId: string | null): Promise<void> {
    if (!userId) {
      this.updateStatus({ error: "Usuário não autenticado para migração." })
      return
    }
    if (this.status.inProgress) {
      this.updateStatus({ error: "Migração já em andamento." })
      return
    }

    this.updateStatus({ inProgress: true, step: "Iniciando migração...", progress: 0, error: null, completed: false })

    try {
      // Step 1: Migrate Gateway Configs
      this.updateStatus({ step: "Migrando configurações de gateways...", progress: 20 })
      const localGatewayConfigs = await indexedDBService.getGatewayConfigs()
      if (localGatewayConfigs.length > 0) {
        await supabaseStorage.saveGatewayConfigs(userId, localGatewayConfigs)
        console.log("Configurações de gateways migradas:", localGatewayConfigs.length)
      }

      // Step 2: Migrate Gateway Transactions
      this.updateStatus({ step: "Migrando transações de gateways...", progress: 50 })
      const localGatewayTransactions = await indexedDBService.getTransactions()
      if (localGatewayTransactions.length > 0) {
        await supabaseStorage.saveTransactions(userId, localGatewayTransactions)
        console.log("Transações de gateways migradas:", localGatewayTransactions.length)
      }

      // Step 3: Migrate Finance Transactions
      this.updateStatus({ step: "Migrando transações financeiras...", progress: 80 })
      const localFinanceTransactions = await indexedDBService.getFinanceTransactions()
      if (localFinanceTransactions.length > 0) {
        await supabaseStorage.saveFinanceTransactions(userId, localFinanceTransactions)
        console.log("Transações financeiras migradas:", localFinanceTransactions.length)
      }

      this.updateStatus({ step: "Migração concluída!", progress: 100, inProgress: false, completed: true })
    } catch (error: any) {
      console.error("Erro durante a migração:", error)
      this.updateStatus({
        error: error.message || "Erro desconhecido durante a migração.",
        inProgress: false,
        completed: false,
      })
    }
  }
}

// Versão "no-op" para ser usada no servidor
class NoOpMigrationService extends MigrationService {
  constructor() {
    super()
  }
  getStatus(): MigrationStatus {
    return { inProgress: false, step: "", progress: 0, error: null, completed: false }
  }
  async hasDataToMigrate(): Promise<boolean> {
    return false
  }
  async startMigration(): Promise<void> {
    /* não faz nada */
  }
}

// Exporta a função para obter a instância Singleton
export const getMigrationService = () => MigrationService.getInstance()
