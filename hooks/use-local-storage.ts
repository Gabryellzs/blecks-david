"use client"

import { useState, useEffect } from "react"

// Tipo para o valor que pode ser armazenado
type StorageValue<T> = T | null

// Hook personalizado para localStorage
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      // Buscar do localStorage
      const item = window.localStorage.getItem(key)
      // Analisar JSON armazenado ou retornar initialValue se não existir
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Se erro, retornar initialValue
      console.error(`Erro ao ler localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Função para definir valor
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value seja uma função para que tenhamos a mesma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Salvar no estado
      setStoredValue(valueToStore)

      // Salvar no localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // Um erro mais avançado de tratamento seria implementar um fallback
      console.error(`Erro ao definir localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

// Hook para localStorage com sincronização entre abas
export function useLocalStorageSync<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useLocalStorage(key, initialValue)

  useEffect(() => {
    // Função para lidar com mudanças no localStorage de outras abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Erro ao sincronizar localStorage key "${key}":`, error)
        }
      }
    }

    // Adicionar listener para mudanças no storage
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
    }

    // Cleanup
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [key, setStoredValue])

  return [storedValue, setStoredValue]
}

// Hook para localStorage com expiração
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  expiryInMinutes = 60,
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (!item) {
        return initialValue
      }

      const parsedItem = JSON.parse(item)

      // Verificar se tem estrutura de expiração
      if (parsedItem.expiry && parsedItem.value !== undefined) {
        const now = new Date().getTime()

        // Se expirou, remover e retornar valor inicial
        if (now > parsedItem.expiry) {
          window.localStorage.removeItem(key)
          return initialValue
        }

        return parsedItem.value
      }

      // Se não tem estrutura de expiração, tratar como valor normal
      return parsedItem
    } catch (error) {
      console.error(`Erro ao ler localStorage com expiração key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value

      setStoredValue(valueToStore)

      if (typeof window !== "undefined") {
        const now = new Date().getTime()
        const expiry = now + expiryInMinutes * 60 * 1000

        const itemWithExpiry = {
          value: valueToStore,
          expiry: expiry,
        }

        window.localStorage.setItem(key, JSON.stringify(itemWithExpiry))
      }
    } catch (error) {
      console.error(`Erro ao definir localStorage com expiração key "${key}":`, error)
    }
  }

  const clearValue = () => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Erro ao limpar localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, clearValue]
}

// Utilitário para verificar se localStorage está disponível
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const testKey = "__localStorage_test__"
    window.localStorage.setItem(testKey, "test")
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

// Utilitário para obter todos os itens do localStorage
export function getAllLocalStorageItems(): Record<string, any> {
  if (!isLocalStorageAvailable()) {
    return {}
  }

  const items: Record<string, any> = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      try {
        const value = localStorage.getItem(key)
        items[key] = value ? JSON.parse(value) : null
      } catch (error) {
        // Se não conseguir fazer parse, armazenar como string
        items[key] = localStorage.getItem(key)
      }
    }
  }

  return items
}

// Utilitário para limpar todos os itens do localStorage
export function clearAllLocalStorage(): void {
  if (isLocalStorageAvailable()) {
    localStorage.clear()
  }
}

// Utilitário para obter o tamanho usado do localStorage
export function getLocalStorageSize(): number {
  if (!isLocalStorageAvailable()) {
    return 0
  }

  let total = 0

  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }

  return total
}

// Hook para monitorar o tamanho do localStorage
export function useLocalStorageSize(): number {
  const [size, setSize] = useState(0)

  useEffect(() => {
    const updateSize = () => {
      setSize(getLocalStorageSize())
    }

    // Atualizar tamanho inicial
    updateSize()

    // Monitorar mudanças (funciona apenas na mesma aba)
    const originalSetItem = localStorage.setItem
    const originalRemoveItem = localStorage.removeItem
    const originalClear = localStorage.clear

    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, [key, value])
      updateSize()
    }

    localStorage.removeItem = function (key) {
      originalRemoveItem.apply(this, [key])
      updateSize()
    }

    localStorage.clear = function () {
      originalClear.apply(this)
      updateSize()
    }

    // Cleanup
    return () => {
      localStorage.setItem = originalSetItem
      localStorage.removeItem = originalRemoveItem
      localStorage.clear = originalClear
    }
  }, [])

  return size
}
