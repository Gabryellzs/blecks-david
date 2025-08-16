"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, checkSessionStatus } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import DashboardView from "@/components/dashboard-view"
import { NotificationProvider } from "@/components/notification-provider"
import { UpdatesInitializer } from "@/components/updates-initializer"
import { useTheme } from "@/hooks/use-theme"
import { Progress } from "@/components/ui/progress"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAchievementData, formatCurrency } from "@/lib/utils"

export default function DashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const { theme } = useTheme()
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

    const handleAvatarUpdate = (event: CustomEvent) => {
      setUserAvatarUrl(event.detail)
    }
    window.addEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)

    return () => {
      authListener.subscription.unsubscribe()
      window.removeEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)
    }
  }, [toast])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Carregando dashboard...</p>
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

  const imageSrc = theme === "dark" ? "/images/premiacoes-dark-large.png" : "/images/premiacoes-light-large.png"

  return (
    <NotificationProvider>
      <UpdatesInitializer />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-16 items-center justify-between px-4">
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
          <div className="flex h-[calc(100%-4rem)] w-full">
            <div className="w-full md:w-[75%] overflow-auto p-4">
              <DashboardView onViewChange={() => {}} />
            </div>
            <div className="hidden md:flex md:w-[25%] overflow-auto p-4 flex-col items-center pt-4">
              <img
                src={imageSrc || "/placeholder.svg"}
                alt="Suas Próximas Premiações"
                className="max-w-full h-auto object-contain"
              />
              <div className="mt-8 w-full px-4">
                <h3 className="text-lg font-semibold text-center mb-2">Progresso de Conquistas</h3>
                <div className="text-sm text-muted-foreground text-center mb-1">
                  {achievementData.isMaxGoalReached ? (
                    <span className="text-green-500 font-medium">{achievementData.goalText}</span>
                  ) : (
                    <>
                      {formatCurrency(achievementData.currentProgress)} / {formatCurrency(achievementData.segmentEnd)}
                    </>
                  )}
                </div>
                <Progress value={achievementData.percentage} className="w-full h-3" />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {achievementData.isMaxGoalReached ? "Todas as metas atingidas!" : achievementData.goalText}
                </p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
