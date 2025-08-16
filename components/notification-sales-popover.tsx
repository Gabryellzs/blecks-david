"use client"

import { AvatarImage } from "@/components/ui/avatar"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Bell, Clock, DollarSign } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useGatewayTransactions } from "@/lib/gateway-transactions-service"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useNotification } from "@/components/notification-provider"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

// Importar tipos de gateway para mapeamento de logos
import type { PaymentGatewayType } from "@/lib/payment-gateway-types"

// Mapeamento de logos de gateway
const gatewayLogos: Record<PaymentGatewayType, string> = {
  kirvano: "/images/gateway-logos/kirvano.png",
  ticto: "/placeholder.svg?height=24&width=24",
  hotmart: "/placeholder.svg?height=24&width=24",
  monetizze: "/images/gateway-logos/monetizze.png",
  eduzz: "/images/gateway-logos/eduzz.jpeg",
  pepper: "/images/gateway-logos/pepper.png",
  braip: "/images/gateway-logos/braip.jpeg",
  lastlink: "/images/gateway-logos/lastlink.png",
  disrupty: "/images/gateway-logos/disrupty.png",
  perfectpay: "/images/gateway-logos/perfectpay.jpeg",
  goatpay: "/images/gateway-logos/goatpay.jpeg",
  tribopay: "/images/gateway-logos/tribopay.jpeg",
  cakto: "/images/gateway-logos/cakto.png",
  unknown: "/placeholder.svg?height=24&width=24",
}

// Helper function to format values as currency with 2 decimal places
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const LAST_VIEWED_KEY = "last_viewed_sales_notifications"

export function NotificationSalesPopover() {
  const { transactions } = useGatewayTransactions()
  const { addNotification } = useNotification()
  const [lastViewedTimestamp, setLastViewedTimestamp] = React.useState<number>(0)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const notifiedSaleIds = React.useRef<Set<string>>(new Set())

  // Verificar usuário autenticado
  React.useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("🔔 [SALES] 🔍 Verificando autenticação...")

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.error("🔔 [SALES] ❌ Erro na autenticação:", error)
          setCurrentUser(null)
          return
        }

        console.log("🔔 [SALES] 👤 Usuário encontrado:", user?.id || "Nenhum usuário")
        console.log("🔔 [SALES] 📧 Email do usuário:", user?.email || "Sem email")
        setCurrentUser(user)
      } catch (error) {
        console.error("🔔 [SALES] ❌ Erro inesperado na verificação:", error)
        setCurrentUser(null)
      }
    }

    checkUser()

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔔 [SALES] 🔄 Mudança na autenticação:", event)
      console.log("🔔 [SALES] 👤 Nova sessão:", session?.user?.id || "Sem usuário")
      setCurrentUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Carregar o timestamp da última visualização
  React.useEffect(() => {
    const loadLastViewed = async () => {
      if (!currentUser?.id) return

      try {
        console.log("🔔 [SALES] Carregando última visualização do Supabase...")

        // Buscar no Supabase primeiro
        const { data, error } = await supabase
          .from("user_notification_settings")
          .select("last_sales_viewed")
          .eq("user_id", currentUser.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("🔔 [SALES] Erro ao buscar última visualização:", error)
          return
        }

        if (data?.last_sales_viewed) {
          const timestamp = new Date(data.last_sales_viewed).getTime()
          console.log("🔔 [SALES] Última visualização encontrada no Supabase:", new Date(timestamp))
          setLastViewedTimestamp(timestamp)
          // Sincronizar com localStorage
          localStorage.setItem(LAST_VIEWED_KEY, timestamp.toString())
        } else {
          // Fallback para localStorage se não houver no Supabase
          const storedTimestamp = localStorage.getItem(LAST_VIEWED_KEY)
          if (storedTimestamp) {
            const timestamp = Number.parseInt(storedTimestamp, 10)
            console.log("🔔 [SALES] Usando timestamp do localStorage:", new Date(timestamp))
            setLastViewedTimestamp(timestamp)
          }
        }
      } catch (error) {
        console.error("🔔 [SALES] Erro ao carregar última visualização:", error)
      }
    }

    loadLastViewed()
  }, [currentUser])

  // Filtrar apenas transações concluídas e com created_at válido
  const completedSales = React.useMemo(() => {
    const sales = transactions.filter((t) => t.status === "completed" && t.created_at)
    console.log("🔔 [SALES] Total de vendas concluídas:", sales.length)
    return sales
  }, [transactions])

  // Separar vendas em "novas" e "anteriores" com base no lastViewedTimestamp
  const newSales = React.useMemo(() => {
    const lastViewedDate = new Date(lastViewedTimestamp)
    const sales = completedSales
      .filter((sale) => {
        const saleDate = new Date(sale.created_at)
        return saleDate > lastViewedDate
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log("🔔 [SALES] Vendas novas:", sales.length)
    return sales
  }, [completedSales, lastViewedTimestamp])

  const previousSales = React.useMemo(() => {
    const lastViewedDate = new Date(lastViewedTimestamp)
    const sales = completedSales
      .filter((sale) => {
        const saleDate = new Date(sale.created_at)
        return saleDate <= lastViewedDate
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log("🔔 [SALES] Vendas anteriores:", sales.length)
    return sales
  }, [completedSales, lastViewedTimestamp])

  const unreadCount = newSales.length

  // Disparar notificações para novas vendas
  React.useEffect(() => {
    newSales.forEach((sale) => {
      if (!notifiedSaleIds.current.has(sale.id)) {
        const displayAmount = sale.net_amount || 0
        const gatewayLogoPath = gatewayLogos[sale.gateway_id as PaymentGatewayType] || gatewayLogos.unknown
        const gatewayName = sale.gateway_id
          ? sale.gateway_id.charAt(0).toUpperCase() + sale.gateway_id.slice(1)
          : "Desconhecida"

        console.log(
          "🔔 [SALES] Disparando notificação para venda:",
          sale.id,
          gatewayName,
          formatCurrency(displayAmount),
        )

        addNotification({
          title: `Nova Venda Aprovada na ${gatewayName}!`,
          message: `Sua comissão: ${formatCurrency(displayAmount)}`,
          type: "sales",
          category: "sales",
          icon: (
            <Image
              src={gatewayLogoPath || "/placeholder.svg"}
              alt={`${gatewayName} Logo`}
              width={24}
              height={24}
              className="rounded-full"
            />
          ),
          playSound: true,
        })
        notifiedSaleIds.current.add(sale.id)
      }
    })
  }, [newSales, addNotification])

  // Função para marcar como visualizado no Supabase
  const markAsViewedInSupabase = async (timestamp: number) => {
    if (!currentUser?.id) {
      console.log("🔔 [SALES] ⚠️ Usuário não autenticado, não salvando no Supabase")
      console.log("🔔 [SALES] 🔍 Estado do currentUser:", currentUser)
      return false
    }

    try {
      console.log("🔔 [SALES] 🔍 Marcando como visualizado no Supabase...")
      console.log("🔔 [SALES] ⏰ Timestamp:", new Date(timestamp))
      console.log("🔔 [SALES] 👤 Usuário ID:", currentUser.id)
      console.log("🔔 [SALES] 📧 Email:", currentUser.email)

      // Verificar se ainda está autenticado antes do upsert
      const {
        data: { user: currentAuthUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !currentAuthUser) {
        console.error("🔔 [SALES] ❌ Usuário não está mais autenticado:", authError)
        return false
      }

      console.log("🔔 [SALES] ✅ Confirmado: usuário ainda autenticado")

      const { data, error } = await supabase
        .from("user_notification_settings")
        .upsert(
          {
            user_id: currentUser.id,
            last_sales_viewed: new Date(timestamp).toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        )
        .select()

      if (error) {
        console.error("🔔 [SALES] ❌ Erro ao salvar no Supabase:", error)
        console.error("🔔 [SALES] 📊 Detalhes do erro:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        return false
      }

      console.log("🔔 [SALES] ✅ Salvo no Supabase com sucesso!")
      console.log("🔔 [SALES] 📊 Dados salvos:", data)
      return true
    } catch (error) {
      console.error("🔔 [SALES] ❌ Erro inesperado ao salvar no Supabase:", error)
      return false
    }
  }

  // Quando o popover é aberto, marcar como visualizado
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen) {
      console.log("🔔 [SALES] 👁️ Popover aberto - marcando vendas como visualizadas")
      console.log("🔔 [SALES] 🔍 Estado da autenticação:", {
        isAuthenticated: !!currentUser?.id,
        userId: currentUser?.id,
        email: currentUser?.email,
      })

      const now = Date.now()
      setLastViewedTimestamp(now)

      // Salvar no localStorage imediatamente
      localStorage.setItem(LAST_VIEWED_KEY, now.toString())
      console.log("🔔 [SALES] 💾 Salvo no localStorage:", new Date(now))

      // Salvar no Supabase se autenticado
      if (currentUser?.id) {
        console.log("🔔 [SALES] 🚀 Iniciando sincronização com Supabase...")
        const success = await markAsViewedInSupabase(now)
        if (success) {
          console.log("🔔 [SALES] ✅ SYNC de notificações de vendas marcadas como lidas com sucesso!")
        } else {
          console.log("🔔 [SALES] ⚠️ Falha ao sincronizar com Supabase, usando apenas localStorage")
        }
      } else {
        console.log("🔔 [SALES] ⚠️ Usuário não autenticado - pulando sincronização com Supabase")
      }
    }
  }

  console.log("🔔 [SALES] Renderizando popover...")
  console.log("🔔 [SALES] Vendas não lidas:", unreadCount)
  console.log("🔔 [SALES] Usuário autenticado:", !!currentUser?.id)

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="font-bold text-lg">Notificações</h4>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {newSales.length > 0 && (
            <div className="p-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">NOVAS</h5>
              <div className="space-y-3">
                {newSales.map((sale, index) => {
                  const displayAmount = sale.net_amount || 0
                  const gatewayLogoPath = gatewayLogos[sale.gateway_id as PaymentGatewayType] || gatewayLogos.unknown
                  const gatewayName = sale.gateway_id
                    ? sale.gateway_id.charAt(0).toUpperCase() + sale.gateway_id.slice(1)
                    : "Desconhecida"

                  return (
                    <div key={index} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={gatewayLogoPath || "/placeholder.svg"}
                          alt={`${gatewayName} Logo`}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          <DollarSign className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          Venda aprovada na {gatewayName}! Sua comissão:{" "}
                          <span className="font-bold">{formatCurrency(displayAmount)}</span>{" "}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {previousSales.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="p-4">
                <div className="space-y-3">
                  {previousSales.map((sale, index) => {
                    const displayAmount = sale.net_amount || 0
                    const gatewayLogoPath = gatewayLogos[sale.gateway_id as PaymentGatewayType] || gatewayLogos.unknown
                    const gatewayName = sale.gateway_id
                      ? sale.gateway_id.charAt(0).toUpperCase() + sale.gateway_id.slice(1)
                      : "Desconhecida"

                    return (
                      <div key={index} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage
                            src={gatewayLogoPath || "/placeholder.svg"}
                            alt={`${gatewayName} Logo`}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <DollarSign className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            Venda aprovada na {gatewayName}! Sua comissão:{" "}
                            <span className="font-bold">{formatCurrency(displayAmount)}</span>{" "}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {newSales.length === 0 && previousSales.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">Nenhuma notificação de venda encontrada.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
