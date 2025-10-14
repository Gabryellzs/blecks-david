// components/notification-provider.tsx
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

  // Util: checar se erro é "session missing"
  const isSessionMissing = (err: unknown) =>
    typeof err === "object" &&
    err !== null &&
    /auth.*session.*missing/i.test(String((err as any).message ?? err))

  // Verificar usuário autenticado (tolerante a ausência de sessão)
  useEffect(() => {
    let cancelled = false

    const checkUser = async () => {
      try {
        console.log("🔔 [POPUP] 🔍 Verificando sessão...")

        // Primeiro: checar sessão
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          if (isSessionMissing(sessionError)) {
            console.log("🔔 [POPUP] Sem sessão (ok para páginas públicas).")
            if (!cancelled) setCurrentUser(null)
            return
          }
          console.error("🔔 [POPUP] getSession error:", sessionError)
          if (!cancelled) setCurrentUser(null)
          return
        }

        const session = sessionData?.session
        if (!session) {
          console.log("🔔 [POPUP] Nenhuma sessão ativa.")
          if (!cancelled) setCurrentUser(null)
          return
        }

        // Se há sessão, opcionalmente confirmar usuário
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) {
          if (!isSessionMissing(userError)) {
            console.error("🔔 [POPUP] getUser error:", userError)
          }
          if (!cancelled) setCurrentUser(null)
          return
        }

        console.log("🔔 [POPUP] 👤 Usuário encontrado:", userData.user?.id ?? "(desconhecido)")
        if (!cancelled) setCurrentUser(userData.user ?? session.user ?? null)
      } catch (error) {
        if (!isSessionMissing(error)) {
          console.error("🔔 [POPUP] ❌ Erro inesperado na verificação:", error)
        } else {
          console.log("🔔 [POPUP] Sessão ausente (página pública).")
        }
        if (!cancelled) setCurrentUser(null)
      }
    }

    checkUser()

    // Listener para mudanças de autenticação
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔔 [POPUP] 🔄 Mudança na autenticação:", _event)
      setCurrentUser(session?.user || null)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  // Carregar timestamp da última visualização de popup
  useEffect(() => {
    let cancelled = false
    const loadLastPopupViewed = async () => {
      if (!currentUser?.id) return
      try {
        console.log("🔔 [POPUP] Carregando última visualização de popup do Supabase...")

        const { data, error } = await supabase
          .from("user_notification_settings")
          .select("last_popup_viewed")
          .eq("user_id", currentUser.id)
          .single()

        // PGRST116 = no rows
        if (error && error.code !== "PGRST116") {
          console.error("🔔 [POPUP] Erro ao buscar última visualização:", error)
          return
        }

        if (data?.last_popup_viewed) {
          const ts = new Date(data.last_popup_viewed).getTime()
          console.log("🔔 [POPUP] Última visualização encontrada:", new Date(ts))
          if (!cancelled) setLastPopupViewed(ts)
        } else {
          console.log("🔔 [POPUP] Nenhum timestamp de popup encontrado no Supabase")
        }
      } catch (error) {
        console.error("🔔 [POPUP] Erro ao carregar última visualização:", error)
      }
    }

    loadLastPopupViewed()
    return () => {
      cancelled = true
    }
  }, [currentUser])

  // Função para salvar timestamp no Supabase
  const savePopupViewedToSupabase = async (timestamp: number) => {
    if (!currentUser?.id) {
      console.log("🔔 [POPUP] ⚠️ Usuário não autenticado, não salvando no Supabase")
      return false
    }
    try {
      const { error } = await supabase
        .from("user_notification_settings")
        .upsert(
          {
            user_id: currentUser.id,
            last_popup_viewed: new Date(timestamp).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
      if (error) {
        console.error("🔔 [POPUP] ❌ Erro ao salvar no Supabase:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("🔔 [POPUP] ❌ Erro inesperado ao salvar no Supabase:", error)
      return false
    }
  }

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).slice(2, 11),
      timestamp: Date.now(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    const toastOptions = {
      duration: 5000,
      action: notification.icon ? undefined : { label: "Fechar", onClick: () => {} },
    }

    switch (notification.type) {
      case "success":
        toast.success(notification.title, { description: notification.message, ...toastOptions })
        break
      case "error":
        toast.error(notification.title, { description: notification.message, ...toastOptions })
        break
      case "warning":
        toast.warning(notification.title, { description: notification.message, ...toastOptions })
        break
      case "sales":
        toast.success(notification.title, { description: notification.message, icon: notification.icon, ...toastOptions })
        break
      default:
        toast(notification.title, { description: notification.message, ...toastOptions })
    }

    if (notification.playSound) {
      try {
        const audio = new Audio("/notification-sound.mp3")
        audio.volume = 0.3
        void audio.play().catch(() => {
          console.log("🔔 [POPUP] Som de notificação não pôde ser reproduzido")
        })
      } catch {
        // silencioso
      }
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllAsRead = useCallback(async () => {
    const now = Date.now()
    setLastPopupViewed(now)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    if (currentUser?.id) {
      const ok = await savePopupViewedToSupabase(now)
      if (!ok) console.log("🔔 [POPUP] ⚠️ Falha ao sincronizar popup com Supabase")
    }
  }, [currentUser])

  const unreadNotifications = notifications.filter((n) =>
    lastPopupViewed === 0 ? !n.read : n.timestamp > lastPopupViewed,
  )
  const unreadCount = unreadNotifications.length

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
