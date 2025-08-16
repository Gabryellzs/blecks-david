"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { supabase, checkSessionStatus } from "@/lib/supabase"
import Dashboard from "@/components/dashboard"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"

export default function HomePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Função para verificar autenticação
  const checkAuth = async () => {
    try {
      console.log("Verificando autenticação na página raiz...")

      // Verificar a sessão atual
      const { isAuthenticated, session, error } = await checkSessionStatus()

      if (error) {
        console.error("Erro ao verificar sessão:", error)
        setAuthError(error.message || "Erro ao verificar autenticação")
        setLoading(false)
        return
      }

      if (!isAuthenticated) {
        console.log("Nenhuma sessão válida encontrada")
        setAuthError("Sessão inválida ou expirada")
        router.push("/login")
        setLoading(false)
        return
      }

      console.log("Usuário autenticado com sucesso na página raiz")
      setAuthenticated(true)
      setAuthError(null)
      setLoading(false)

      // Mostrar toast de boas-vindas
      toast({
        title: "Bem-vindo ao Dashboard!",
        description: "Você está logado com sucesso.",
      })
    } catch (error: any) {
      console.error("Exceção ao verificar autenticação:", error)
      setAuthError(error.message || "Erro desconhecido ao verificar autenticação")
      setLoading(false)
    }
  }

  // Função para fazer logout e redirecionar
  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    } else {
      console.error("Cliente Supabase não inicializado")
      // Limpar manualmente o localStorage como fallback
      if (typeof window !== "undefined") {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("auth") || key.includes("sb-")) {
            localStorage.removeItem(key)
          }
        })
      }
    }
    router.push("/login")
  }

  useEffect(() => {
    checkAuth()

    // Configurar listener para mudanças de autenticação apenas se o supabase existir
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Evento de autenticação:", event)

        if (event === "SIGNED_OUT") {
          router.push("/login")
        } else if (event === "SIGNED_IN" && session) {
          setAuthenticated(true)
          setAuthError(null)
          setLoading(false)
        }
      })

      return () => {
        // Limpar o listener quando o componente for desmontado
        authListener.subscription.unsubscribe()
      }
    } else {
      console.error("Cliente Supabase não inicializado, redirecionando para login")
      setAuthError("Erro de configuração do Supabase")
      setLoading(false)
      // Redirecionar para login após um pequeno delay
      const timer = setTimeout(() => {
        router.push("/login")
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [router, toast])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Carregando dashboard...</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={checkAuth} className="mr-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>

          <Button variant="outline" onClick={handleLogout}>
            Voltar para login
          </Button>
        </div>
      </div>
    )
  }

  // Se autenticado, renderiza o Dashboard diretamente
  if (authenticated) {
    return <Dashboard />
  }

  // Fallback (não deve chegar aqui normalmente)
  return (
    <div className="flex h-screen items-center justify-center">
      <Button onClick={() => router.push("/login")}>Ir para página de login</Button>
    </div>
  )
}
