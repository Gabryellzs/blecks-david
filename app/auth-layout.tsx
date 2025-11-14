import type { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-0">
      {/* Agora o layout apenas exibe o conteúdo da página, sem cabeçalho */}
      {children}
    </div>
  )
}
