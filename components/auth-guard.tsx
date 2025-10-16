"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

// ✅ Inclui "/" e trata prefixos (ex.: /login/qualquer-coisa)
const PUBLIC_PATHS = ["/", "/login", "/register", "/reset-password", "/update-password"]
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

      // 🔒 Sem sessão e não é rota pública → login
      if (!session && !publicRoute && pathname !== "/login") {
        router.replace("/login")
      }

      // 🔓 Com sessão e em rota pública (exceto update-password) → dashboard
      if (session && publicRoute && pathname !== "/update-password" && pathname !== "/dashboard") {
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
