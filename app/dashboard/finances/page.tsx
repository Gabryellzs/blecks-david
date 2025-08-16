"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, checkSessionStatus } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import FinancesView from "@/components/views/finances-view"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { getAchievementData } from "@/lib/utils"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

export default function FinancesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const router = useRouter()

  const { getStats } = useGatewayTransactions()
  const consolidatedSummary = getStats()
  const totalNetSales = consolidatedSummary.netAmount
  const achievementData = getAchievementData(totalNetSales)

  const checkAuth = async () => {
    try {
      const { isAuthenticated, session, error } = await checkSessionStatus()

      if (error) {
        setAuthError(error.message || "Erro ao verificar autenticação")
        setLoading(false)
        return
      }

      if (!isAuthenticated) {
        setAuthError("Sessão inválida ou expirada")
        setLoading(false)
        return
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, full_name, avatar_url")
        .eq("id", session.user.id)
        .single()

      if (profileError) {
        console.error("Erro ao buscar perfil do usuário:", profileError)
        setUserName(session.user.email?.split("@")[0] || "Usuário")
      } else {
        if (userProfile?.first_name) {
          setUserName(userProfile.first_name)
        } else if (userProfile?.full_name) {
          setUserName(userProfile.full_name.split(" ")[0])
        } else {
          setUserName(session.user.email?.split("@")[0] || "Usuário")
        }
        setUserAvatarUrl(userProfile?.avatar_url || null)
      }

      setAuthenticated(true)
      setAuthError(null)
      setLoading(false)

      toast({
        title: "Bem-vindo ao Dashboard!",
        description: "Você está logado com sucesso.",
      })
    } catch (error: any) {
      setAuthError(error.message || "Erro desconhecido ao verificar autenticação")
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  useEffect(() => {
    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        window.location.href = "/login"
      } else if (event === "SIGNED_IN" && session) {
        setAuthenticated(true)
        setAuthError(null)
        setLoading(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [toast])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Carregando Financeiro...</p>
      </div>
    )
  }

  if (authError || !authenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>{authError || "Sessão não encontrada"}</AlertDescription>
        </Alert>
        <Button onClick={() => (window.location.href = "/login")}>Ir para página de login</Button>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-16 items-center justify-between px-4 sticky top-0 bg-background z-10">
          <div className="flex items-center">{/* Título removido */}</div>
          <div className="flex items-center gap-4">
            <AchievementProgressHeader achievementData={achievementData} />
            <ThemeToggleButton />
            <NotificationSalesPopover />
            <Avatar onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
              <AvatarImage src={userAvatarUrl || "/placeholder-user.jpg"} alt="User Avatar" />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="flex-1 overflow-auto w-full">
          <FinancesView />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
