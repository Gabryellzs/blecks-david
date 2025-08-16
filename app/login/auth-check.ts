"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { redirectToDashboard } from "@/lib/auth-helpers"

export function useAuthCheck() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!supabase) return

        const { data, error } = await supabase.auth.getSession()

        // Se houver erro, não fazer nada (deixar o usuário na página de login)
        if (error) {
          console.error("Erro ao verificar sessão:", error)
          return
        }

        // Se houver sessão válida, redirecionar para o dashboard
        if (data.session) {
          redirectToDashboard()
        }
      } catch (error) {
        console.error("Exceção ao verificar autenticação:", error)
      }
    }

    checkAuth()
  }, [])
}
