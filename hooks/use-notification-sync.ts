"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface NotificationItem {
  id: string
  timestamp: number
  read?: boolean
}

export function useNotificationSync(notifications: NotificationItem[] = []) {
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Verificar usuário autenticado
  useEffect(() => {
    const checkUser = async () => {
      console.log("🔔 [SYNC] Verificando autenticação do usuário...")
      const {
        data: { user },
      } = await supabase.auth.getUser()
      console.log("🔔 [SYNC] Usuário encontrado:", user?.id || "Não autenticado")
      setCurrentUser(user)
    }
    checkUser()

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔔 [SYNC] Mudança na autenticação:", event)
      setCurrentUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Carregar timestamp da última visualização
  useEffect(() => {
    const loadLastViewed = async () => {
      if (!currentUser?.id) return

      try {
        console.log("🔔 [SYNC] Iniciando sincronização para usuário:", currentUser.id)
        console.log("🔔 [SYNC] Consultando última visualização no Supabase...")

        const { data, error } = await supabase
          .from("user_notification_settings")
          .select("last_sales_viewed")
          .eq("user_id", currentUser.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("🔔 [SYNC] Erro ao consultar Supabase:", error)
          return
        }

        if (data?.last_sales_viewed) {
          const timestamp = new Date(data.last_sales_viewed).getTime()
          console.log("🔔 [SYNC] Timestamp encontrado no Supabase:", new Date(timestamp))
          setLastViewedTimestamp(timestamp)
        } else {
          console.log("🔔 [SYNC] Nenhum timestamp encontrado no Supabase")
        }
      } catch (error) {
        console.error("🔔 [SYNC] Erro inesperado:", error)
      }
    }

    loadLastViewed()
  }, [currentUser])

  // Calcular notificações não lidas
  const unread = notifications.filter((notification) => {
    return notification.timestamp > lastViewedTimestamp
  })

  const unreadCount = unread.length

  // Função para marcar como visualizado
  const markAsViewed = useCallback(async () => {
    console.log("🔔 [SYNC] Iniciando processo de marcar como lida...")

    if (!currentUser?.id) {
      console.log("🔔 [SYNC] Usuário não autenticado, não é possível sincronizar")
      return false
    }

    setIsLoading(true)

    try {
      const now = Date.now()
      console.log("🔔 [SYNC] ⏰ Marcando notificações como lidas em:", new Date(now))

      console.log("🔔 [SYNC] 🔍 Verificando autenticação antes do upsert...")
      console.log("🔔 [SYNC] 👤 ID do usuário:", currentUser.id)

      if (!currentUser.id) {
        console.log("🔔 [SYNC] ❌ ID do usuário não encontrado")
        return false
      }

      console.log("🔔 [SYNC] ✅ Usuário autenticado confirmado, executando upsert...")

      const { data, error } = await supabase
        .from("user_notification_settings")
        .upsert(
          {
            user_id: currentUser.id,
            last_sales_viewed: new Date(now).toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        )
        .select()

      console.log("🔔 [SYNC] 📊 Resultado do upsert:", { data, error })

      if (error) {
        console.error("🔔 [SYNC] ❌ Erro no upsert:", error)
        return false
      }

      setLastViewedTimestamp(now)
      console.log("🔔 [SYNC] ✅ Notificações marcadas como lidas com sucesso!")
      return true
    } catch (error) {
      console.error("🔔 [SYNC] ❌ Erro inesperado:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentUser])

  return {
    unread,
    unreadCount,
    lastViewedTimestamp,
    markAsViewed,
    isLoading,
    isAuthenticated: !!currentUser?.id,
  }
}
