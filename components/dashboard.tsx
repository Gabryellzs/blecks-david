"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import DashboardView from "@/components/dashboard-view"
import { NotificationProvider } from "@/components/notification-provider"
import AIView from "@/components/views/ai-view"
import CalendarView from "@/components/views/calendar-view"
import DiaryView from "@/components/views/diary-view"
import FinancesView from "@/components/views/finances-view"
import MindMapView from "@/components/views/mind-map-view"
import NotesView from "@/components/views/notes-view"
import ProductivityView from "@/components/views/productivity-view"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import CopywritingView from "@/components/views/copywriting-view"
import OfertaEscaladaView from "@/components/views/oferta-escalada-view"

type ViewType =
  | "results-dashboard"
  | "ads-dashboard"
  | "dashboard"
  | "diary"
  | "notes"
  | "calendar"
  | "finances"
  | "mindmap"
  | "ai"
  | "productivity"
  | "copywriting"
  | "oferta-escalada"
  | "editor-paginas"
  | "favorites"
  | "profile"

import ResultsDashboardView from "@/components/views/results-dashboard-view"
import AdsDashboardView from "@/components/views/ads-dashboard-view"
import EditorPaginasView from "@/components/views/editor-paginas-view"
import FavoritesView from "./views/favorites-view"

import { UpdatesInitializer } from "@/components/updates-initializer"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ProfileView from "@/components/views/profile-view"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { getAchievementData } from "@/lib/utils"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

interface DashboardProps {
  initialActiveView?: ViewType
}

export default function Dashboard({ initialActiveView = "dashboard" }: DashboardProps) {
  const [activeView, setActiveView] = useState<ViewType>(initialActiveView)
  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const { getStats } = useGatewayTransactions()
  const consolidatedSummary = getStats()
  const totalNetSales = consolidatedSummary.netAmount
  const achievementData = getAchievementData(totalNetSales)

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()

      localStorage.removeItem("supabase-auth")
      sessionStorage.clear()

      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      })

      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast({
        title: "Erro ao sair",
        description: "Não foi possível completar o logout. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Erro ao obter usuário:", userError)
          router.push("/login")
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, full_name, avatar_url")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError)
        }

        if (profile?.first_name) {
          setUserName(profile.first_name)
        } else if (profile?.full_name) {
          const firstName = profile.full_name.split(" ")[0]
          setUserName(firstName)
        } else {
          const emailName = user.email?.split("@")[0] || "Usuário"
          setUserName(emailName)
        }
        setUserAvatarUrl(profile?.avatar_url || null)

        try {
          await supabase.from("user_interactions").insert({
            user_id: user.id,
            interaction_type: "dashboard_access",
            interaction_details: { timestamp: new Date().toISOString() },
          })
        } catch (interactionError) {
          console.error("Erro ao registrar interação:", interactionError)
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login")
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, toast])

  useEffect(() => {
    const handleNavigateToView = (event: CustomEvent) => {
      if (event.detail) {
        setActiveView(event.detail)
      }
    }

    const handleAvatarUpdate = (event: CustomEvent) => {
      setUserAvatarUrl(event.detail)
    }

    window.addEventListener("navigate-to-view", handleNavigateToView as EventListener)
    window.addEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)

    return () => {
      window.removeEventListener("navigate-to-view", handleNavigateToView as EventListener)
      window.removeEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)
    }
  }, [setActiveView])

  const handleViewChange = (view: string) => {
    setActiveView(view as ViewType)
  }

  const renderView = () => {
    switch (activeView) {
      case "results-dashboard":
        return <ResultsDashboardView userName={userName} />
      case "ads-dashboard":
        return <AdsDashboardView userName={userName} editable={true} />
      case "dashboard":
        return <DashboardView onViewChange={handleViewChange} userName={userName} />
      case "diary":
        return <DiaryView />
      case "notes":
        return <NotesView />
      case "calendar":
        return (
          <div className="h-full w-full">
            <CalendarView />
          </div>
        )
      case "finances":
        return <FinancesView />
      case "mindmap":
        return <MindMapView />
      case "ai":
        return <AIView />
      case "productivity":
        return <ProductivityView />
      case "copywriting":
        return <CopywritingView />
      case "oferta-escalada":
        return <OfertaEscaladaView />
      case "editor-paginas":
        return <EditorPaginasView />
      case "favorites":
        return <FavoritesView />
      case "profile":
        return <ProfileView />
      default:
        return <DashboardView onViewChange={handleViewChange} userName={userName} />
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <NotificationProvider>
      <UpdatesInitializer />
      <SidebarProvider>
        <AppSidebar onViewChange={handleViewChange} activeView={activeView} />
        <SidebarInset>
          {activeView !== "calendar" && (
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center"></div>
              <div className="flex items-center gap-4">
                <AchievementProgressHeader achievementData={achievementData} />
                <ThemeToggleButton />
                <NotificationSalesPopover />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer">
                      <Avatar className="hover:ring-2 hover:ring-primary/50 transition-all duration-200">
                        <AvatarImage src={userAvatarUrl || "/placeholder-user.jpg"} alt="User Avatar" />
                        <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleViewChange("profile")} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? "Saindo..." : "Sair"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
          <div
            className={
              activeView !== "calendar" ? "h-[calc(100%-4rem)] overflow-auto w-full" : "h-full overflow-auto w-full"
            }
          >
            {renderView()}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
