"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient" // Usar supabaseClient para o lado do cliente
import { useToast } from "@/components/ui/use-toast"
import { useNotification } from "@/components/notification-provider"
import { useLocalStorage } from "@/hooks/use-local-storage"

export interface AppUpdate {
  id: string
  title: string
  description: string
  version: string
  importance: "low" | "medium" | "high" | "critical"
  created_at: string
  features?: any
  image_url?: string
  action_url?: string
  action_text?: string
}

export function useUpdates() {
  const [updates, setUpdates] = useState<AppUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const { addNotification } = useNotification()

  // Usar localStorage como fallback para atualizações e visualizações
  const [localUpdates, setLocalUpdates] = useLocalStorage<AppUpdate[]>("app_updates", [])
  const [seenUpdateIds, setSeenUpdateIds] = useLocalStorage<string[]>("seen_update_ids", [])

  // Estado para controlar se o Supabase pode ser usado
  const [canUseSupabase, setCanUseSupabase] = useState(false)

  // Tentar verificar o acesso ao Supabase
  const checkSupabaseAccess = useCallback(async () => {
    try {
      console.log("🔍 Verificando acesso ao Supabase para useUpdates...")

      // Verificar se o usuário está autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.log("❌ Usuário não autenticado ou erro ao obter usuário, usando localStorage.")
        setCanUseSupabase(false)
        return false
      }

      // Tentar acessar a tabela app_updates para verificar permissões
      const { error: updatesTableError } = await supabase.from("app_updates").select("id").limit(1)

      if (updatesTableError && !updatesTableError.message.includes("does not exist")) {
        console.warn("⚠️ Erro ao acessar app_updates, pode ser permissão:", updatesTableError.message)
        setCanUseSupabase(false)
        return false
      }

      // Tentar acessar a tabela user_seen_updates para verificar permissões
      const { error: seenUpdatesTableError } = await supabase.from("user_seen_updates").select("user_id").limit(1)

      if (seenUpdatesTableError && !seenUpdatesTableError.message.includes("does not exist")) {
        console.warn("⚠️ Erro ao acessar user_seen_updates, pode ser permissão:", seenUpdatesTableError.message)
        setCanUseSupabase(false)
        return false
      }

      console.log("✅ Acesso ao Supabase verificado. Usando Supabase para atualizações.")
      setCanUseSupabase(true)
      return true
    } catch (err) {
      console.error("❌ Exceção ao verificar acesso ao Supabase:", err)
      setCanUseSupabase(false)
      return false
    }
  }, [])

  // Buscar todas as atualizações
  const fetchUpdates = useCallback(async () => {
    setLoading(true)
    setError(null)
    console.log("📥 Buscando atualizações...")

    try {
      const canUse = await checkSupabaseAccess() // Re-verifica o acesso

      if (canUse) {
        const { data, error: updatesError } = await supabase
          .from("app_updates")
          .select("*")
          .order("created_at", { ascending: false })

        if (updatesError) {
          console.error("❌ Erro ao buscar atualizações do Supabase:", updatesError)
          setError(updatesError)
          setUpdates(localUpdates) // Fallback para localStorage
        } else {
          console.log(`✅ Encontradas ${data?.length || 0} atualizações no Supabase`)
          setUpdates(data || [])
        }
      } else {
        console.log(`📦 Usando localStorage para atualizações: ${localUpdates.length} encontradas`)
        setUpdates(localUpdates)
      }
    } catch (err) {
      console.error("❌ Erro inesperado ao buscar atualizações:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setUpdates(localUpdates) // Fallback para localStorage
    } finally {
      setLoading(false)
    }
  }, [checkSupabaseAccess, localUpdates])

  // Verificar atualizações não vistas pelo usuário
  const checkForNewUpdates = useCallback(async () => {
    console.log("🔍 Verificando novas atualizações...")
    let unseenUpdates: AppUpdate[] = []

    try {
      const canUse = await checkSupabaseAccess() // Re-verifica o acesso

      if (canUse) {
        const { data: userSession, error: sessionError } = await supabase.auth.getSession()
        const userId = userSession?.session?.user?.id

        if (sessionError || !userId) {
          console.log("❌ Usuário não autenticado para verificar atualizações no Supabase.")
          unseenUpdates = localUpdates.filter((update) => !seenUpdateIds.includes(update.id))
        } else {
          // Buscar atualizações que o usuário ainda não viu
          const { data, error } = await supabase
            .from("app_updates")
            .select("*")
            .not("id", "in", supabase.from("user_seen_updates").select("update_id").eq("user_id", userId))
            .order("created_at", { ascending: false })

          if (error) {
            console.error("❌ Erro ao buscar atualizações não vistas do Supabase:", error)
            unseenUpdates = localUpdates.filter((update) => !seenUpdateIds.includes(update.id)) // Fallback
          } else {
            unseenUpdates = data || []
            console.log(`ℹ️ Encontradas ${unseenUpdates.length} atualizações não vistas no Supabase.`)
          }
        }
      } else {
        unseenUpdates = localUpdates.filter((update) => !seenUpdateIds.includes(update.id))
        console.log(`📦 Usando localStorage: ${unseenUpdates.length} atualizações não vistas.`)
      }

      // Notificar sobre novas atualizações
      if (unseenUpdates.length > 0) {
        setTimeout(() => {
          unseenUpdates.forEach((update) => {
            const notificationType =
              update.importance === "critical"
                ? "alert"
                : update.importance === "high"
                  ? "warning"
                  : update.importance === "medium"
                    ? "info"
                    : "success"

            addNotification({
              title: `Nova atualização: ${update.title}`,
              message: update.description,
              type: notificationType,
              category: "system",
              playSound: true,
              actions: [
                {
                  label: "Ver detalhes",
                  onClick: () => {
                    toast({
                      title: update.title,
                      description: update.description,
                      duration: 10000,
                    })
                    markUpdateAsSeen(update.id)
                  },
                },
                {
                  label: "Ignorar",
                  onClick: () => {
                    markUpdateAsSeen(update.id)
                  },
                },
              ],
            })
          })
        }, 1000)
      }
      return unseenUpdates
    } catch (err) {
      console.error("❌ Erro ao verificar novas atualizações:", err)
      return []
    }
  }, [checkSupabaseAccess, localUpdates, seenUpdateIds, addNotification, toast])

  // Marcar uma atualização como vista
  const markUpdateAsSeen = useCallback(
    async (updateId: string) => {
      console.log(`📝 Marcando atualização ${updateId} como vista`)
      try {
        const canUse = await checkSupabaseAccess() // Re-verifica o acesso

        if (canUse) {
          const { data: userSession, error: sessionError } = await supabase.auth.getSession()
          const userId = userSession?.session?.user?.id

          if (sessionError || !userId) {
            console.warn("⚠️ Usuário não autenticado, marcando como vista no localStorage.")
            setSeenUpdateIds((prev) => [...prev, updateId])
            return
          }

          const { error } = await supabase.from("user_seen_updates").insert({
            user_id: userId,
            update_id: updateId,
            seen_at: new Date().toISOString(),
          })

          if (error) {
            console.error(`❌ Erro ao marcar atualização ${updateId} como vista no Supabase:`, error)
            setSeenUpdateIds((prev) => [...prev, updateId]) // Fallback para localStorage
          } else {
            console.log(`✅ Atualização ${updateId} marcada como vista no Supabase.`)
          }
        } else {
          setSeenUpdateIds((prev) => [...prev, updateId])
          console.log(`📦 Atualização ${updateId} marcada como vista no localStorage.`)
        }
      } catch (err) {
        console.error(`❌ Erro inesperado ao marcar atualização ${updateId} como vista:`, err)
        setSeenUpdateIds((prev) => [...prev, updateId]) // Garantir que seja marcada localmente
      }
    },
    [checkSupabaseAccess, setSeenUpdateIds],
  )

  // Adicionar uma nova atualização (para administradores)
  const addUpdate = useCallback(
    async (update: Omit<AppUpdate, "id" | "created_at">) => {
      try {
        console.log(`📝 Adicionando nova atualização: ${update.title}`)
        const newUpdate: AppUpdate = {
          ...update,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        }

        const canUse = await checkSupabaseAccess()

        if (canUse) {
          const { data, error } = await supabase
            .from("app_updates")
            .insert({
              ...update,
              created_at: new Date().toISOString(),
            })
            .select()

          if (error) {
            console.error(`❌ Erro ao adicionar atualização no Supabase:`, error)
            setLocalUpdates((prev) => [newUpdate, ...prev]) // Fallback
          } else if (data && data[0]) {
            newUpdate.id = data[0].id
            console.log(`✅ Atualização adicionada com sucesso no Supabase: ${newUpdate.id}`)
          }
        } else {
          setLocalUpdates((prev) => [newUpdate, ...prev])
          console.log(`📦 Atualização adicionada no localStorage: ${newUpdate.id}`)
        }

        toast({
          title: "Atualização adicionada",
          description: "A atualização foi adicionada com sucesso.",
        })
        fetchUpdates() // Atualizar a lista
        return newUpdate
      } catch (err) {
        console.error(`❌ Erro ao adicionar atualização:`, err)
        toast({
          title: "Erro",
          description: "Não foi possível adicionar a atualização.",
          variant: "destructive",
        })
        return null
      }
    },
    [checkSupabaseAccess, setLocalUpdates, toast, fetchUpdates],
  )

  // Excluir uma atualização
  const deleteUpdate = useCallback(
    async (updateId: string) => {
      try {
        console.log(`🗑️ Excluindo atualização: ${updateId}`)
        const canUse = await checkSupabaseAccess()

        if (canUse) {
          const { error } = await supabase.from("app_updates").delete().eq("id", updateId)

          if (error) {
            console.error(`❌ Erro ao excluir atualização do Supabase:`, error)
            setLocalUpdates((prev) => prev.filter((update) => update.id !== updateId)) // Fallback
          } else {
            console.log(`✅ Atualização ${updateId} excluída do Supabase.`)
          }
        } else {
          setLocalUpdates((prev) => prev.filter((update) => update.id !== updateId))
          console.log(`📦 Atualização ${updateId} excluída do localStorage.`)
        }

        toast({
          title: "Atualização excluída",
          description: "A atualização foi excluída com sucesso.",
        })
        fetchUpdates() // Atualizar a lista
      } catch (err) {
        console.error(`❌ Erro ao excluir atualização:`, err)
        toast({
          title: "Erro",
          description: "Não foi possível excluir a atualização.",
          variant: "destructive",
        })
      }
    },
    [checkSupabaseAccess, setLocalUpdates, toast, fetchUpdates],
  )

  // Efeito para inicializar e verificar atualizações
  useEffect(() => {
    console.log("🔄 Inicializando hook useUpdates")
    const initialize = async () => {
      await checkSupabaseAccess()
      fetchUpdates()
      checkForNewUpdates()
    }
    initialize()
  }, [checkSupabaseAccess, fetchUpdates, checkForNewUpdates])

  return {
    updates,
    loading,
    error,
    fetchUpdates,
    checkForNewUpdates,
    markUpdateAsSeen,
    addUpdate,
    deleteUpdate,
  }
}
