"use client"

import { useEffect, useState } from "react"
import { useAuthCheck } from "./auth-check"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { isUsingMockClient } from "@/lib/supabaseClient"
import LoginForm from "@/components/auth/login-form" // Caminho corrigido

export default function LoginPage() {
  useAuthCheck()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showMockClientWarning, setShowMockClientWarning] = useState(false)

  useEffect(() => {
    // Verificar se há erro na URL
    const error = searchParams.get("error")
    const forceResync = searchParams.get("force_resync")
    const message = searchParams.get("message")
    
    if (error === "session_expired") {
      setErrorMessage("Sua sessão expirou. Por favor, faça login novamente.")
    } else if (forceResync === "true") {
      // Limpar localStorage para forçar novo login
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
        // Limpar cookies do Supabase
        document.cookie = "supabase_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "sb-sqbmjclonrdsjhcxpjel-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }
      setErrorMessage(message || "Sessão expirada. Faça login novamente para continuar.")
    }

    // Verificar se está usando o cliente mock
    if (isUsingMockClient()) {
      setShowMockClientWarning(true)
    }
  }, [searchParams])

  const backgroundClass = "bg-login-dark-pattern"

  return (
    <div className={`flex h-screen w-screen flex-col items-center justify-center ${backgroundClass}`}>
      <div className="container flex flex-col items-center justify-center">
        {showMockClientWarning && (
          <Alert variant="warning" className="mb-6 max-w-md bg-yellow-100 border-yellow-400 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aviso: Configuração do Supabase</AlertTitle>
            <AlertDescription>
              As variáveis de ambiente do Supabase (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY) não estão
              configuradas. O aplicativo está usando um cliente simulado. Por favor, configure-as no seu projeto Vercel
              para habilitar a autenticação real.
            </AlertDescription>
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de autenticação</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <LoginForm />
      </div>
    </div>
  )
}
