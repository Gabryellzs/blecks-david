"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "sales"
  category?: string
  timestamp: number
  icon?: React.ReactNode
  playSound?: boolean
  read?: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [lastPopupViewed, setLastPopupViewed] = useState<number>(0)

  // Verificar usuário autenticado
  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("🔔 [POPUP] 🔍 Verificando autenticação...")

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.error("🔔 [POPUP] ❌ Erro na autenticação:", error)
          setCurrentUser(null)
          return
        }

        console.log("🔔 [POPUP] 👤 Usuário encontrado:", user?.id || "Nenhum usuário")
        setCurrentUser(user)
      } catch (error) {
        console.error("🔔 [POPUP] ❌ Erro inesperado na verificação:", error)
        setCurrentUser(null)
      }
    }

    checkUser()

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔔 [POPUP] 🔄 Mudança na autenticação:", event)
      setCurrentUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Carregar timestamp da última visualização de popup
  useEffect(() => {
    const loadLastPopupViewed = async () => {
      if (!currentUser?.id) return

      try {
        console.log("🔔 [POPUP] Carregando última visualização de popup do Supabase...")

        const { data, error } = await supabase
          .from("user_notification_settings")
          .select("last_popup_viewed")
          .eq("user_id", currentUser.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("🔔 [POPUP] Erro ao buscar última visualização:", error)
          return
        }

        if (data?.last_popup_viewed) {
          const timestamp = new Date(data.last_popup_viewed).getTime()
          console.log("🔔 [POPUP] Última visualização encontrada no Supabase:", new Date(timestamp))
          setLastPopupViewed(timestamp)
        } else {
          console.log("🔔 [POPUP] Nenhum timestamp de popup encontrado no Supabase")
        }
      } catch (error) {
        console.error("🔔 [POPUP] Erro ao carregar última visualização:", error)
      }
    }

    loadLastPopupViewed()
  }, [currentUser])

  // Função para salvar timestamp no Supabase
  const savePopupViewedToSupabase = async (timestamp: number) => {
    if (!currentUser?.id) {
      console.log("🔔 [POPUP] ⚠️ Usuário não autenticado, não salvando no Supabase")
      return false
    }

    try {
      console.log("🔔 [POPUP] 🔍 Salvando visualização de popup no Supabase...")
      console.log("🔔 [POPUP] ⏰ Timestamp:", new Date(timestamp))
      console.log("🔔 [POPUP] 👤 Usuário ID:", currentUser.id)

      const { data, error } = await supabase
        .from("user_notification_settings")
        .upsert(
          {
            user_id: currentUser.id,
            last_popup_viewed: new Date(timestamp).toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        )
        .select()

      if (error) {
        console.error("🔔 [POPUP] ❌ Erro ao salvar no Supabase:", error)
        return false
      }

      console.log("🔔 [POPUP] ✅ Salvo no Supabase com sucesso!")
      return true
    } catch (error) {
      console.error("🔔 [POPUP] ❌ Erro inesperado ao salvar no Supabase:", error)
      return false
    }
  }

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    }

    console.log("🔔 [POPUP] 📢 Nova notificação adicionada:", newNotification.title)

    setNotifications((prev) => [newNotification, ...prev])

    // Mostrar toast
    const toastOptions = {
      duration: 5000,
      action: notification.icon ? undefined : { label: "Fechar", onClick: () => {} },
    }

    switch (notification.type) {
      case "success":
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions,
        })
        break
      case "error":
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions,
        })
        break
      case "warning":
        toast.warning(notification.title, {
          description: notification.message,
          ...toastOptions,
        })
        break
      case "sales":
        toast.success(notification.title, {
          description: notification.message,
          icon: notification.icon,
          ...toastOptions,
        })
        break
      default:
        toast(notification.title, {
          description: notification.message,
          ...toastOptions,
        })
    }

    // Tocar som se solicitado
    if (notification.playSound) {
      try {
        const audio = new Audio("/notification-sound.mp3")
        audio.volume = 0.3
        audio.play().catch(() => {
          console.log("🔔 [POPUP] Som de notificação não pôde ser reproduzido")
        })
      } catch (error) {
        console.log("🔔 [POPUP] Erro ao reproduzir som:", error)
      }
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    console.log("🔔 [POPUP] 🗑️ Removendo notificação:", id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    console.log("🔔 [POPUP] 🧹 Limpando todas as notificações")
    setNotifications([])
  }, [])

  const markAsRead = useCallback((id: string) => {
    console.log("🔔 [POPUP] ✅ Marcando notificação como lida:", id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllAsRead = useCallback(async () => {
    console.log("🔔 [POPUP] ✅ Marcando todas as notificações popup como lidas")

    const now = Date.now()
    setLastPopupViewed(now)

    // Marcar todas as notificações como lidas localmente
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    // Salvar no Supabase se autenticado
    if (currentUser?.id) {
      console.log("🔔 [POPUP] 🚀 Iniciando sincronização de popup com Supabase...")
      const success = await savePopupViewedToSupabase(now)
      if (success) {
        console.log("🔔 [POPUP] ✅ SYNC de notificações popup marcadas como lidas com sucesso!")
      } else {
        console.log("🔔 [POPUP] ⚠️ Falha ao sincronizar popup com Supabase")
      }
    } else {
      console.log("🔔 [POPUP] ⚠️ Usuário não autenticado - pulando sincronização de popup")
    }
  }, [currentUser])

  // Calcular notificações não lidas baseado no timestamp
  const unreadNotifications = notifications.filter((n) => {
    if (lastPopupViewed === 0) return !n.read // Se nunca visualizou, usar flag local
    return n.timestamp > lastPopupViewed // Se já visualizou antes, usar timestamp
  })

  const unreadCount = unreadNotifications.length

  console.log("🔔 [POPUP] Renderizando provider...")
  console.log("🔔 [POPUP] Total de notificações:", notifications.length)
  console.log("🔔 [POPUP] Não lidas:", unreadCount)
  console.log("🔔 [POPUP] Última visualização:", new Date(lastPopupViewed))

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}
