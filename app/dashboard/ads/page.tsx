"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NotificationProvider } from "@/components/notification-provider"
import { UpdatesInitializer } from "@/components/updates-initializer"
import AdsDashboardView from "@/components/views/ads-dashboard-view"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { getAchievementData } from "@/lib/utils"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

export default function AdsPage() {
  const { session, user, loading, isAuthenticated, error } = useAuth()
  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [pageStatus, setPageStatus] = useState("Carregando...")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  const router = useRouter()
  const { getStats } = useGatewayTransactions()
  const consolidatedSummary = getStats()
  const totalNetSales = consolidatedSummary.netAmount
  const achievementData = getAchievementData(totalNetSales)

  useEffect(() => {
    console.log("AdsPage: useEffect - Auth state changed", { loading, isAuthenticated, error, user })
    const fetchUserData = async () => {
      if (isAuthenticated && user) {
        setPageStatus("Autenticado")
        console.log("AdsPage: User authenticated, fetching profile...")

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, full_name, avatar_url")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("AdsPage: Erro ao buscar perfil do usuário:", profileError)
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
          console.log("AdsPage: User profile fetched", { userName, userAvatarUrl: userProfile?.avatar_url })
        }
      } else if (!loading && !isAuthenticated) {
        setPageStatus("Não Autenticado")
        console.log("AdsPage: Not authenticated, redirecting to login if not already there.")
      } else if (error) {
        setPageStatus(`Erro de Autenticação: ${error.message}`)
        console.error("AdsPage: Authentication error:", error)
      }
    }

    fetchUserData()

    const handleAvatarUpdate = (event: CustomEvent) => {
      setUserAvatarUrl(event.detail)
    }
    window.addEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)

    return () => {
      window.removeEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)
    }
  }, [isAuthenticated, user, loading, error])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("AdsPage: Not authenticated, redirecting to login.")
      router.push("/login")
    }
  }, [loading, isAuthenticated, router])

  // Verificar parâmetros de URL para mensagens de sucesso e warning
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      
      // Verificar mensagem de sucesso do Google Analytics
      if (urlParams.get('google_analytics_connected') === 'true') {
        setSuccessMessage('Google Analytics conectado com sucesso!')
        
        // Verificar se há warning sobre acesso ao Analytics
        if (urlParams.get('warning') === 'no_analytics_access') {
          const message = urlParams.get('message') || 'Conta conectada mas sem acesso ao Google Analytics'
          setWarningMessage(decodeURIComponent(message))
        }
        
        // Limpar parâmetros da URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('google_analytics_connected')
        newUrl.searchParams.delete('warning')
        newUrl.searchParams.delete('message')
        window.history.replaceState({}, '', newUrl.toString())
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Carregando dashboard de anúncios... ({pageStatus})</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>{error.message || "Ocorreu um erro desconhecido."}</AlertDescription>
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
            Não foi possível encontrar uma sessão válida. Redirecionando para o login...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <NotificationProvider>
      <UpdatesInitializer />
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
            {/* Mensagens de sucesso e warning */}
            {successMessage && (
              <Alert className="m-4 max-w-4xl">
                <AlertTitle>✅ Sucesso!</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            {warningMessage && (
              <Alert variant="default" className="m-4 max-w-4xl border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTitle>⚠️ Aviso</AlertTitle>
                <AlertDescription>
                  {warningMessage}
                  <br />
                  <span className="text-sm text-muted-foreground mt-2 block">
                    Para ter acesso completo ao Google Analytics, você precisa:
                    <ul className="list-disc list-inside mt-1 ml-4">
                      <li>Criar uma conta Google Analytics em <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">analytics.google.com</a></li>
                      <li>Ou ter acesso a uma conta Google Analytics existente</li>
                      <li>A conta deve estar associada ao email usado no login</li>
                    </ul>
                  </span>
                </AlertDescription>
              </Alert>
            )}
            
            <AdsDashboardView />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
