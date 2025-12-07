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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

interface DashboardProps {
  initialActiveView?: ViewType
}

export default function Dashboard({ initialActiveView = "dashboard" }: DashboardProps) {
  const [activeView, setActiveView] = useState<ViewType>(initialActiveView)
  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const { getStats } = useGatewayTransactions()
  const consolidatedSummary = getStats()
  const totalNetSales = consolidatedSummary.netAmount
  const achievementData = getAchievementData(totalNetSales)

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
          router.push("/login")
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, full_name, avatar_url")
          .eq("id", user.id)
          .single()

        if (profile?.first_name) setUserName(profile.first_name)
        else if (profile?.full_name) setUserName(profile.full_name.split(" ")[0])
        else setUserName(user.email?.split("@")[0] || "Usuário")

        setUserAvatarUrl(profile?.avatar_url || null)

        try {
          await supabase.from("user_interactions").insert({
            user_id: user.id,
            interaction_type: "dashboard_access",
            interaction_details: { timestamp: new Date().toISOString() },
          })
        } catch {}
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/login")
    })
    return () => authListener.subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    const handleNavigateToView = (event: CustomEvent) =>
      event.detail && setActiveView(event.detail)
    const handleAvatarUpdate = (event: CustomEvent) =>
      setUserAvatarUrl(event.detail as string)

    window.addEventListener("navigate-to-view", handleNavigateToView as unknown as EventListener)
    window.addEventListener("profile-avatar-updated", handleAvatarUpdate as unknown as EventListener)
    return () => {
      window.removeEventListener("navigate-to-view", handleNavigateToView as unknown as EventListener)
      window.removeEventListener("profile-avatar-updated", handleAvatarUpdate as unknown as EventListener)
    }
  }, [])

  const handleViewChange = (view: string) => setActiveView(view as ViewType)

  const renderView = () => {
    switch (activeView) {
      case "results-dashboard":
        return <ResultsDashboardView userName={userName} />
      case "ads-dashboard":
        return <AdsDashboardView userName={userName} editable />
      case "dashboard":
        return <DashboardView onViewChange={handleViewChange} userName={userName} />
      case "diary":
        return <DiaryView />
      case "notes":
        return <NotesView />
      case "calendar":
        return <CalendarView />
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <NotificationProvider>
      <UpdatesInitializer />
      <SidebarProvider>
        <AppSidebar onViewChange={handleViewChange} activeView={activeView} />

        <SidebarInset className="flex h-screen w-full">
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">
            {/* ⬇⬇⬇ HEADER NÃO MOSTRA EM CALENDÁRIO NEM EM MINDMAP ⬇⬇⬇ */}
            {activeView !== "calendar" && activeView !== "mindmap" && (
              <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b-0">
                <div className="h-16 px-4 flex items-center justify-between">
                  <div />
                  <div className="flex items-center gap-4">
                    <AchievementProgressHeader achievementData={achievementData} />
                    <ThemeToggleButton />
                    <NotificationSalesPopover />

                    {/* === DROPDOWN PADRONIZADO === */}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-full p-0 outline-none focus:ring-0">
                        <Avatar className="h-9 w-9 hover:ring-2 hover:ring-primary/50 transition-all duration-200">
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
                            handleViewChange("profile")
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
                          <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {/* === /DROPDOWN PADRONIZADO === */}
                  </div>
                </div>
              </div>
            )}

            <main className="flex-1 min-h-0 overflow-y-auto w-full">
              <div className={activeView === "calendar" ? "" : "p-4"}>
                {renderView()}
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
