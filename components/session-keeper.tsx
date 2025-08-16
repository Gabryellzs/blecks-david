"use client"

import { useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function SessionKeeper() {
  // Função para manter a sessão ativa
  const keepSessionAlive = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.warn("[SESSION_KEEPER] Error checking session:", error.message)
        return
      }

      if (session) {
        console.log("[SESSION_KEEPER] Session is active, keeping alive")

        // Verificar se o token está próximo do vencimento (10 minutos antes)
        const expiresAt = session.expires_at
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = expiresAt - now

        if (timeUntilExpiry < 600) {
          // 10 minutos
          console.log("[SESSION_KEEPER] Token expiring soon, refreshing...")

          const { error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            console.error("[SESSION_KEEPER] Error refreshing session:", refreshError.message)
          } else {
            console.log("[SESSION_KEEPER] Session refreshed successfully")
          }
        }
      } else {
        console.log("[SESSION_KEEPER] No active session found")
      }
    } catch (error) {
      console.error("[SESSION_KEEPER] Unexpected error:", error)
    }
  }, [])

  useEffect(() => {
    // Verificar sessão imediatamente
    keepSessionAlive()

    // Configurar intervalo para manter sessão ativa
    const intervalId = setInterval(keepSessionAlive, 30000) // A cada 30 segundos

    // Listener para eventos de visibilidade da página
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("[SESSION_KEEPER] Page became visible, checking session")
        keepSessionAlive()
      }
    }

    // Listener para eventos de foco da janela
    const handleFocus = () => {
      console.log("[SESSION_KEEPER] Window focused, checking session")
      keepSessionAlive()
    }

    // Adicionar event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    // Cleanup
    return () => {
      clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [keepSessionAlive])

  // Este componente não renderiza nada visível
  return null
}
