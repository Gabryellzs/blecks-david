"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AppSidebar } from "@/components/app-sidebar"
import DashboardView from "@/components/dashboard-view"
import { NotificationProvider } from "@/components/notification-provider"
import { UpdatesInitializer } from "@/components/updates-initializer"
import { useTheme } from "@/hooks/use-theme"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import { User, LogOut } from "lucide-react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  // =======================
  // 🔐 AUTENTICAÇÃO NOVA
  // =======================
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUser(user)

      // Carregar perfil do Supabase (caso deseje)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single()

      setProfile(profileData ?? null)

      setLoading(false)
    }

    loadUser()
  }, [router])

  // =======================

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="ml-2">Carregando dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>Sessão expirada ou inválida.</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/login")}>Ir para login</Button>
      </div>
    )
  }

  const userName =
    profile?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário"

  const avatarUrl = profile?.avatar_url || "/placeholder-user.jpg"

  return (
    <NotificationProvider>
      <UpdatesInitializer />
      <SidebarProvider>
        <div className="flex h-screen w-screen overflow-hidden">
          <AppSidebar />
          <SidebarInset className="overflow-hidden">

            {/* HEADER */}
            <div className="flex h-16 items-center justify-between px-4">
              <div />
              <div className="flex items-center gap-4">

                {/* Avatar + menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-full p-0 outline-none focus:ring-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl} alt="User Avatar" />
                      <AvatarFallback>
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-56 rounded-xl border shadow-lg p-2"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        router.push("/dashboard/profile")
                      }}
                      className="cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        handleLogout()
                      }}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="flex h-[calc(100%-4rem)] w-full overflow-hidden">
              <div className="w-full p-0">
                <DashboardView onViewChange={() => {}} />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  )
}
