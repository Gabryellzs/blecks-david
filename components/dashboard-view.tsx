"use client"
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase" // ✅ ajuste se seu caminho for diferente

// =============================
// TIPOS DA TABELA (conforme seu schema confirmado)
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
  | string

export interface GatewayTransaction {
  id: string
  user_id: string | null
  transaction_id: string | null
  gateway_id: string | null
  amount: number | null
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
  grossApproved: number
  netApproved: number
  feesTotal: number
  refundsTotal: number
  chargebacksTotal: number
  abandonedTotal: number
  countApproved: number
}

const okStatus = new Set(["approved", "paid", "succeeded"])

function calcKpis(rows: GatewayTransaction[]): KpiTotals {
  let grossApproved = 0
  let netApproved = 0
  let feesTotal = 0
  let refundsTotal = 0
  let chargebacksTotal = 0
  let abandonedTotal = 0
  let countApproved = 0

  for (const r of rows) {
    const eventType = (r.event_type || "").toLowerCase()
    const status = (r.status || "").toLowerCase()

    if (okStatus.has(status) && !["refund", "chargeback", "checkout_abandonment"].includes(eventType)) {
      grossApproved += Number(r.amount || 0)
      netApproved += Number(r.net_amount ?? r.amount ?? 0) - Number(r.fee || 0)
      countApproved += 1
    }

    feesTotal += Number(r.fee || 0)

    if (eventType === "refund") refundsTotal += Math.abs(Number(r.net_amount ?? r.amount ?? 0))
    if (eventType === "chargeback") chargebacksTotal += Math.abs(Number(r.net_amount ?? r.amount ?? 0))

    if (eventType === "checkout_abandonment") {
      abandonedTotal += Number(r.product_price || 0)
    }
  }

  return { grossApproved, netApproved, feesTotal, refundsTotal, chargebacksTotal, abandonedTotal, countApproved }
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

    if (userId) q.eq("user_id", userId)
    if (from) q.gte("created_at", from)
    if (to) q.lt("created_at", to)
    if (search && search.trim()) {
      q.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,product_name.ilike.%${search}%`)
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
          if (userId && row.user_id !== userId) return
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
// SEU LAYOUT – adaptado para aceitar dados do Supabase nos slots
// =============================

/** ================= PROPS ORIGINAIS + FILTRO KPI ================= */
export type CardRenderer =
  | React.ReactNode
  | ((slotId: string, ctx?: ReturnType<typeof useGatewayKpis>) => React.ReactNode)

export type CardContentMap = Record<string, CardRenderer>
export type VisibleSlotsMap = Record<string, boolean>
export type LayoutOverride = { w?: number; h?: number }
export type LayoutOverridesMap = Record<string, LayoutOverride>

interface DashboardProps {
  userName?: string
  salesByPlatform?: SalesByPlatform
  onRefresh?: () => Promise<void> | void
  /** Conteúdo por slot (ex.: { "top-1": <ValorLiquidoCard/> }) */
  cardContent?: CardContentMap
  /** Liga/desliga slots (ex.: { "top-1": true, "b3": false }) */
  visibleSlots?: VisibleSlotsMap
  /** Sobrescreve tamanho de slots (ex.: { "top-1": { w:4, h:2 } }) */
  layoutOverrides?: LayoutOverridesMap
  /** Se true, esconde o donut padrão do slot "big-donut" quando vazio */
  hideDefaultDonut?: boolean
  /** ✅ Novo: filtro para buscar KPIs direto do Supabase */
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

/** =============== LAYOUT BASE (fixo) =============== */
const CARDS: AutoCard[] = [
  { id: "top-1", w: 3, h: 2, effect: "neonTop", glow: "#00f7ff" },
  { id: "top-2", w: 3, h: 2, effect: "neonTop", glow: "#00f7ff" },
  { id: "top-3", w: 3, h: 2, effect: "neonTop", glow: "rgba(3, 144, 245, 1)" },
  { id: "top-4", w: 3, h: 2, effect: "neonTop", glow: "#008ffcff" },

  { id: "big-donut", w: 5, h: 6, kind: "donut", effect: "neonTop", glow: "#0d2de3ff" },

  { id: "r1",  w: 3, h: 2, effect: "neonTop", glow: "#22d3ee" }, 
  { id: "r2",  w: 2, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "r3",  w: 3, h: 2, effect: "neonTop", glow: "#00e5ffff" },
  { id: "r4",  w: 2, h: 2, effect: "neonTop", glow: "#60a5fa" },
  { id: "r5",  w: 2, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "r6",  w: 2, h: 2, effect: "neonTop", glow: "#00bbffff" },

  { id: "b1",  w: 3, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b2",  w: 2, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b3",  w: 2, h: 2, effect: "neonTop", glow: "#f59e0b" },
  { id: "b4",  w: 3, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b5",  w: 3, h: 2, effect: "neonTop", glow: "#ee5706ff" },
  { id: "b6",  w: 3, h: 2, effect: "neonTop", glow: "#a855f7" },
  { id: "b7",  w: 3, h: 2, effect: "neonTop", glow: "#a855f7" },
  { id: "b8",  w: 3, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "b9",  w: 3, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "b10", w: 3, h: 2, effect: "neonTop", glow: "#10b981" },
  { id: "b11", w: 3, h: 2, effect: "neonTop", glow: "#c81331ff" },
]

export const CARDS_IDS = CARDS.map(c => c.id)

/** ================= UTIL: classe do neon ================= */
function neonClass(effect?: AutoCard["effect"]) {
  switch (effect) {
    case "neon":    return "neon-card"
    case "neonTop": return "neon-card neon-top"
    case "neonGold":return "neon-card neon-top neon-gold"
    default:        return "neon-card"
  }
}

/** ================== BLOCO GENÉRICO ==================== */
function Block({ className = "", style, children }: React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) {
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

/** ============== PLACEHOLDER QUANDO NÃO TEM CARD ============== */
function Placeholder({ slotId }: { slotId: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-xs text-white/60 select-none">
      {slotId}
    </div>
  )
}

/** ============== DONUT (padrão do layout) ===================== */
function Badge({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 rounded-lg border border-white/30 text-white/80 text-xs tracking-wide">
      {label}
    </span>
  )
}

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
      <svg width={R * 2 + 28} height={R * 2 + 28} viewBox={`0 0 ${R * 2 + 28} ${R * 2 + 28}`}>
        <g transform={`translate(${14 + R}, ${14 + R})`}>
          <circle r={R} fill="none" stroke="rgba(119, 119, 119, 0.97)" strokeWidth={12} />
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
                style={{ transition: "stroke-dashoffset 600ms ease" }}
              />
            )
            offset += len
            return el
          })}
        </g>
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {entries.map(([name]) => <Badge key={name} label={name} />)}
      </div>
    </div>
  )
}

// ==============================================
// DASHBOARD VIEW (agora com dados do Supabase)
// ==============================================
export default function DashboardView({
  salesByPlatform = {
    Cakto: 0, Kirvano: 0, Pepper: 0, Kiwify: 0, Hotmart: 0, Monetizze: 0, Eduzz: 0, Braip: 0, Lastlink: 0,
  },
  onRefresh,
  cardContent,
  visibleSlots,
  layoutOverrides,
  hideDefaultDonut,
  kpiFilter,
}: DashboardProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tick, setTick] = useState(0)

  // ✅ Busca dados do Supabase para usar nos slots
  const data = useGatewayKpis(
    kpiFilter ?? {
      // default: hoje
      from: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      to: new Date(new Date(new Date().setHours(0,0,0,0)).getTime() + 24*60*60*1000).toISOString(),
    }
  )

  // ✅ Conteúdo padrão: sem card interno (só textos / ou gráfico)
  const defaultContent: CardContentMap = {
    "top-1": (_slotId, ctx) => {
      const loading = ctx?.loading
      const value = ctx?.kpis.grossApproved ?? 0
      const formatted = loading ? "…" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      return (
        <div className="p-3">
          <div className="text-xs text-white/70 mb-3">Receita Total</div>
          <div className="text-2xl font-semibold">{formatted}</div>
        </div>
      )
    },
    "top-2": (_slotId, ctx) => {
      const loading = ctx?.loading
      const value = ctx?.kpis.countApproved ?? 0
      const formatted = loading ? "…" : value.toLocaleString("pt-BR")
      return (
        <div className="p-3">
          <div className="text-xs text-white/70 mb-3">Vendas</div>
          <div className="text-2xl font-semibold">{formatted}</div>
        </div>
      )
    },
    "top-3": (_slotId, ctx) => {
      const loading = ctx?.loading
      const value = ctx?.kpis.refundsTotal ?? 0
      const formatted = loading ? "…" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      return (
        <div className="p-3">
          <div className="text-xs text-white/70 mb-2">Reembolsos</div>
          <div className="text-2xl font-semibold">{formatted}</div>
        </div>
      )
    },
    "top-4": (_slotId, ctx) => {
      const loading = ctx?.loading
      const value = ctx?.kpis.chargebacksTotal ?? 0
      const formatted = loading ? "…" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      return (
        <div className="p-3">
          <div className="text-xs text-white/70 mb-2">Chargebacks</div>
          <div className="text-2xl font-semibold">{formatted}</div>
        </div>
      )
    },
    // ✅ big-donut = Distribuição por Gateway (bruto aprovado por gateway)
    "big-donut": (_slotId, ctx) => {
      const rows = ctx?.rows ?? []
      // Agrupa apenas vendas aprovadas (exclui refund/chargeback/abandonment)
      const map: SalesByPlatform = {}
      for (const r of rows) {
        const eventType = (r.event_type || "").toLowerCase()
        const status = (r.status || "").toLowerCase()
        if (okStatus.has(status) && !["refund", "chargeback", "checkout_abandonment"].includes(eventType)) {
          const key = (r.gateway_id || "Outro")
          map[key] = (map[key] || 0) + Number(r.amount || 0)
        }
      }
      return <DonutChart salesByPlatform={map} />
    },
  }

  const effectiveCards = useMemo(() => {
    const v = visibleSlots ?? {}
    const o = layoutOverrides ?? {}
    return CARDS
      .filter(c => v[c.id] !== false)
      .map(c => ({ ...c, ...o[c.id] }))
  }, [visibleSlots, layoutOverrides])

  const rowsNeeded = useMemo(() => {
    const units = effectiveCards.reduce((sum, c) => sum + Math.max(1, Math.min(12, c.w)) * Math.max(1, c.h), 0)
    return Math.max(6, Math.ceil(units / 12) + 1)
  }, [effectiveCards])

  const doRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      await data.refetch()
      if (onRefresh) {
        await onRefresh()
      } else if ("refresh" in router) {
        router.refresh()
      } else {
        setTick(t => t + 1)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, router, data])

  return (
    <div className="px-4 md:px-8 pt-2 md:pt-3 pb-0 overflow-hidden" style={{ height: `calc(100vh - ${HEADER_H}px)` }}>
      {/* Botão Atualizar */}
      <div className="mb-2 flex justify-end">
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
          style={{ backgroundColor: "rgba(0,0,0,0.4)" as any, ["--gw" as any]: "#505555ff" }}
        >
          {isRefreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* GRID */}
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
          const style: React.CSSProperties & { ["--gw"]?: string } = {
            gridColumn: `auto / span ${Math.max(1, Math.min(12, card.w))}`,
            gridRow: `auto / span ${Math.max(1, card.h)}`,
            ...(card.glow ? { ["--gw"]: card.glow } : {}),
          }

          // ✅ Mescla conteúdo padrão com conteúdo custom
          const sourceMap = { ...(defaultContent || {}), ...(cardContent || {}) }
          const plug = sourceMap[card.id]
          let content: React.ReactNode | null = null

          if (typeof plug === "function") {
            // @ts-ignore — passamos (slotId, data) para funções de render
            content = plug.length >= 2 ? (plug as any)(card.id, data) : (plug as any)(card.id)
          } else {
            content = plug ?? null
          }

          const fallback =
            card.kind === "donut" && !hideDefaultDonut
              ? <DonutChart salesByPlatform={salesByPlatform} />
              : <Placeholder slotId={card.id} />

          return (
            <Block key={`${card.id}-${idx}`} className={cls} style={style}>
              {content ?? fallback}
            </Block>
          )
        })}
      </div>
    </div>
  )
}
