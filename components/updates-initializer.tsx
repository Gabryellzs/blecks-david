"use client"

import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { checkSessionStatus } from "@/lib/supabase"

export function UpdatesInitializer() {
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Verificar a sessão ao inicializar
    const verifySession = async () => {
      try {
        const sessionStatus = await checkSessionStatus()

        // Se a verificação redirecionou, não fazer nada
        if (sessionStatus.redirected) return

        // Se não estiver autenticado, redirecionar para login
        if (!sessionStatus.isAuthenticated) {
          router.push("/login?error=session_expired")
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error)
      }
    }

    verifySession()
  }, [router])

  return null
}
