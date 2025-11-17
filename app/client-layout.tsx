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

// 🔓 Rotas públicas (SEM AuthGuard)
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  "/debug",
  "/assinaturas",
]

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  )

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const publicRoute = isPublicRoute(pathname)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SessionKeeper />
      <AuthProvider>
        <NotificationProvider>
          {publicRoute ? (
            // 🔓 HOME, LOGIN, REGISTER, ASSINATURAS...
            <>
              {children}
              <Toaster />
            </>
          ) : (
            // 🔒 DASHBOARD / ADMIN / OUTRAS ROTAS PRIVADAS
            <AuthGuard>
              <DataMigrationDialog />
              <MigrationInitializer />
              {children}
              <Toaster />
            </AuthGuard>
          )}
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
