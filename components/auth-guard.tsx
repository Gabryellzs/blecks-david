"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

const publicPaths = ["/login", "/register", "/reset-password", "/update-password"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      const isPublicPath = publicPaths.includes(pathname)

      if (!session && !isPublicPath) {
        router.push("/login")
      } else if (session && isPublicPath && pathname !== "/update-password") {
        router.push("/dashboard")
      }
      setIsLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      checkSession()
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [pathname, router])

  if (isLoading) {
    return null
  }

  return <>{children}</>
}
