"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

import { UpdatesInitializer } from "@/components/updates-initializer"
import { NotificationProvider } from "@/components/notification-provider"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

import { RefreshCw, User, LogOut } from "lucide-react"
import AdsDashboardView from "@/components/views/ads-dashboard-view"

import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { getAchievementData } from "@/lib/utils"

export default function AdsPage() {
  const { session, user, loading, isAuthenticated, error } = useAuth()

  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [pageStatus, setPageStatus] = useState("Carregando...")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  const router = useRouter()

  // métricas de vendas / conquistas (topo direito)
  const { getStats } = useGatewayTransactions()
  const consolidatedSummary = getStats()
  const totalNetSales = consolidatedSummary.netAmount
  const achievementData = getAchievementData(totalNetSales)

  // Buscar dados básicos do usuário (nome/avatar)
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
          console.error(
            "AdsPage: Erro ao buscar perfil do usuário:",
            profileError
          )
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
        setPageStatus(`Erro de Autenticação: ${error.message}`)
        console.error("AdsPage: Authentication error:", error)
      }
    }

    fetchUserData()

    // escuta atualização de avatar
    const handleAvatarUpdate = (event: CustomEvent) => {
      setUserAvatarUrl((event as any).detail)
    }
    window.addEventListener(
      "profile-avatar-updated",
      handleAvatarUpdate as EventListener
    )

    return () => {
      window.removeEventListener(
        "profile-avatar-updated",
        handleAvatarUpdate as EventListener
      )
    }
  }, [isAuthenticated, user, loading, error])

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Se não logado, manda pro login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [loading, isAuthenticated, router])

  // Mensagens vindas da conexão do Google Analytics
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)

      if (urlParams.get("google_analytics_connected") === "true") {
        setSuccessMessage("Google Analytics conectado com sucesso!")

        if (urlParams.get("warning") === "no_analytics_access") {
          const message =
            urlParams.get("message") ||
            "Conta conectada mas sem acesso ao Google Analytics"
          setWarningMessage(decodeURIComponent(message))
        }

        // limpar a URL depois de mostrar mensagens
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("google_analytics_connected")
        newUrl.searchParams.delete("warning")
        newUrl.searchParams.delete("message")
        window.history.replaceState({}, "", newUrl.toString())
      }
    }
  }, [])

  // Estados de carregando / erro auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="ml-2">
          Carregando dashboard de anúncios... ({pageStatus})
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>
            {error.message || "Ocorreu um erro desconhecido."}
          </AlertDescription>
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
            Não foi possível encontrar uma sessão válida. Redirecionando para o
            login...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Render principal
  return (
    <NotificationProvider>
      <UpdatesInitializer />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* HEADER SUPERIOR DO DASH */}
          <div className="flex h-16 items-center justify-between px-4 sticky top-0 bg-background z-10">
            <div className="flex items-center gap-2" />
            <div className="flex items-center gap-4">
              <AchievementProgressHeader achievementData={achievementData} />
              <ThemeToggleButton />
              <NotificationSalesPopover />

              {/* Avatar + dropdown usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full p-0 outline-none focus:ring-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={userAvatarUrl || "/placeholder-user.jpg"}
                      alt="User Avatar"
                    />
                    <AvatarFallback>
                      {userName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
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

          {/* CONTEÚDO DO DASH DE ADS */}
          <div className="flex-1 overflow-auto w-full">
            {/* mensagens de integração GA */}
            {successMessage && (
              <Alert className="m-4 max-w-4xl">
                <AlertTitle>✅ Sucesso!</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {warningMessage && (
              <Alert
                variant="default"
                className="m-4 max-w-4xl border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
              >
                <AlertTitle>⚠️ Aviso</AlertTitle>
                <AlertDescription>
                  {warningMessage}
                  <br />
                  <span className="text-sm text-muted-foreground mt-2 block">
                    Para ter acesso completo ao Google Analytics, você precisa:
                    <ul className="list-disc list-inside mt-1 ml-4">
                      <li>
                        Criar uma conta Google Analytics em{" "}
                        <a
                          href="https://analytics.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          analytics.google.com
                        </a>
                      </li>
                      <li>
                        Ou ter acesso a uma conta Google Analytics existente
                      </li>
                      <li>
                        A conta deve estar associada ao email usado no login
                      </li>
                    </ul>
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* AQUI é onde renderiza as contas Meta / campanhas / etc */}
            <AdsDashboardView />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
