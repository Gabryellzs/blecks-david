import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/notification-provider"
import { DataMigrationDialog } from "@/components/data-migration-dialog"
import { MigrationInitializer } from "@/components/migration-initializer"
import { SessionKeeper } from "@/components/session-keeper"
import { AuthGuard } from "@/components/auth-guard"
import { AuthProvider } from "@/lib/auth" // CORREÇÃO: Importação sem a extensão .tsx
import { SessionSyncProvider } from "@/components/session-sync-provider"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "BLECK's",
    template: "%s | BLECK's",
  },
  description: "A productivity application with authentication and user tracking",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
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
      </body>
    </html>
  )
}
