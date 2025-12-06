"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationProvider } from "@/components/notification-provider"
import { UpdatesInitializer } from "@/components/updates-initializer"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"          // mesmo client que você usa no dashboard
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { getAchievementData, formatCurrency } from "@/lib/utils"

import ProductivityView from "./ProductivityView"

export default function ProductivityPage() {
  const router = useRouter()

  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)

  // mesma lógica do dashboard para buscar profile + stats
  const { getStats } = useGatewayTransactions()
  const consolidatedSummary = getStats()
  const totalNetSales = consolidatedSummary.netAmount
  const achievementData = getAchievementData(totalNetSales)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, full_name, avatar_url")
        .eq("id", user.id)
        .single()

      if (profile?.first_name) setUserName(profile.first_name)
      else if (profile?.full_name) setUserName(profile.full_name.split(" ")[0])
      else setUserName(user.email?.split("@")[0] || "Usuário")

      setUserAvatarUrl(profile?.avatar_url || null)
    }

    loadProfile()

    const handleAvatarUpdate = (event: CustomEvent) => {
      setUserAvatarUrl((event as any).detail)
    }
    window.addEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)

    return () => {
      window.removeEventListener("profile-avatar-updated", handleAvatarUpdate as EventListener)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <NotificationProvider>
      <UpdatesInitializer />
      <SidebarProvider>
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Barra lateral de ícones (Home, Produtividade, etc) */}
          <AppSidebar />

          {/* Área principal */}
          <SidebarInset className="flex-1 overflow-hidden flex flex-col">
            {/* HEADER IGUAL DO DASHBOARD */}
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                {/* Aqui você pode colocar o título da página, se quiser */}
                <span className="font-semibold text-lg hidden sm:inline">
                  Produtividade
                </span>
              </div>

              <div className="flex items-center gap-4">
                <AchievementProgressHeader achievementData={achievementData} />
                <ThemeToggleButton />
                <NotificationSalesPopover />

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

            {/* CONTEÚDO DE PRODUTIVIDADE */}
            <div className="flex-1 overflow-auto">
              <ProductivityView />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  )
}
