"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"

import { loginWithEmail, isUsingMockClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showMockClientWarning, setShowMockClientWarning] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (isUsingMockClient()) {
      setShowMockClientWarning(true)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isLoading) return
    if (showMockClientWarning) {
      toast({
        title: "Erro de configuração",
        description: "As variáveis de ambiente do Supabase não estão configuradas. Não é possível fazer login real.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setLoginError(null)

    try {
      console.log("DEBUG: [LOGIN_FORM] Starting login process...")

      if (typeof window !== "undefined") {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("auth") || key.includes("sb-")) {
            localStorage.removeItem(key)
          }
        })
      }

      const result = await loginWithEmail(email, password)

      if (!result.success) {
        throw result.error
      }

      console.log("DEBUG: [LOGIN_FORM] Login successful!")

      toast({
        title: "Login realizado com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      })

      const redirectTo = searchParams.get("redirectTo")
      console.log(`DEBUG: [LOGIN_FORM] Redirect URL: ${redirectTo}`)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (redirectTo && redirectTo !== "/login" && redirectTo !== "/") {
        console.log(`DEBUG: [LOGIN_FORM] Redirecting to: ${redirectTo}`)
        router.push(redirectTo)
      } else {
        console.log("DEBUG: [LOGIN_FORM] Redirecting to dashboard")
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Erro de login:", error)

      let errorMessage = "Verifique suas credenciais e tente novamente."

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos."
      } else if (error.message?.includes("refresh_token_not_found")) {
        errorMessage = "Sessão expirada. Por favor, tente novamente."
      } else if (error.message) {
        errorMessage = error.message
      }

      setLoginError(errorMessage)

      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex justify-center mb-0">
        <Image src="/images/logo-light-mode.png" alt="Logo" width={150} height={150} className="h-auto" />
      </div>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Entrar</h1>
        <p className="text-sm text-white">Digite seu email e senha para acessar sua conta</p>
      </div>

      {showMockClientWarning && (
        <Alert variant="warning" className="bg-yellow-100 border-yellow-400 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso: Cliente Supabase Mock</AlertTitle>
          <AlertDescription>
            As variáveis de ambiente do Supabase não estão configuradas. O login real não funcionará.
          </AlertDescription>
        </Alert>
      )}

      {loginError && (
        <Alert variant="destructive">
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">
            Senha
          </Label>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="text-right">
            <Link href="/reset-password" className="text-xs text-white hover:text-gray-300">
              Esqueci minha senha
            </Link>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-white text-black hover:bg-gray-200"
          disabled={isLoading || showMockClientWarning}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-white">
        Não tem uma conta?{" "}
        <Link href="/register" className="underline underline-offset-4 hover:text-gray-300">
          Registre-se
        </Link>
      </div>
    </div>
  )
}
