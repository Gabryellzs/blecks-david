// app/client-layout.tsx
"use client"

import type React from "react"
import { usePathname } from "next/navigation"

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  "/debug",
  "/assinaturas",
]

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isAuthRoute = ["/login", "/register", "/reset-password", "/update-password"].includes(
    pathname,
  )

  return <>{children}</>
}
