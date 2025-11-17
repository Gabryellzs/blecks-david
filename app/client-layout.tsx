"use client"

import type React from "react"
import { usePathname } from "next/navigation"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/notification-provider"
import { DataMigrationDialog } from "@/components/data-migration-dialog"
import { MigrationInitializer } from "@/components/migration-initializer"
import { SessionKeeper } from "@/components/session-keeper"
import { AuthGuard } from "@/components/auth-guard"
import { AuthProvider } from "@/lib/auth"

// 🟢 Páginas 100% marketing (SEM auth, SEM providers pesados)
const LANDING_ROUTES = ["/", "/assinaturas"]

// 🟡 Páginas públicas de autenticação (precisam do AuthProvider)
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
]

// Helperzinhos
const isRoute = (pathname: string, list: string[]) =>
  list.some((route) => pathname === route || pathname.startsWith(route + "/"))

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isLanding = isRoute(pathname, LANDING_ROUTES)
  const isAuthPage = isRoute(pathname, AUTH_ROUTES)

  // 🟢 1) LANDING / ASSINATURAS → o mais leve possível
  if (isLanding) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
    )
  }

  // 🟡 2) LOGIN / REGISTER / RESET → precisam de AuthProvider, mas sem migração
  if (isAuthPage) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    )
  }

  // 🔴 3) ÁREA LOGADA → tudo completo
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SessionKeeper />
      <AuthProvider>
        <AuthGuard>
          <DataMigrationDialog />
          <MigrationInitializer />
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  )
}
