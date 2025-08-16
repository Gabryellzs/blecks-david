"use client" // Garante que este módulo é tratado como um Client Component

import type { PaymentGatewayConfig, PaymentTransaction } from "./payment-gateway-types"
import type { Transaction } from "@/components/views/finances-view"

const DB_NAME = "BlacksProductivityDB"
const DB_VERSION = 1
const GATEWAY_CONFIGS_STORE = "gatewayConfigs"
const GATEWAY_TRANSACTIONS_STORE = "gatewayTransactions"
const FINANCE_TRANSACTIONS_STORE = "financeTransactions"

export class IndexedDBService {
  private db: IDBDatabase | null = null
  private static _instance: IndexedDBService | null = null // Instância Singleton

  // Construtor privado para forçar o uso de getInstance()
  private constructor() {}

  public static getInstance(): IndexedDBService {
    if (typeof window === "undefined") {
      // Se estiver no servidor, retorna uma instância que não faz nada
      console.warn("IndexedDBService.getInstance() chamado no servidor. Retornando instância no-op.")
      return new NoOpIndexedDBService()
    }
    if (!IndexedDBService._instance) {
      IndexedDBService._instance = new IndexedDBService()
    }
    return IndexedDBService._instance
  }

  async initialize(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(true)
        return
      }

      // Verificar se estamos no navegador e se o IndexedDB é suportado
      if (typeof window === "undefined" || !window.indexedDB) {
        console.warn("IndexedDB não disponível no ambiente atual (provavelmente servidor).")
        reject(new Error("IndexedDB not available"))
        return
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Criar stores se não existirem
        if (!db.objectStoreNames.contains(GATEWAY_CONFIGS_STORE)) {
          db.createObjectStore(GATEWAY_CONFIGS_STORE, { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains(GATEWAY_TRANSACTIONS_STORE)) {
          db.createObjectStore(GATEWAY_TRANSACTIONS_STORE, { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains(FINANCE_TRANSACTIONS_STORE)) {
          db.createObjectStore(FINANCE_TRANSACTIONS_STORE, { keyPath: "id" })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve(true)
      }

      request.onerror = (event) => {
        console.error("Erro ao abrir IndexedDB:", event)
        reject(false)
      }
    })
  }

  // Métodos de salvar e obter dados (já possuem as verificações typeof window === "undefined")
  async saveGatewayConfigs(configs: PaymentGatewayConfig[]): Promise<boolean> {
    if (typeof window === "undefined" || !this.db) {
      console.warn("Não é possível salvar configurações: IndexedDB não inicializado ou ambiente de servidor.")
      return false
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(GATEWAY_CONFIGS_STORE, "readwrite")
        const store = transaction.objectStore(GATEWAY_CONFIGS_STORE)
        store.clear()
        let completed = 0
        configs.forEach((config) => {
          const request = store.add(config)
          request.onsuccess = () => {
            completed++
            if (completed === configs.length) {
              resolve(true)
            }
          }
          request.onerror = (event) => {
            console.error("Erro ao salvar config:", event)
          }
        })
        transaction.oncomplete = () => {
          if (configs.length === 0) {
            resolve(true)
          }
        }
        transaction.onerror = (event) => {
          console.error("Erro na transação:", event)
          reject(false)
        }
      } catch (error) {
        console.error("Erro ao salvar configurações:", error)
        reject(false)
      }
    })
  }

  async getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
    if (typeof window === "undefined" || !this.db) {
      console.warn("Não é possível obter configurações: IndexedDB não inicializado ou ambiente de servidor.")
      return []
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(GATEWAY_CONFIGS_STORE, "readonly")
        const store = transaction.objectStore(GATEWAY_CONFIGS_STORE)
        const request = store.getAll()
        request.onsuccess = () => {
          resolve(request.result || [])
        }
        request.onerror = (event) => {
          console.error("Erro ao buscar configurações:", event)
          reject([])
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error)
        reject([])
      }
    })
  }

  async saveTransactions(transactions: PaymentTransaction[]): Promise<boolean> {
    if (typeof window === "undefined" || !this.db) {
      console.warn("Não é possível salvar transações: IndexedDB não inicializado ou ambiente de servidor.")
      return false
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(GATEWAY_TRANSACTIONS_STORE, "readwrite")
        const store = transaction.objectStore(GATEWAY_TRANSACTIONS_STORE)
        store.clear()
        let completed = 0
        transactions.forEach((tx) => {
          const request = store.add(tx)
          request.onsuccess = () => {
            completed++
            if (completed === transactions.length) {
              resolve(true)
            }
          }
          request.onerror = (event) => {
            console.error("Erro ao salvar transação:", event)
          }
        })
        transaction.oncomplete = () => {
          if (transactions.length === 0) {
            resolve(true)
          }
        }
        transaction.onerror = (event) => {
          console.error("Erro na transação:", event)
          reject(false)
        }
      } catch (error) {
        console.error("Erro ao salvar transações:", error)
        reject(false)
      }
    })
  }

  async getTransactions(): Promise<PaymentTransaction[]> {
    if (typeof window === "undefined" || !this.db) {
      console.warn("Não é possível obter transações: IndexedDB não inicializado ou ambiente de servidor.")
      return []
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(GATEWAY_TRANSACTIONS_STORE, "readonly")
        const store = transaction.objectStore(GATEWAY_TRANSACTIONS_STORE)
        const request = store.getAll()
        request.onsuccess = () => {
          resolve(request.result || [])
        }
        request.onerror = (event) => {
          console.error("Erro ao buscar transações:", event)
          reject([])
        }
      } catch (error) {
        console.error("Erro ao buscar transações:", error)
        reject([])
      }
    })
  }

  async saveFinanceTransactions(transactions: Transaction[]): Promise<boolean> {
    if (typeof window === "undefined" || !this.db) {
      console.warn("Não é possível salvar transações financeiras: IndexedDB não inicializado ou ambiente de servidor.")
      return false
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(FINANCE_TRANSACTIONS_STORE, "readwrite")
        const store = transaction.objectStore(FINANCE_TRANSACTIONS_STORE)
        store.clear()
        let completed = 0
        transactions.forEach((tx, index) => {
          const txWithId = { ...tx, id: tx.id || `tx_${index}` }
          const request = store.add(txWithId)
          request.onsuccess = () => {
            completed++
            if (completed === transactions.length) {
              resolve(true)
            }
          }
          request.onerror = (event) => {
            console.error("Erro ao salvar transação financeira:", event)
          }
        })
        transaction.oncomplete = () => {
          if (transactions.length === 0) {
            resolve(true)
          }
        }
        transaction.onerror = (event) => {
          console.error("Erro na transação:", event)
          reject(false)
        }
      } catch (error) {
        console.error("Erro ao salvar transações financeiras:", error)
        reject(false)
      }
    })
  }

  async getFinanceTransactions(): Promise<Transaction[]> {
    if (typeof window === "undefined" || !this.db) {
      console.warn("Não é possível obter transações financeiras: IndexedDB não inicializado ou ambiente de servidor.")
      return []
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(FINANCE_TRANSACTIONS_STORE, "readonly")
        const store = transaction.objectStore(FINANCE_TRANSACTIONS_STORE)
        const request = store.getAll()
        request.onsuccess = () => {
          resolve(request.result || [])
        }
        request.onerror = (event) => {
          console.error("Erro ao buscar transações financeiras:", event)
          reject([])
        }
      } catch (error) {
        console.error("Erro ao buscar transações financeiras:", error)
        reject([])
      }
    })
  }
}

// Versão "no-op" para ser usada no servidor
class NoOpIndexedDBService extends IndexedDBService {
  constructor() {
    super()
  }
  async initialize(): Promise<boolean> {
    return false
  }
  async saveGatewayConfigs(): Promise<boolean> {
    return false
  }
  async getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
    return []
  }
  async saveTransactions(): Promise<boolean> {
    return false
  }
  async getTransactions(): Promise<PaymentTransaction[]> {
    return []
  }
  async saveFinanceTransactions(): Promise<boolean> {
    return false
  }
  async getFinanceTransactions(): Promise<Transaction[]> {
    return []
  }
}

// Exporta a instância Singleton
export const indexedDBService = IndexedDBService.getInstance()
