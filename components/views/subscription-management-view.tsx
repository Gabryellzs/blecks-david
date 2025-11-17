"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  CreditCard,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  ArrowLeft,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ---------- PLANOS REAIS (iguais à página /assinaturas) ----------

type BillingPeriod = "month" | "year"

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  billingPeriod: BillingPeriod
  description: string
  highlight?: string
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "trial_7_days",
    name: "Teste 7 Dias Grátis",
    price: 0,
    billingPeriod: "month",
    description: "Perfeito para começar sua jornada no marketing digital.",
  },
  {
    id: "premium",
    name: "Premium",
    price: 96.99,
    billingPeriod: "month",
    description: "Para profissionais que querem escalar seus resultados.",
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 196.99,
    billingPeriod: "month",
    description: "Solução completa para agências e grandes operações.",
    highlight: "Mais vendido",
  },
  {
    id: "master_black",
    name: "Master Black",
    price: 396.99,
    billingPeriod: "month",
    description: "Para grandes corporações e operações de alto volume.",
  },
]

// ---------- TIPOS ----------

interface SubscriptionInfo {
  planName: string
  status: "active" | "canceled" | "trialing"
  price: number
  currency: "BRL"
  billingPeriod: "month" | "year"
  nextBillingDate: string
  createdAt: string
}

interface CardInfo {
  brand: string
  last4: string
  holderName: string
  expiresAt: string
}

export default function SubscriptionManagementView() {
  const { toast } = useToast()
  const router = useRouter()

  // 🔹 Dados mockados até conectar com Supabase/gateway
  const [subscription] = useState<SubscriptionInfo>({
    planName: "Platinum",
    status: "active",
    price: 196.99,
    currency: "BRL",
    billingPeriod: "month",
    nextBillingDate: "20/11/2025",
    createdAt: "20/10/2025",
  })

  const [card] = useState<CardInfo>({
    brand: "Visa",
    last4: "1234",
    holderName: "GABRYELL SOUZA",
    expiresAt: "08/28",
  })

  const plans = SUBSCRIPTION_PLANS
  const currentPlan =
    plans.find((p) => p.name === subscription.planName) ?? plans[0]

  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlan.id)

  // ---------- AÇÕES ----------

  const handleCancelSubscription = () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso ao final do período já pago."
    )

    if (!confirmed) return

    toast({
      title: "Cancelamento solicitado",
      description: "Sua assinatura será cancelada conforme as regras do plano.",
    })
  }

  const handleChangeCard = () => {
    toast({
      title: "Alterar cartão",
      description: "Abrindo fluxo para atualização do método de pagamento...",
    })
  }

  const handleChangePlan = () => {
    const newPlan = plans.find((p) => p.id === selectedPlanId)
    if (!newPlan) return

    if (newPlan.id === currentPlan.id) {
      toast({
        title: "Você já está nesse plano",
        description:
          "Selecione um plano diferente para alterar sua assinatura.",
      })
      return
    }

    const confirmed = window.confirm(
      `Confirmar mudança para o plano "${newPlan.name}" por R$ ${newPlan.price
        .toFixed(2)
        .replace(".", ",")} / mês?`
    )

    if (!confirmed) return

    toast({
      title: "Solicitação enviada",
      description: `Sua assinatura será atualizada para o plano ${newPlan.name}.`,
    })
  }

  // ---------- STATUS ----------

  const statusLabel =
    subscription.status === "active"
      ? "Ativa"
      : subscription.status === "trialing"
      ? "Em teste"
      : "Cancelada"

  const statusVariant =
    subscription.status === "active"
      ? "default"
      : subscription.status === "trialing"
      ? "outline"
      : "destructive"

  // ---------- UI ----------

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* ---------- Botão de VOLTAR ---------- */}
      <div className="flex items-center mb-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/70 hover:text-white transition text-sm"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
      </div>

      {/* ---------- Cabeçalho elegante ---------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
              Assinatura BLECK&apos;s
            </span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white/90">
              Minha Assinatura
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Visualize seu plano atual, forma de pagamento e gerencie sua
              continuidade na plataforma.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <Badge
            className="w-fit px-3 py-1 text-xs md:text-sm shadow-sm"
            variant={statusVariant as any}
          >
            {statusLabel}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock size={14} />
            <span>Membro desde {subscription.createdAt}</span>
          </div>
        </div>
      </div>

      {/* ---------- GRID PRINCIPAL ---------- */}
      <div className="grid gap-6 md:grid-cols-3 items-start">

        {/* COLUNA ESQUERDA */}
        <div className="space-y-4 md:col-span-2">

          {/* ---------- PLANO ATUAL ---------- */}
          <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />

            <CardHeader className="relative pb-3">
              <CardTitle className="flex items-center justify-between text-white/90">
                <span className="flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-400" />
                  <span className="text-base md:text-lg">Plano Atual</span>
                </span>
                <span className="text-xs md:text-sm font-normal text-white/60">
                  Renovação automática
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="relative space-y-5">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1.5 max-w-md">
                  <p className="text-lg md:text-xl font-semibold text-white tracking-tight">
                    {subscription.planName}
                  </p>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {currentPlan.description}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-3xl font-semibold text-white leading-none">
                    R$ {subscription.price.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-white/50">
                    {subscription.billingPeriod === "month"
                      ? "por mês"
                      : "por ano"}
                  </p>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-white/70 flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-400" />
                    Próxima cobrança em{" "}
                    <span className="font-medium text-white">
                      {subscription.nextBillingDate}
                    </span>
                  </p>
                  <p className="text-xs text-white/50">
                    A cobrança é feita automaticamente no cartão cadastrado, até
                    que você cancele.
                  </p>
                </div>
                <div className="text-xs text-white/40 md:text-right">
                  Você pode alterar o cartão ou mudar de plano a qualquer
                  momento.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ---------- TROCAR DE PLANO ---------- */}
          <Card className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-white/90 text-base">
                <span className="flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-sky-400" />
                  <span>Trocar de plano</span>
                </span>
                <span className="text-[11px] text-white/50">
                  Use um dos 4 planos reais
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-xs text-white/60">
                Os planos abaixo são os mesmos exibidos na página de
                Assinaturas.  
                A alteração será aplicada na próxima cobrança.
              </p>

              <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-center">
                <div>
                  <Select
                    value={selectedPlanId}
                    onValueChange={(value) => setSelectedPlanId(value)}
                  >
                    <SelectTrigger className="w-full bg-black/60 border-white/15 text-white text-sm">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/15">
                      {plans.map((plan) => (
                        <SelectItem
                          key={plan.id}
                          value={plan.id}
                          className="text-sm text-white/90"
                        >
                          <div className="flex flex-col">
                            <span>
                              {plan.name}
                              {plan.highlight ? ` · ${plan.highlight}` : ""}
                            </span>
                            <span className="text-[11px] text-white/50">
                              R$ {plan.price.toFixed(2).replace(".", ",")} / mês
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-[11px] text-white/45">
                    O valor será ajustado automaticamente na próxima cobrança.
                  </p>
                </div>

                <div className="flex md:justify-end">
                  <Button
                    className="w-full md:w-auto h-10 px-4 text-xs md:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:-translate-y-[1px]"
                    onClick={handleChangePlan}
                  >
                    Confirmar alteração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------- COLUNA DIREITA ---------- */}
        <div className="space-y-4">

          {/* ---------- CARTÃO ---------- */}
          <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/90 text-base flex items-center gap-2">
                <CreditCard size={16} className="text-sky-400" />
                <span>Forma de Pagamento</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="text-white/70 text-xs uppercase tracking-[0.14em]">
                  Cartão cadastrado
                </p>
                <p className="text-sm font-medium text-white">
                  {card.brand} •••• {card.last4}
                </p>
                <p className="text-xs text-white/60">
                  Titular: {card.holderName}
                </p>
                <p className="text-xs text-white/60">
                  Validade: {card.expiresAt}
                </p>
              </div>

              <Button
                className="w-full h-10 text-xs md:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:-translate-y-[1px]"
                onClick={handleChangeCard}
              >
                Alterar cartão
              </Button>
            </CardContent>
          </Card>

          {/* ---------- CANCELAMENTO ---------- */}
          <Card className="rounded-2xl border border-red-900/60 bg-black/50 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.75)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/90 text-base flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                <span>Cancelar Assinatura</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-xs text-white/60 leading-relaxed">
                Ao cancelar, você mantém o acesso até o final do período já
                pago. Depois disso, o acesso será bloqueado e a cobrança
                interrompida.
              </p>

              <Button
                variant="destructive"
                className="w-full h-10 text-xs md:text-sm font-medium shadow-[0_0_30px_rgba(239,68,68,0.25)] hover:shadow-[0_0_40px_rgba(239,68,68,0.45)] transition-shadow"
                onClick={handleCancelSubscription}
              >
                Cancelar assinatura
              </Button>

              <p className="text-[11px] text-white/35">
                Essa ação pode ser revertida apenas contratando um novo plano.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
