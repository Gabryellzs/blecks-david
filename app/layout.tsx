// app/layout.tsx
import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ClientLayout } from "./client-layout"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BLECK's",
  icons: {
    icon: "/images/logo-light-mode.png",
    shortcut: "/images/logo-light-mode.png",
    apple: "/images/logo-light-mode.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Meta viewport adicional no head (ok manter junto com export viewport) */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
