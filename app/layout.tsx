// app/layout.tsx
import type React from "react"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/notification-provider" // usado só nas rotas públicas, se quiser toasts
import { GuardSwitch } from "@/components/guard-switch"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "BLECK's",
  icons: {
    icon: "/images/logo-light-mode.png",
    shortcut: "/images/logo-light-mode.png",
    apple: "/images/logo-light-mode.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {/* GuardSwitch decide se aplica Auth ou não */}
          <GuardSwitch>
            {/* Se quiser toasts também na Home pública, deixe esse Provider aqui fora.
               Se não precisar, pode remover e usar só dentro do GuardSwitch. */}
            <NotificationProvider>
              {children}
              <Toaster />
            </NotificationProvider>
          </GuardSwitch>
        </ThemeProvider>
      </body>
    </html>
  )
}
