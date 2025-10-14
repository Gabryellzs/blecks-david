// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/react" // ✅ <- aqui

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/notification-provider"
import { DataMigrationDialog } from "@/components/data-migration-dialog"
import { MigrationInitializer } from "@/components/migration-initializer"
import { SessionKeeper } from "@/components/session-keeper"
import { AuthProvider } from "@/lib/auth"
import { GuardSwitch } from "@/components/guard-switch"

import "./globals.css"

export const metadata: Metadata = {
  title: "BLECK's",
  description: "Landing page BLECK's - Plataforma SaaS",
  icons: {
    icon: "/images/logo-light-mode.png",
    shortcut: "/images/logo-light-mode.png",
    apple: "/images/logo-light-mode.png",
  },
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${GeistSans.className} ${GeistMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SessionKeeper />
          <AuthProvider>
            <GuardSwitch>
              <DataMigrationDialog />
              <MigrationInitializer />
              <NotificationProvider>
                <Suspense fallback={null}>{children}</Suspense>
                <Toaster />
              </NotificationProvider>
            </GuardSwitch>
          </AuthProvider>
        </ThemeProvider>

        <Analytics /> {/* ✅ funciona no Next 14 */}
      </body>
    </html>
  )
}
