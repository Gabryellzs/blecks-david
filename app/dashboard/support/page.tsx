"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  RefreshCw,
  Mail,
  BookText,
  ShieldCheck,
  ExternalLink,
  Instagram,
  User,
  LogOut,
} from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

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
      setUserAvatarUrl((event as any).detail)
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background">
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-background/60 px-6 py-4 backdrop-blur">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/70 border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Carregando página de suporte...{" "}
            <span className="text-xs text-muted-foreground/70">({pageStatus})</span>
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-background p-4">
        <Alert variant="destructive" className="mb-4 max-w-md rounded-2xl border border-red-500/40">
          <AlertTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Erro de autenticação
          </AlertTitle>
          <AlertDescription className="text-sm">
            {(error as any)?.message || "Ocorreu um erro desconhecido."}
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
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-background p-4">
        <Alert className="mb-4 max-w-md rounded-2xl border border-white/10 bg-background/70 backdrop-blur">
          <AlertTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Sessão não encontrada
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
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
          {/* Layout com header fixo e conteúdo rolável */}
          <div className="flex h-screen flex-col overflow-hidden">
            {/* HEADER fixo */}
            <div className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
              <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  {/* espaço reservado para logo/título se quiser depois */}
                </div>
                <div className="flex items-center gap-4">
                  <AchievementProgressHeader achievementData={achievementData} />
                  <ThemeToggleButton />
                  <NotificationSalesPopover />

                  {/* Avatar + Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded-full p-0 outline-none focus:ring-0">
                      <Avatar className="h-9 w-9 ring-2 ring-primary/40 ring-offset-2 ring-offset-background">
                        <AvatarImage src={userAvatarUrl || "/placeholder-user.jpg"} alt="User Avatar" />
                        <AvatarFallback>{userName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-56 rounded-xl border border-border/60 bg-background/95 p-2 shadow-[0_0_60px_rgba(0,0,0,0.65)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
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
            </div>

            {/* CONTEÚDO rolável */}
            <div className="relative flex-1 overflow-auto">
              {/* Fundo de luxo com glow suave */}
              <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
                <div className="absolute -top-40 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
              </div>

              <div className="mx-auto flex h-full max-w-6xl flex-col gap-8 px-4 py-8 lg:px-6">
                {/* Cabeçalho da página */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                      <span className="h-px w-6 bg-primary/50" />
                      Central de suporte
                    </p>
                    <h1 className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-2xl font-semibold text-transparent md:text-3xl">
                      Como podemos te ajudar hoje, {userName || "parceiro"}?
                    </h1>
                    <p className="max-w-xl text-sm text-muted-foreground">
                      Fale diretamente com nosso time pelo WhatsApp, acesse os termos oficiais da plataforma
                      e tire dúvidas rápidas nas perguntas frequentes.
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground md:items-end">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                      Tempo médio de resposta: 30 minutos
                    </span>
                    <span className="text-[11px]">
                      Segunda à sexta: <span className="font-medium text-foreground">09h às 18h</span> ·
                      Sábados: <span className="font-medium text-foreground">09h às 16h</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Coluna Esquerda - Entre em contato + Termos */}
                  <div className="space-y-6">
                    {/* Card WhatsApp - vidro sem neon de fundo */}
                    <Card className="group relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background/80 to-background/40 shadow-[0_0_40px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/60">
                      <CardHeader className="relative space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
                            <ShieldCheck className="h-4 w-4 text-emerald-300" />
                          </span>
                          Suporte direto no WhatsApp
                        </CardTitle>
                        <CardDescription className="text-xs text-emerald-100/80">
                          Canal prioritário para alunos e assinantes da plataforma.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative space-y-6">
                        <div className="text-center">
                          <Button
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-10 py-3 text-base font-semibold text-emerald-950 shadow-[0_0_40px_rgba(16,185,129,0.65)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(16,185,129,0.85)]"
                            onClick={() => window.open("https://wa.me/5577981610058", "_blank")}
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                            </svg>
                            Falar com suporte
                          </Button>
                        </div>
                        <div className="space-y-1 text-center text-xs text-emerald-50/80">
                          <p>Canal exclusivo para dúvidas sobre acesso, pagamentos e uso da plataforma.</p>
                          <p className="text-[11px] text-emerald-100/70">
                            Respostas mais rápidas em horário comercial.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cards de Termos e Política */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Card className="group cursor-pointer overflow-hidden border border-white/10 bg-background/70 shadow-[0_0_30px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-primary/60">
                        <Link href="/legal/terms-of-use" className="block p-4">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-0 pb-2 pt-0">
                            <CardTitle className="text-sm font-medium">
                              Termos de Uso
                            </CardTitle>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                              <BookText className="h-3.5 w-3.5 text-primary/80" />
                            </div>
                          </CardHeader>
                          <CardContent className="px-0 pb-0">
                            <CardDescription className="text-xs text-muted-foreground">
                              Leia as regras oficiais de uso da plataforma e das funcionalidades Bleck&apos;s.
                            </CardDescription>
                          </CardContent>
                        </Link>
                      </Card>

                      <Card className="group cursor-pointer overflow-hidden border border-white/10 bg-background/70 shadow-[0_0_30px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/60">
                        <Link href="/legal/privacy-policy" className="block p-4">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-0 pb-2 pt-0">
                            <CardTitle className="text-sm font-medium">
                              Política de Privacidade
                            </CardTitle>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                            </div>
                          </CardHeader>
                          <CardContent className="px-0 pb-0">
                            <CardDescription className="text-xs text-muted-foreground">
                              Entenda como seus dados são protegidos, armazenados e utilizados com segurança.
                            </CardDescription>
                          </CardContent>
                        </Link>
                      </Card>
                    </div>
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-6">
                    {/* Contatos */}
                    <Card className="overflow-hidden border border-white/10 bg-background/80 shadow-[0_0_60px_rgba(0,0,0,0.65)] backdrop-blur-xl">
                      <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-sky-400/40 bg-sky-400/10">
                            <Mail className="h-4 w-4 text-sky-300" />
                          </span>
                          Contatos oficiais
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Canais diretos para falar com o time Bleck&apos;s.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Email
                          </h3>
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-slate-100">
                                blecks.com.br@gmail.com
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 shrink-0 rounded-full border border-white/10 hover:bg-white/10"
                              onClick={() => window.open("mailto:blecks.com.br@gmail.com", "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Clique para abrir seu cliente de e-mail padrão.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Instagram
                          </h3>
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
                            <div className="flex items-center gap-2 text-sm">
                              <Instagram className="h-4 w-4 text-pink-400" />
                              <span className="font-medium text-slate-100">
                                @blecks.combr
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 shrink-0 rounded-full border border-white/10 hover:bg-white/10"
                              onClick={() => window.open("https://instagram.com/blecks.combr", "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Conteúdos, avisos e bastidores da plataforma.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Perguntas Frequentes */}
                    <Card className="overflow-hidden border border-white/10 bg-background/80 shadow-[0_0_60px_rgba(0,0,0,0.65)] backdrop-blur-xl">
                      <CardHeader className="space-y-1">
                        <CardTitle className="text-lg">Perguntas frequentes</CardTitle>
                        <CardDescription className="text-xs">
                          Dúvidas rápidas que podem ser resolvidas sem falar com o suporte.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                          <h3 className="mb-1.5 text-sm font-semibold">
                            Como posso alterar minha senha?
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Acesse o menu de <span className="font-medium">Perfil</span> no topo da
                            plataforma e selecione a opção{" "}
                            <span className="font-medium">&quot;Alterar senha&quot;</span>. Você vai receber
                            instruções por e-mail.
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                          <h3 className="mb-1.5 text-sm font-semibold">
                            Como exportar meus dados?
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Em cada módulo existe um botão de{" "}
                            <span className="font-medium">Exportar</span> no canto superior direito. Basta
                            filtrar o período desejado e gerar o relatório.
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                          <h3 className="mb-1.5 text-sm font-semibold">
                            Posso usar o sistema offline?
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Algumas telas podem ser visualizadas offline, mas{" "}
                            <span className="font-medium">
                              qualquer sincronização de dados exige conexão com a internet
                            </span>
                            . Para garantir que nada se perca, mantenha-se online ao cadastrar ou atualizar
                            informações.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
            {/* fim CONTEÚDO rolável */}
          </div>
          {/* fim wrapper principal */}
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
