"use client"

import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type CSSProperties,
} from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase" // ajuste se o caminho for diferente

// =============================
// TIPOS DA TABELA (confirmado)
// =============================
export type GatewayEventType =
  | "sale"
  | "payment"
  | "purchase"
  | "refund"
  | "chargeback"
  | "checkout_abandonment"
  | string

export type GatewayStatus =
  | "approved"
  | "paid"
  | "succeeded"
  | "pending"
  | "refunded"
  | "canceled"
  | "success"
  | "completed"
  | "complete"
  | "captured"
  | "settled"
  | "done"
  | "ok"
  | string

export interface GatewayTransaction {
  id: string
  user_id: string | null
  transaction_id: string | null
  gateway_id: string | null
  amount: number | null          // assumindo que ESTE é o valor bruto oficial
  currency: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  product_name: string | null
  payment_method: string | null
  fee: number | null
  net_amount: number | null
  event_type: GatewayEventType | null
  status: GatewayStatus | null
  raw_payload: any | null
  created_at: string
  updated_by: string | null
  fees: number | null
  updated_at: string | null
  product_price: number | null
}

export type SalesByPlatform = Record<string, number>

// =============================
// KPI MATH
// =============================
export type KpiTotals = {
  grossApproved: number   // Receita Total (bruto)
  netApproved: number     // valor líquido depois de taxa
  feesTotal: number       // soma de taxas
  refundsTotal: number
  chargebacksTotal: number
  abandonedTotal: number
  countApproved: number   // nº vendas válidas
}

// status que significam "pago" / "ok"
const approvedStatusList = [
  "approved",
  "paid",
  "succeeded",
  "success",
  "completed",
  "complete",
  "captured",
  "settled",
  "done",
  "ok",
]

// eventos que NÃO são venda normal
const nonSaleEvents = [
  "refund",
  "chargeback",
  "charge_back",
  "checkout_abandonment",
  "abandoned",
  "abandonment",
]

// normaliza string
function norm(v: string | null | undefined) {
  return (v || "").toLowerCase().trim()
}

/**
 * getMoney(r)
 *
 * ESTE é o ponto que faz a Receita Total bater com sua dashboard Gateways.
 * Estamos usando only `amount` como valor bruto.
 *
 * Se precisar usar outro campo, troca aqui:
 * - se o oficial for net_amount:  const raw = r.net_amount ?? 0
 * - se for product_price:        const raw = r.product_price ?? 0
 *
 * Se o gateway salva em centavos, descomenta o `/100`.
 */
function getMoney(r: GatewayTransaction) {
  const raw = r.amount ?? 0
  const num = Number(raw) || 0

  // Se vier em centavos, use:
  // return num / 100

  return num
}

// calcula KPIs
function calcKpis(rows: GatewayTransaction[]): KpiTotals {
  let grossApproved = 0
  let netApproved = 0
  let feesTotal = 0
  let refundsTotal = 0
  let chargebacksTotal = 0
  let abandonedTotal = 0
  let countApproved = 0

  for (const r of rows) {
    const eventType = norm(r.event_type)
    const status = norm(r.status)

    const isClearlyRefund =
      eventType.includes("refund") || status.includes("refund")

    const isClearlyChargeback =
      eventType.includes("charge") && eventType.includes("back")

    const isAbandoned = eventType.includes("abandon")

    const seemsPaidStatus =
      approvedStatusList.includes(status) ||
      status === "" // alguns gateways salvam vazio mesmo aprovada

    const isNotBlocked =
      !isClearlyRefund &&
      !isClearlyChargeback &&
      !isAbandoned &&
      !nonSaleEvents.includes(eventType)

    // VENDA / RECEITA BRUTA
    if (isNotBlocked && seemsPaidStatus) {
      const val = getMoney(r)
      if (val > 0) {
        const fee = Number(r.fee || 0)
        const netBase = Number(r.net_amount ?? val)

        grossApproved += val                 // bruto
        netApproved += netBase - fee         // líquido
        countApproved += 1
      }
    }

    // taxas totais
    feesTotal += Number(r.fee || 0)

    // REEMBOLSOS
    if (isClearlyRefund) {
      const val = getMoney(r)
      refundsTotal += Math.abs(val)
    }

    // CHARGEBACK
    if (isClearlyChargeback) {
      const val = getMoney(r)
      chargebacksTotal += Math.abs(val)
    }

    // ABANDONO / NÃO CONCLUÍDA
    if (isAbandoned || eventType.includes("abandon")) {
      abandonedTotal += Number(r.product_price || 0)
    }
  }

  return {
    grossApproved,
    netApproved,
    feesTotal,
    refundsTotal,
    chargebacksTotal,
    abandonedTotal,
    countApproved,
  }
}

// =============================
// HOOK SUPABASE (fetch + realtime)
// =============================
export type KpiFilter = {
  userId?: string
  from?: string // ISO (incl.)
  to?: string   // ISO (excl.)
  search?: string
}

export function useGatewayKpis(filter: KpiFilter) {
  const { userId, from, to, search } = filter
  const [rows, setRows] = useState<GatewayTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  async function fetchAll() {
    setLoading(true)
    setError(null)

    const q = supabase
      .from("gateway_transactions")
      .select(
        "id,user_id,transaction_id,gateway_id,amount,currency,customer_name,customer_email,customer_phone,product_name,payment_method,fee,net_amount,event_type,status,raw_payload,created_at,updated_by,fees,updated_at,product_price"
      )
      .order("created_at", { ascending: false })

    // painel admin geral -> não filtra por userId
    // se quiser filtrar futuro:
    // if (userId) q.eq("user_id", userId)

    if (from) q.gte("created_at", from)
    if (to) q.lt("created_at", to)
    if (search && search.trim()) {
      q.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,product_name.ilike.%${search}%`
      )
    }

    const { data, error } = await q

    if (error) {
      setError(error.message)
      setRows([])
    } else {
      setRows((data || []) as any)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, from, to, search])

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel("gateway_transactions_kpis")

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gateway_transactions" },
        (payload) => {
          const row = payload.new as GatewayTransaction

          // reativar se precisar filtrar por user específico:
          // if (userId && row.user_id !== userId) return

          if (from && row.created_at < from) return
          if (to && row.created_at >= to) return

          setRows((prev) => [row, ...prev])
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "gateway_transactions" },
        (payload) => {
          const row = payload.new as GatewayTransaction
          setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === row.id)
            if (idx === -1) return prev
            const clone = prev.slice()
            clone[idx] = row
            return clone
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [userId, from, to])

  const kpis: KpiTotals = useMemo(() => calcKpis(rows), [rows])

  return { rows, kpis, loading, error, refetch: fetchAll }
}

// =============================
// LAYOUT / DASHBOARD
// =============================

export type CardRenderer =
  | React.ReactNode
  | ((slotId: string, ctx: ReturnType<typeof useGatewayKpis>) => React.ReactNode)

export type CardContentMap = Record<string, CardRenderer>
export type VisibleSlotsMap = Record<string, boolean>
export type LayoutOverride = { w?: number; h?: number }
export type LayoutOverridesMap = Record<string, LayoutOverride>

interface DashboardProps {
  userName?: string
  salesByPlatform?: SalesByPlatform
  onRefresh?: () => Promise<void> | void
  cardContent?: CardContentMap
  visibleSlots?: VisibleSlotsMap
  layoutOverrides?: LayoutOverridesMap
  hideDefaultDonut?: boolean
  kpiFilter?: KpiFilter
}

const HEADER_H = 50
const CARD_RADIUS_PX = 6

type AutoCard = {
  id: string
  w: number
  h: number
  kind?: "donut" | "empty"
  className?: string
  effect?: "neon" | "neonTop" | "neonGold" | "none"
  glow?: string
}

const CARDS: AutoCard[] = [
  { id: "top-1", w: 3, h: 2, effect: "neonTop", glow: "#00f7ff" }, // Receita Total
  { id: "top-2", w: 3, h: 2, effect: "neonTop", glow: "#00f7ff" }, // Vendas
  { id: "top-3", w: 3, h: 2, effect: "neonTop", glow: "rgba(3, 144, 245, 1)" }, // Reembolsos
  { id: "top-4", w: 3, h: 2, effect: "neonTop", glow: "#008ffcff" }, // Chargebacks

  { id: "big-donut", w: 5, h: 6, kind: "donut", effect: "neonTop", glow: "#0d2de3ff" },

  { id: "r1", w: 3, h: 2, effect: "neonTop", glow: "#22d3ee" },
  { id: "r2", w: 2, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "r3", w: 3, h: 2, effect: "neonTop", glow: "#00e5ffff" },
  { id: "r4", w: 2, h: 2, effect: "neonTop", glow: "#60a5fa" },
  { id: "r5", w: 2, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "r6", w: 2, h: 2, effect: "neonTop", glow: "#00bbffff" },

  { id: "b1", w: 3, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b2", w: 2, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b3", w: 2, h: 2, effect: "neonTop", glow: "#f59e0b" },
  { id: "b4", w: 3, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b5", w: 3, h: 2, effect: "neonTop", glow: "#ee5706ff" },
  { id: "b6", w: 3, h: 2, effect: "neonTop", glow: "#a855f7" },
  { id: "b7", w: 3, h: 2, effect: "neonTop", glow: "#a855f7" },
  { id: "b8", w: 3, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "b9", w: 3, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "b10", w: 3, h: 2, effect: "neonTop", glow: "#10b981" },
  { id: "b11", w: 3, h: 2, effect: "neonTop", glow: "#c81331ff" },
]

export const CARDS_IDS = CARDS.map((c) => c.id)

// neon visual class
function neonClass(effect?: AutoCard["effect"]) {
  switch (effect) {
    case "neon":
      return "neon-card"
    case "neonTop":
      return "neon-card neon-top"
    case "neonGold":
      return "neon-card neon-top neon-gold"
    default:
      return "neon-card"
  }
}

// bloco base
function Block({
  className = "",
  style,
  children,
}: React.PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  return (
    <div
      className={[
        `rounded-[${CARD_RADIUS_PX}px]`,
        "border border-white/15 bg-transparent",
        "outline-none focus:outline-none focus:ring-0",
        className,
      ].join(" ")}
      style={style}
    >
      {children}
    </div>
  )
}

// fallback quando não tem card custom
function Placeholder({ slotId }: { slotId: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-xs text-white/60 select-none">
      {slotId}
    </div>
  )
}

// badge usada no donut legend
function Badge({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 rounded-lg border border-white/30 text-white/80 text-xs tracking-wide">
      {label}
    </span>
  )
}

// donut chart
function DonutChart({ salesByPlatform = {} as SalesByPlatform }) {
  const entries = Object.entries(salesByPlatform).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)

  if (total === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-white/55 text-sm">Aguardando vendas...</div>
      </div>
    )
  }

  const R = 110
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <svg
        width={R * 2 + 28}
        height={R * 2 + 28}
        viewBox={`0 0 ${R * 2 + 28} ${R * 2 + 28}`}
      >
        <g transform={`translate(${14 + R}, ${14 + R})`}>
          {/* base cinza */}
          <circle
            r={R}
            fill="none"
            stroke="rgba(119, 119, 119, 0.97)"
            strokeWidth={12}
          />
          {/* fatias */}
          {entries.map(([name, value]) => {
            const len = (value / total) * C
            const el = (
              <circle
                key={name}
                r={R}
                fill="none"
                stroke="white"
                strokeOpacity={0.9}
                strokeWidth={12}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
                style={{
                  transition: "stroke-dashoffset 600ms ease",
                }}
              />
            )
            offset += len
            return el
          })}
        </g>
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {entries.map(([name]) => (
          <Badge key={name} label={name} />
        ))}
      </div>
    </div>
  )
}

// =============================
// DASHBOARD VIEW
// =============================
export default function DashboardView({
  salesByPlatform = {
    Cakto: 0,
    Kirvano: 0,
    Pepper: 0,
    Kiwify: 0,
    Hotmart: 0,
    Monetizze: 0,
    Eduzz: 0,
    Braip: 0,
    Lastlink: 0,
  },
  onRefresh,
  cardContent,
  visibleSlots,
  layoutOverrides,
  hideDefaultDonut,
  kpiFilter,
}: DashboardProps) {
  const router = useRouter()

  // ================= estado único =================
  // período: dia / mês / ano
  const [rangeType, setRangeType] = useState<"day" | "month" | "year">("day")

  // botão atualizar
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tickState, setTickState] = useState(0)

  // calcula intervalo de datas com base no período selecionado
  function getRangeISO(rt: "day" | "month" | "year"): { from: string; to: string } {
    const now = new Date()

    if (rt === "day") {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)

      const end = new Date(start)
      end.setDate(end.getDate() + 1)

      return {
        from: start.toISOString(),
        to: end.toISOString(),
      }
    }

    if (rt === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)

      return {
        from: start.toISOString(),
        to: end.toISOString(),
      }
    }

    // year
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0)

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    }
  }

  const { from, to } = useMemo(() => getRangeISO(rangeType), [rangeType])

  // hook com o range calculado
  const data = useGatewayKpis({
    // userId: kpiFilter?.userId, // se quiser filtrar depois por um dono específico
    search: kpiFilter?.search,
    from,
    to,
  })

  // conteúdo padrão dos cards
  const defaultContent: CardContentMap = {
    "top-1": (_slotId, ctx) => {
      const loading = ctx.loading
      const value = ctx.kpis.grossApproved ?? 0
      const formatted = loading
        ? "…"
        : value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })

      return (
        <div className="p-3">
          <div className="text-xs text-white/70 mb-3">Receita Total</div>
          <div className="text-2xl font-semibold">{formatted}</div>
        </div>
      )
    },

    "top-2": (_slotId, ctx) => {
      const loading = ctx.loading
      const value = ctx.kpis.countApproved ?? 0
      const formatted = loading ? "…" : value.toLocaleString("pt-BR")

      return (
        <div className="p-3">
          <div className="text-xs text-white/70 mb-3">Vendas</div>
          <div className="text-2xl font-semibold">{formatted}</div>
        </div>
      )
    },

    "top-3": (_slotId, ctx) => {
      const loading = ctx.loading
      const value = ctx.kpis.refundsTotal ?? 0
      const formatted = loading
        ? "…"
        : value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })

      return (
        <div className="p-3">
          <div className="text-xs text-white/70 mb-2">Reembolsos</div>
          <div className="text-2xl font-semibold">{formatted}</div>
        </div>
      )
    },

    "top-4": (_slotId, ctx) => {
      const loading = ctx.loading
      const value = ctx.kpis.chargebacksTotal ?? 0
      const formatted = loading
        ? "…"
        : value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })

      return (
        <div className="p-3">
          <div className="text-xs text-white/70 mb-2">Chargebacks</div>
          <div className="text-2xl font-semibold">{formatted}</div>
        </div>
      )
    },

    "big-donut": (_slotId, ctx) => {
      const rows = ctx.rows ?? []
      const map: SalesByPlatform = {}

      for (const r of rows) {
        const eventType = norm(r.event_type)
        const status = norm(r.status)

        const isClearlyRefund =
          eventType.includes("refund") || status.includes("refund")

        const isClearlyChargeback =
          eventType.includes("charge") && eventType.includes("back")

        const isAbandoned = eventType.includes("abandon")

        const seemsPaidStatus =
          approvedStatusList.includes(status) ||
          status === ""

        const isNotBlocked =
          !isClearlyRefund &&
          !isClearlyChargeback &&
          !isAbandoned &&
          !nonSaleEvents.includes(eventType)

        if (isNotBlocked && seemsPaidStatus) {
          const val = getMoney(r)
          if (val > 0) {
            const key = r.gateway_id || "Outro"
            map[key] = (map[key] || 0) + val
          }
        }
      }

      return <DonutChart salesByPlatform={map} />
    },
  }

  // cards visíveis + overrides
  const effectiveCards = useMemo(() => {
    const v = visibleSlots ?? {}
    const o = layoutOverrides ?? {}
    return CARDS.filter((c) => v[c.id] !== false).map((c) => ({
      ...c,
      ...o[c.id],
    }))
  }, [visibleSlots, layoutOverrides])

  // quantas linhas o grid precisa
  const rowsNeeded = useMemo(() => {
    const units = effectiveCards.reduce(
      (sum, c) =>
        sum + Math.max(1, Math.min(12, c.w)) * Math.max(1, c.h),
      0
    )
    return Math.max(6, Math.ceil(units / 12) + 1)
  }, [effectiveCards])

  // botão Atualizar
  const doRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      await data.refetch()
      if (onRefresh) {
        await onRefresh()
      } else if ("refresh" in router) {
        // @ts-ignore
        router.refresh()
      } else {
        setTickState((t) => t + 1)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, router, data])

  return (
    <div
      className="px-4 md:px-8 pt-2 md:pt-3 pb-0 overflow-hidden"
      style={{ height: `calc(100vh - ${HEADER_H}px)` }}
    >
      {/* =====================================================
         TOPO: Período (esq) + Atualizar (dir)
         ===================================================== */}
      <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
        {/* seletor de período */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="rangeType"
            className="text-white/70 text-xs font-medium"
          >
            Período
          </label>

          <select
            id="rangeType"
            value={rangeType}
            onChange={(e) =>
              setRangeType(e.target.value as "day" | "month" | "year")
            }
            className={[
              "bg-black/40 text-white/90 text-xs px-2 py-1 rounded-md",
              "border border-white/20 outline-none focus:ring-0 focus:border-white/40",
              "cursor-pointer",
            ].join(" ")}
            style={{
              minWidth: "90px",
            }}
          >
            <option value="day">Hoje</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </select>

          {/* range atual visível pra conferência */}
          <span className="text-[10px] text-white/40 whitespace-nowrap">
            {new Date(from).toLocaleDateString("pt-BR")} →{" "}
            {new Date(to).toLocaleDateString("pt-BR")}
          </span>
        </div>

        {/* botão atualizar */}
        <button
          onClick={doRefresh}
          disabled={isRefreshing}
          className={[
            "relative inline-flex items-center justify-center px-4 py-2 rounded-md",
            "border border-white/25 text-white/90 font-medium",
            "hover:bg:white/5 active:scale-[0.99]",
            "transition-all disabled:opacity-60",
            "neon-card neon-top no-glow",
          ].join(" ")}
          style={{
            backgroundColor: "rgba(0,0,0,0.4)" as any,
            ["--gw" as any]: "#505555ff",
          }}
        >
          {isRefreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* GRID PRINCIPAL */}
      <div
        className="grid h-[calc(100%-40px)]"
        style={{
          gap: 10,
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gridTemplateRows: `repeat(${rowsNeeded}, 1fr)`,
          gridAutoFlow: "dense",
        }}
      >
        {effectiveCards.map((card, idx) => {
          const cls = neonClass(card.effect)

          const style: CSSProperties & { ["--gw"]?: string } = {
            gridColumn: `auto / span ${Math.max(
              1,
              Math.min(12, card.w)
            )}`,
            gridRow: `auto / span ${Math.max(1, card.h)}`,
            ...(card.glow ? { ["--gw"]: card.glow } : {}),
          }

          // mescla conteúdo default + overrides
          const sourceMap = { ...(defaultContent || {}), ...(cardContent || {}) }
          const plug = sourceMap[card.id]

          // sempre chamamos fun passando ctx (data)
          let content: React.ReactNode | null = null
          if (typeof plug === "function") {
            content = (plug as any)(card.id, data)
          } else {
            content = plug ?? null
          }

          const fallback =
            card.kind === "donut" && !hideDefaultDonut ? (
              <DonutChart salesByPlatform={salesByPlatform} />
            ) : (
              <Placeholder slotId={card.id} />
            )

          return (
            <Block
              key={`${card.id}-${idx}`}
              className={cls}
              style={style}
            >
              {content ?? fallback}
            </Block>
          )
        })}
      </div>
    </div>
  )
}
