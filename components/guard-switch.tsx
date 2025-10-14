"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/termos", "/privacidade"]

export function GuardSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // rota pública?
  const isPublic = PUBLIC_ROUTES.some((p) =>
    pathname === p || pathname.startsWith(p + "/")
  )

  if (isPublic) return <>{children}</>
  return <AuthGuard>{children}</AuthGuard>
}
