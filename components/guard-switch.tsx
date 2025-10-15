// components/guard-switch.tsx
"use client"

import type React from "react"
import { usePathname } from "next/navigation"

import { AuthGuard } from "@/components/auth-guard"
import { NotificationProvider } from "@/components/notification-provider"
import { SessionKeeper } from "@/components/session-keeper"
import { DataMigrationDialog } from "@/components/data-migration-dialog"
import { MigrationInitializer } from "@/components/migration-initializer"

const PROTECTED = [/^\/dashboard(?:\/|$)/, /^\/admin(?:\/|$)/]

export function GuardSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/"
  const isProtected = PROTECTED.some((rx) => rx.test(pathname))

  if (!isProtected) {
    // Rotas públicas: NÃO montar nada que dependa de sessão
    return <>{children}</>
  }

  // Rotas protegidas: monta toda a “infra” de auth
  return (
    <AuthGuard>
      <SessionKeeper />
      <DataMigrationDialog />
      <MigrationInitializer />
      <NotificationProvider>{children}</NotificationProvider>
    </AuthGuard>
  )
}
