"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, User, LogOut } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NotificationProvider } from "@/components/notification-provider"
import { UpdatesInitializer } from "@/components/updates-initializer"
import DiaryView from "@/components/views/diary-view"
import { useRouter } from "next/navigation"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { getAchievementData } from "@/lib/utils"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export default function DiaryPage() {
  const { session, user, loading, isAuthenticated, error } = useAuth()
  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [pageStatus, setPageStatus] = useState("Carregando...")

  const router = useRouter()
  const { theme } = useTheme()
  const { getStats } = useGatewayTransactions()
  const consolidatedSummary = getStats()
  const totalNetSales = consolidatedSummary.netAmount
  const achievementData = getAchievementData(totalNetSales)

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && user) {
        setPageStatus("Autenticado")

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, full_name, avatar_url")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Erro ao buscar perfil do usuário:", profileError)
          setUserName(user.email?.split("@")[0] || "Usuário")
        } else {
          if (userProfile?.first_name) {
            setUserName(userProfile.first_name)
          } else if (userProfile?.full_name) {
            const firstName = userProfile.full_name.split(" ")[0]
            setUserName(firstName)
          } else {
            setUserName(user.email?.split("@")[0] || "Usuário")
          }
          setUserAvatarUrl(userProfile?.avatar_url || null)
        }
      } else if (!loading && !isAuthenticated) {
        setPageStatus("Não Autenticado")
      } else if (error) {
        setPageStatus("Erro de Autenticação")
      }
    }

    fetchUserData()

    const handleAvatarUpdate = (event: CustomEvent) => {
      setUserAvatarUrl((event as any).detail)
    }
    window.addEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)

    return () => {
      window.removeEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)
    }
  }, [isAuthenticated, user, loading, error])

  const handleLogout = async () => {
    const { supabase } = await import("@/lib/supabase")
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Carregando Diário Semanal... ({pageStatus})</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>{String(error)}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()} className="mr-2">
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

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert className="mb-4 max-w-md">
          <AlertTitle>Sessão não encontrada</AlertTitle>
          <AlertDescription>
            Não foi possível encontrar uma sessão válida. Por favor, faça login novamente.
          </AlertDescription>
        </Alert>

        <Button onClick={() => (window.location.href = "/login")}>Ir para página de login</Button>
      </div>
    )
  }

  return (
    <NotificationProvider>
      <UpdatesInitializer />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* HEADER */}
          <div className="flex h-16 items-center justify-between px-4 sticky top-0 bg-background z-10">
            <div className="flex items-center" />
            <div className="flex items-center gap-4">
              <AchievementProgressHeader achievementData={achievementData} />
              <ThemeToggleButton />
              <NotificationSalesPopover />

              {/* Avatar com Dropdown custom */}
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full p-0 outline-none focus:ring-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatarUrl || "/placeholder-user.jpg"} alt="User Avatar" />
                    <AvatarFallback>{userName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
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
          <div className="flex-1 overflow-auto w-full">
            <DiaryView />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
