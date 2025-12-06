"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Lógica nova
import { supabase } from "@/lib/supabaseClient"

// Design antigo (Componentes UI)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function login(e: any) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      let errorMsg = error.message
      if (errorMsg.includes("Invalid login credentials")) errorMsg = "Email ou senha incorretos."
      
      setError(errorMsg)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    // Adicionei este Wrapper para centralizar na tela inteira (min-h-screen)
    <div className="flex min-h-screen items-center justify-center p-4">
      
      {/* Aqui começa o seu design antigo exato */}
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex justify-center mb-0">
          <Image src="/images/logo-light-mode.png" alt="Logo" width={150} height={150} className="h-auto" />
        </div>
        
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Entrar</h1>
          <p className="text-sm text-white">Digite seu email e senha para acessar sua conta</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro de autenticação</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={login} className="space-y-4">
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
            disabled={loading}
          >
            {loading ? (
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
    </div>
  )
}