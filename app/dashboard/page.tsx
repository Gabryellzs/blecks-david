"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, checkSessionStatus } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AppSidebar } from "@/components/app-sidebar"
import DashboardView from "@/components/dashboard-view"
import { NotificationProvider } from "@/components/notification-provider"
import { UpdatesInitializer } from "@/components/updates-initializer"
import { useTheme } from "@/hooks/use-theme"
import { Progress } from "@/components/ui/progress"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

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

      if (!isAuthenticated || !session) {
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

      toast({ title: "Bem-vindo ao Dashboard!", description: "Você está logado com sucesso." })
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
      setUserAvatarUrl((event as any).detail)
    }
    window.addEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)

    return () => {
      authListener?.subscription?.unsubscribe?.()
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

  const imageSrc =
    theme === "dark" ? "/images/premiacoes-dark-large.png" : "/images/premiacoes-light-large.png"

  return (
    <NotificationProvider>
      <UpdatesInitializer />
      <SidebarProvider>
        <div className="flex h-screen w-screen overflow-hidden"> {/* ✅ overflow-hidden aplicado aqui */}
          <AppSidebar />
          <SidebarInset className="overflow-hidden"> {/* ✅ e aqui também */}
            {/* HEADER */}
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center" />
              <div className="flex items-center gap-4">
                <AchievementProgressHeader achievementData={achievementData} />
                <ThemeToggleButton />
                <NotificationSalesPopover />

                {/* Avatar + Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-full p-0 outline-none focus:ring-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userAvatarUrl || "/placeholder-user.jpg"} alt="User Avatar" />
                      <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-56 rounded-xl border border-border/60 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-2"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        router.push("/dashboard/profile")
                      }}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-muted/60 focus:bg-muted/60 cursor-pointer"
                    >
                      <User className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                      <span>Perfil</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        handleLogout()
                      }}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* BODY */}
            <div className="flex h-[calc(100%-4rem)] w-full overflow-hidden"> {/* ✅ sem rolagem vertical */}
              {/* Painel principal */}
              <div className="w-full md:w-[89%] overflow-hidden p-3"> {/* ✅ bloqueia rolagem aqui */}
                <DashboardView onViewChange={() => {}} />
              </div>

              {/* Coluna lateral */}
              <div className="hidden md:flex md:w-[22%] overflow-hidden p-4 flex-col items-center pt-4 mt-[62px]"> {/* ✅ bloqueia rolagem lateral também */}
                <img
                  src={imageSrc || "/placeholder.svg"}
                  alt="Suas Próximas Premiações"
                  className="max-w-full h-auto object-contain"
                />

                {/* PROGRESSO DE CONQUISTAS */}
                <div className="mt-8 w-full px-2 text-center">
                  <h3
                    className="text-[18px] md:text-sm font-semibold leading-none tracking-tight
                               max-w-full overflow-hidden text-ellipsis whitespace-nowrap mb-1"
                  >
                    Progresso de Conquistas
                  </h3>

                  <div className="text-[14px] text-muted-foreground font-medium whitespace-nowrap mb-2">
                    {achievementData.isMaxGoalReached ? (
                      <span className="text-green-500 font-medium">{achievementData.goalText}</span>
                    ) : (
                      <>
                        {formatCurrency(achievementData.currentProgress)} /{" "}
                        {formatCurrency(achievementData.segmentEnd)}
                      </>
                    )}
                  </div>

                  <Progress value={achievementData.percentage} className="w-full h-3" />

                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {achievementData.isMaxGoalReached
                      ? "Todas as metas atingidas!"
                      : achievementData.goalText}
                  </p>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  )
}
