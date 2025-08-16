"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, Mail, BookText, ShieldCheck, ExternalLink, Instagram } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NotificationProvider } from "@/components/notification-provider"
import { UpdatesInitializer } from "@/components/updates-initializer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationSalesPopover } from "@/components/notification-sales-popover"
import { AchievementProgressHeader } from "@/components/achievement-progress-header"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { getAchievementData } from "@/lib/utils"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

export default function SupportPage() {
  const { session, user, loading, isAuthenticated, error } = useAuth()
  const [userName, setUserName] = useState<string>("")
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [pageStatus, setPageStatus] = useState("Carregando...")

  const router = useRouter()
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
      router.push("/login")
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Carregando página de suporte... ({pageStatus})</p>
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
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna Esquerda - Entre em contato */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Entre em contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <Button
                        className="bg-[#25D366] hover:bg-[#20BA5A] text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                        onClick={() => window.open("https://wa.me/5577981610058", "_blank")}
                      >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                        </svg>
                        SUPORTE WHATSAPP
                      </Button>
                    </div>
                    <div className="text-center text-sm text-muted-foreground space-y-1">
                      <p>Disponível de segunda à sexta, das 9h às 18h</p>
                      <p>Sábado das 9h às 16h</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Cards de Termos e Política */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:bg-accent transition-colors">
                    <Link href="/legal/terms-of-use" className="block p-4">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
                        <CardTitle className="text-sm font-medium">Termos de Uso</CardTitle>
                        <BookText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="px-0 pb-0">
                        <CardDescription className="text-xs">
                          Leia nossos termos e condições para o uso da plataforma.
                        </CardDescription>
                      </CardContent>
                    </Link>
                  </Card>
                  <Card className="cursor-pointer hover:bg-accent transition-colors">
                    <Link href="/legal/privacy-policy" className="block p-4">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
                        <CardTitle className="text-sm font-medium">Política de Privacidade</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="px-0 pb-0">
                        <CardDescription className="text-xs">
                          Entenda como coletamos, usamos e protegemos seus dados.
                        </CardDescription>
                      </CardContent>
                    </Link>
                  </Card>
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-6">
                {/* Contatos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Contatos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Email</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>blecks.com.br@gmail.com</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open("mailto:blecks.com.br@gmail.com", "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Clicável</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Instagram</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          <span>@blecks.com.br</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open("https://instagram.com/blecks.com.br", "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Clicável</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Perguntas Frequentes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Perguntas Frequentes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Como posso alterar minha senha?</h3>
                      <p className="text-sm text-muted-foreground">
                        Acesse as configurações da sua conta e selecione a opção "Alterar senha".
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Como exportar meus dados?</h3>
                      <p className="text-sm text-muted-foreground">
                        Em cada módulo, você encontrará um botão de exportação no canto superior direito.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Posso usar o sistema offline?</h3>
                      <p className="text-sm text-muted-foreground">
                        Algumas funcionalidades estão disponíveis offline, mas a sincronização requer conexão.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
