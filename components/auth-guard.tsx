"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

// ✅ Rotas públicas (inclui "/", auth e ASSINATURAS)
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  "/assinaturas", // 👈 AGORA É PÚBLICA
]

// match por exato ou prefixo (ex.: /login/xyz)
const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const publicRoute = isPublic(pathname)

      // 🔒 Sem sessão e NÃO é rota pública → manda pro login
      if (!session && !publicRoute && pathname !== "/login") {
        router.replace("/login")
      }

      // 🔓 Com sessão e em rota pública → normalmente iria pro dashboard,
      // MAS queremos permitir que o usuário logado veja /assinaturas também.
      const isExceptionRoute =
        pathname === "/update-password" ||
        pathname === "/dashboard" ||
        pathname === "/assinaturas" || // 👈 NÃO REDIRECIONA /assinaturas MESMO LOGADO
        pathname.startsWith("/assinaturas/")

      if (session && publicRoute && !isExceptionRoute) {
        router.replace("/dashboard")
      }

      if (mounted) setIsLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkSession()
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [pathname, router])

  if (isLoading) return null
  return <>{children}</>
}
