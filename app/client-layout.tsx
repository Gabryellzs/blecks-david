"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/notification-provider"
import { DataMigrationDialog } from "@/components/data-migration-dialog"
import { MigrationInitializer } from "@/components/migration-initializer"
import { SessionKeeper } from "@/components/session-keeper"
import { AuthGuard } from "@/components/auth-guard"
import { AuthProvider } from "@/lib/auth"

export function ClientLayout({ children }: { children: React.ReactNode }) {
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
