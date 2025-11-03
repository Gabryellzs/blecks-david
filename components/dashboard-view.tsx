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
import { supabase } from "@/lib/supabase"

// =============================
// TIPOS / MODELOS DE DADOS
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
  | "cancelled"
  | "failed"
  | "error"
  | "timeout"
  | "success"
  | "completed"
  | "complete"
  | "captured"
  | "settled"
  | "done"
  | "ok"
  | "paid_out"
  | "confirmed"
  | "refused"
  | "rejected"
  | "denied"
  | "declined"
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

// =============================
// KPI TYPES
// =============================
export type KpiFilter = {
  userId?: string
  from?: string // ISO start inclusive
  to?: string // ISO end exclusive
  search?: string
}

export type GatewayKpisLight = {
  receitaTotal: number
  vendas: number
  reembolsosTotal: number
  chargebacksTotal: number
}

// =============================
// HELPERS
// =============================
function norm(v: string | null | undefined) {
  return (v || "").toLowerCase().trim()
}

const APPROVED_STATUS = [
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
  "paid_out",
  "confirmed",
]

const BLOCK_STATUS_PARTIAL = [
  "abandon",
  "abandoned",
  "abandonment",
  "cancel",
  "canceled",
  "cancelled",
  "failed",
  "error",
  "timeout",
  "refused",
  "refuse",
  "rejected",
  "reject",
  "denied",
  "declined",
]

function isApprovedSale(row: GatewayTransaction) {
  const st = norm(row.status)
  const ev = norm(row.event_type)
  const okStatus = APPROVED_STATUS.includes(st)
  if (!okStatus) return false

  for (const bad of BLOCK_STATUS_PARTIAL) {
    if (st.includes(bad) || ev.includes(bad)) return false
  }

  if (st.includes("refund") || ev.includes("refund")) return false
  if (ev.includes("charge") && ev.includes("back")) return false

  return true
}

function isRefund(row: GatewayTransaction) {
  const st = norm(row.status)
  const ev = norm(row.event_type)
  return st.includes("refund") || ev.includes("refund")
}

function isChargeback(row: GatewayTransaction) {
  const ev = norm(row.event_type)
  return ev.includes("charge") && ev.includes("back")
}

// valor bruto da venda
function getBruto(row: GatewayTransaction) {
  const raw = row.amount ?? 0
  const num = Number(raw) || 0
  return num
}

// KPIs gerais da faixa
function calcGatewaySummaryForPeriod(rows: GatewayTransaction[]): GatewayKpisLight {
  let receitaTotal = 0
  let vendas = 0
  let reembolsosTotal = 0
  let chargebacksTotal = 0

  for (const r of rows) {
    if (isApprovedSale(r)) {
      const bruto = getBruto(r)
      if (bruto > 0) {
        receitaTotal += bruto
        vendas += 1
      }
    }

    if (isRefund(r)) {
      reembolsosTotal += Math.abs(getBruto(r))
    }

    if (isChargeback(r)) {
      chargebacksTotal += Math.abs(getBruto(r))
    }
  }

  return {
    receitaTotal,
    vendas,
    reembolsosTotal,
    chargebacksTotal,
  }
}

// soma de receita aprovada por gateway_id (donut)
function calcGatewaySplit(rows: GatewayTransaction[]): Record<string, number> {
  const totals: Record<string, number> = {}

  for (const r of rows) {
    if (!isApprovedSale(r)) continue
    const bruto = getBruto(r)
    if (bruto <= 0) continue

    const key = r.gateway_id || "Outro"
    totals[key] = (totals[key] || 0) + bruto
  }

  return totals
}

// =============================
// HOOK SUPABASE (fetch + realtime)
// =============================
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

    const channel = supabase.channel("gateway_transactions_dashboard")

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gateway_transactions" },
        (payload) => {
          const row = payload.new as GatewayTransaction
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

  const kpis: GatewayKpisLight = useMemo(
    () => calcGatewaySummaryForPeriod(rows),
    [rows]
  )

  return { rows, kpis, loading, error, refetch: fetchAll }
}

// =============================
// DONUT CHART
// =============================
function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)

  if (total === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-black/55 dark:text-white/55 text-sm">
          Aguardando vendas...
        </div>
      </div>
    )
  }

  const OUTER_R = 70
  const STROKE = 28
  const INNER_R = OUTER_R - STROKE
  const C = 2 * Math.PI * OUTER_R
  const BOX = OUTER_R * 2 + STROKE * 2
  const CENTER = OUTER_R + STROKE

  const TOP_CFG = { offsetIn: 2, yAdjust: -14 }
  const BOTTOM_CFG = { offsetIn: 10, yAdjust: 24 }

  function colorForGateway(name: string) {
    const palette = [
      "#00c2ff",
      "#8b5cf6",
      "#10b981",
      "#facc15",
      "#ef4444",
      "#38bdf8",
      "#fb923c",
      "#ec4899",
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (hash + name.charCodeAt(i) * 97) % palette.length
    }
    return palette[hash]
  }

  function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angleDeg: number
  ) {
    const angleRad = (angleDeg * Math.PI) / 180
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    }
  }

  let offsetLen = 0
  const slices: React.ReactNode[] = []
  const labels: React.ReactNode[] = []

  entries.forEach(([name, value]) => {
    const pct = value / total
    const pct100 = pct * 100
    const sliceLen = pct * C

    slices.push(
      <circle
        key={name}
        r={OUTER_R}
        fill="none"
        stroke={colorForGateway(name)}
        strokeWidth={STROKE}
        strokeDasharray={`${sliceLen} ${C - sliceLen}`}
        strokeDashoffset={-offsetLen}
        strokeLinecap="butt"
        transform="rotate(-90)"
        style={{
          transition: "stroke-dashoffset 0.6s ease",
        }}
      />
    )

    const startFrac = offsetLen / C
    const endFrac = (offsetLen + sliceLen) / C
    const midFrac = (startFrac + endFrac) / 2
    const midAngleDeg = midFrac * 360 - 90

    const midPoint = polarToCartesian(
      0,
      0,
      INNER_R + STROKE / 2 - 6,
      midAngleDeg
    )
    const isTopHalf = midPoint.y < 0
    const cfg = isTopHalf ? TOP_CFG : BOTTOM_CFG

    const labelRadius = INNER_R + STROKE / 2 - cfg.offsetIn

    const { x, y } = polarToCartesian(0, 0, labelRadius, midAngleDeg)

    const pctText = pct100.toLocaleString("pt-BR", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })

    labels.push(
      <text
        key={name + "-label"}
        x={x}
        y={y + cfg.yAdjust}
        fill="#ffffff"
        fontSize="12px"
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          paintOrder: "stroke",
          stroke: "rgba(0,0,0,0.75)",
          strokeWidth: 3,
        }}
      >
        {pctText}%
      </text>
    )

    offsetLen += sliceLen
  })

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <svg
        width={BOX}
        height={BOX}
        viewBox={`0 0 ${BOX} ${BOX}`}
        className="mb-4"
      >
        <g
          transform={`translate(${CENTER}, ${CENTER})`}
          style={{ transition: "all 0.3s ease" }}
        >
          {/* fundo base do donut */}
          <circle
            r={OUTER_R}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={STROKE}
          />
          {slices}
          {labels}
        </g>
      </svg>

      {/* legenda */}
      <div
        className="
          flex flex-row flex-wrap
          items-start justify-center
          gap-x-6 gap-y-3
          text-[12px] leading-none
          text-black/80 dark:text-white/80
        "
      >
        {entries.map(([name, value]) => {
          const pctNum = total === 0 ? 0 : (value / total) * 100
          const pctText = pctNum.toLocaleString("pt-BR", {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          })

          return (
            <div
              key={name}
              className="flex flex-row items-center gap-2 text-black/80 dark:text-white/80 text-[12px] leading-none"
            >
              <span
                className="h-3 w-3 rounded-full inline-block"
                style={{ backgroundColor: colorForGateway(name) }}
              />
              <span className="flex flex-row flex-wrap items-baseline gap-1 leading-none">
                <span className="text-black dark:text-white text-[13px] font-medium leading-none">
                  {name || "Outro"}
                </span>
                <span className="text-black/50 dark:text-white/50 text-[12px] font-light leading-none">
                  {pctText}%
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================
// DASHBOARD LAYOUT / GRID
// =============================
export type CardRenderer =
  | React.ReactNode
  | ((
      slotId: string,
      ctx: ReturnType<typeof useGatewayKpis>,
      refreshKey: number
    ) => React.ReactNode)

export type CardContentMap = Record<string, CardRenderer>
export type VisibleSlotsMap = Record<string, boolean>
export type LayoutOverride = { w?: number; h?: number }
export type LayoutOverridesMap = Record<string, LayoutOverride>

interface DashboardProps {
  userName?: string
  salesByPlatform?: Record<string, number>
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

// layout
const CARDS: AutoCard[] = [
  // KPIs topo
  { id: "top-1", w: 3, h: 2, effect: "neonTop", glow: "#00f7ff" }, // Receita Total
  { id: "top-2", w: 3, h: 2, effect: "neonTop", glow: "#00f7ff" }, // Vendas
  { id: "top-3", w: 3, h: 2, effect: "neonTop", glow: "rgba(3,144,245,1)" }, // Reembolsos
  { id: "top-4", w: 3, h: 2, effect: "neonTop", glow: "#008ffcff" }, // Chargebacks

  // donut grande
  { id: "big-donut", w: 4, h: 6, kind: "donut", effect: "neonTop", glow: "#0d2de3ff" },

  // métricas operacionais
  { id: "r1", w: 3, h: 2, effect: "neonTop", glow: "#22d3ee" },   // Gastos com anúncios
  { id: "r2", w: 2, h: 2, effect: "neonTop", glow: "#0014f3ff" }, // ROAS
  { id: "r4", w: 3, h: 2, effect: "neonTop", glow: "#60a5fa" },   // Lucro
  { id: "r3", w: 3, h: 2, effect: "neonTop", glow: "#00e5ffff" }, // Vendas Pendentes
  { id: "r5", w: 2, h: 2, effect: "neonTop", glow: "#0014f3ff" }, // ROI
  { id: "r6", w: 3, h: 2, effect: "neonTop", glow: "#00bbffff" }, // Margem de Lucro

  // custo / conversa / imposto
  { id: "b1", w: 3, h: 2, effect: "neonTop", glow: "#34d399" },   // Custo por conversa
  { id: "b2", w: 2, h: 2, effect: "neonTop", glow: "#34d399" },   // Conversa
  { id: "b3", w: 3, h: 2, effect: "neonTop", glow: "#f59e0b" },   // Imposto

  // plataformas de anúncio
  { id: "b4", w: 3, h: 2, effect: "neonTop", glow: "#34d399" },   // Meta ADS
  { id: "b5", w: 3, h: 2, effect: "neonTop", glow: "#ee5706ff" }, // Google ADS
  { id: "b6", w: 3, h: 2, effect: "neonTop", glow: "#a855f7" },   // Analytics
  { id: "b7", w: 3, h: 2, effect: "neonTop", glow: "#a855f7" },   // TikTok ADS
  { id: "b8", w: 3, h: 2, effect: "neonTop", glow: "#0014f3ff" }, // Kwai ADS

  // slots livres
  { id: "b9",  w: 3, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "b10", w: 3, h: 2, effect: "neonTop", glow: "#10b981" },
  { id: "b11", w: 3, h: 2, effect: "neonTop", glow: "#c81331ff" },
]

export const CARDS_IDS = CARDS.map((c) => c.id)

// neon card base
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

// container de cada card
function Block({
  className = "",
  style,
  children,
}: React.PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  return (
    <div
      className={[
        `rounded-[${CARD_RADIUS_PX}px]`,
        ":border-white/20",
        "bg-transparent",
        "outline-none focus:outline-none focus:ring-0",
        className,
      ].join(" ")}
      style={style}
    >
      {children}
    </div>
  )
}

function Placeholder({ slotId }: { slotId: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-xs text-black/60 dark:text-white/60 select-none">
      {slotId}
    </div>
  )
}

// =============================
// RANGE BUILDER (Período)
// =============================
type RangePreset =
  | "maximo"
  | "hoje"
  | "ontem"
  | "7d"
  | "30d"
  | "90d"
  | "custom"

function makeRange(
  preset: RangePreset,
  customStart?: string,
  customEnd?: string
) {
  const now = new Date()

  if (preset === "maximo") {
    return { from: undefined, to: undefined }
  }

  if (preset === "hoje") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { from: start.toISOString(), to: end.toISOString() }
  }

  if (preset === "ontem") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 1)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { from: start.toISOString(), to: end.toISOString() }
  }

  if (preset === "7d" || preset === "30d" || preset === "90d") {
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90
    const end = new Date(now)
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    start.setHours(0, 0, 0, 0)
    return { from: start.toISOString(), to: end.toISOString() }
  }

  const startDate = customStart
    ? new Date(customStart + "T00:00:00")
    : undefined
  const endDateExclusive = customEnd
    ? new Date(
        new Date(customEnd + "T00:00:00").getTime() +
          24 * 60 * 60 * 1000
      )
    : undefined

  return {
    from: startDate ? startDate.toISOString() : undefined,
    to: endDateExclusive ? endDateExclusive.toISOString() : undefined,
  }
}

// =============================
// COMPONENTE PRINCIPAL DO DASHBOARD
// =============================
export default function DashboardView({
  salesByPlatform = {},
  onRefresh,
  cardContent,
  visibleSlots,
  layoutOverrides,
  hideDefaultDonut,
  kpiFilter,
}: DashboardProps) {
  const router = useRouter()

  const [preset, setPreset] = useState<RangePreset>("hoje")
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")

  const [isRefreshing, setIsRefreshing] = useState(false)

  // 🔑 CHAVE GLOBAL DE ATUALIZAÇÃO (usada só dentro do conteúdo)
  const [refreshKey, setRefreshKey] = useState(0)

  const { from, to } = useMemo(() => {
    return makeRange(preset, customStart, customEnd)
  }, [preset, customStart, customEnd])

  const data = useGatewayKpis({
    search: kpiFilter?.search,
    from,
    to,
  })

  function brl(n: number) {
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  function greenPct(p: string) {
    return (
      <span className="text-green-600 dark:text-green-400 text-2xl font-semibold">
        {p}
      </span>
    )
  }

  // conteúdo padrão dos cards
  const defaultContent: CardContentMap = {
    "top-1": (_slotId, ctx, key) => {
      const value = ctx.kpis.receitaTotal ?? 0
      const loading = ctx.loading || isRefreshing
      return (
        <div key={`kpi-top1-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Receita Total
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : brl(value)}
          </div>
        </div>
      )
    },

    "top-2": (_slotId, ctx, key) => {
      const value = ctx.kpis.vendas ?? 0
      const loading = ctx.loading || isRefreshing
      return (
        <div key={`kpi-top2-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Vendas
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : value.toLocaleString("pt-BR")}
          </div>
        </div>
      )
    },

    "top-3": (_slotId, ctx, key) => {
      const value = ctx.kpis.reembolsosTotal ?? 0
      const loading = ctx.loading || isRefreshing
      return (
        <div key={`kpi-top3-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Reembolsos
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : brl(value)}
          </div>
        </div>
      )
    },

    "top-4": (_slotId, ctx, key) => {
      const value = ctx.kpis.chargebacksTotal ?? 0
      const loading = ctx.loading || isRefreshing
      return (
        <div key={`kpi-top4-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Chargebacks
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : brl(value)}
          </div>
        </div>
      )
    },

    r1: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`r1-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Gastos com anúncios
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    r2: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = "0"
      return (
        <div key={`r2-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            ROAS
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    r3: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`r3-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Vendas Pendentes
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    r4: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`r4-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Lucro
          </div>
          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    r5: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      return (
        <div key={`r5-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            ROI
          </div>
          {loading ? (
            <span className="inline-block h-6 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          ) : (
            greenPct("0.0%")
          )}
        </div>
      )
    },

    r6: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      return (
        <div key={`r6-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Margem de Lucro
          </div>
          {loading ? (
            <span className="inline-block h-6 w-16 rounded bg-black/10 dark:bg白/10 animate-pulse" />
          ) : (
            greenPct("0.0%")
          )}
        </div>
      )
    },

    // custo / conversa / imposto
    b1: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`b1-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Custo por conversa
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    b2: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = "0"
      return (
        <div key={`b2-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Conversa
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-12 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    b3: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`b3-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2">
            Imposto
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    // plataformas
    b4: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`b4-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img src="/ads-logos/meta-ads.png" alt="" className="w-4 h-4 object-contain" />
            <span className="leading-none">Meta ADS</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    b5: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`b5-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img src="/ads-logos/google-ads.png" alt="" className="w-4 h-4 object-contain" />
            <span className="leading-none">Google ADS</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    b6: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`b6-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img src="/ads-logos/google-analytics.png" alt="" className="w-4 h-4 object-contain" />
            <span className="leading-none">Analytics</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    b7: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`b7-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img src="/ads-logos/tiktok-ads.png" alt="" className="w-4 h-4 object-contain" />
            <span className="leading-none">TikTok ADS</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    b8: (_slot, ctx, key) => {
      const loading = ctx.loading || isRefreshing
      const valText = brl(0)
      return (
        <div key={`b8-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img src="/ads-logos/kwai-ads.png" alt="" className="w-4 h-4 object-contain" />
            <span className="leading-none">Kwai ADS</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" /> : valText}
          </div>
        </div>
      )
    },

    "big-donut": (_slotId, ctx, key) => {
      const split = calcGatewaySplit(ctx.rows)
      return <DonutChart key={`donut-${key}`} data={split} />
    },
  }

  const effectiveCards = useMemo(() => {
    const v = visibleSlots ?? {}
    const o = layoutOverrides ?? {}
    return CARDS.filter((c) => v[c.id] !== false).map((c) => ({
      ...c,
      ...o[c.id],
    }))
  }, [visibleSlots, layoutOverrides])

  const rowsNeeded = useMemo(() => {
    const units = effectiveCards.reduce(
      (sum, c) =>
        sum +
        Math.max(1, Math.min(12, c.w)) *
          Math.max(1, c.h),
      0
    )
    return Math.max(6, Math.ceil(units / 12) + 1)
  }, [effectiveCards])

  const doRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      // 1) Atualiza dados
      await data.refetch()

      // 2) Se o pai tiver um onRefresh assíncrono, roda também
      if (onRefresh) {
        await onRefresh()
      } else if ("refresh" in router) {
        // @ts-ignore
        router.refresh?.()
      }

      // 3) 🔑 Força remontagem de TODO o conteúdo (não o card/neon)
      setRefreshKey((k) => k + 1)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, router, data])

  function PeriodSelector() {
    return (
      <div className="flex flex-col gap-2">
        {/* label + select */}
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="preset"
            className="text-black/70 dark:text-white/70 text-xs font-medium"
          >
            Período
          </label>

          <select
            id="preset"
            value={preset}
            onChange={(e) => {
              const next = e.target.value as RangePreset
              setPreset(next)
            }}
            className={[
              "bg-black/5 text-black/90 border-black/20",
              "dark:bg-black/40 dark:text-white/90 dark:border-white/20",
              "text-xs px-2 py-1 rounded-md border outline-none focus:ring-0 focus:border-black/40 dark:focus:border-white/40 cursor-pointer",
            ].join(" ")}
            style={{ minWidth: "140px" }}
          >
            <option value="maximo">Máximo</option>
            <option value="hoje">Hoje</option>
            <option value="ontem">Ontem</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-black/70 dark:text-white/70">
            <div className="flex items-center gap-1">
              <span>De</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={[
                  "bg-black/5 text-black/90 border-black/20",
                  "dark:bg-black/40 dark:text-white/90 dark:border-white/20",
                  "text-[10px] px-2 py-1 rounded-md border outline-none focus:ring-0 focus:border-black/40 dark:focus:border-white/40",
                ].join(" ")}
              />
            </div>

            <div className="flex items-center gap-1">
              <span>Até</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={[
                  "bg-black/5 text-black/90 border-black/20",
                  "dark:bg-black/40 dark:text-white/90 dark:border-white/20",
                  "text-[10px] px-2 py-1 rounded-md border outline-none focus:ring-0 focus:border-black/40 dark:focus:border-white/40",
                ].join(" ")}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="px-4 md:px-8 pt-2 md:pt-3 pb-0 overflow-hidden"
      style={{ height: `calc(100vh - ${HEADER_H}px)` }}
    >
      {/* HEADER */}
      <div className="mb-2 flex items-start justify-between gap-2 flex-wrap">
        <PeriodSelector />

        <button
          onClick={doRefresh}
          disabled={isRefreshing}
          className={[
            "relative inline-flex items-center justify-center px-4 py-2 rounded-md border font-medium transition-all disabled:opacity-60 active:scale-[0.99]",
            "border-black/25 text-black/90 bg-black/5 hover:bg-black/10",
            "dark:border-white/25 dark:text-white/90 dark:bg-black/40 dark:hover:bg-white/5",
            "neon-card neon-top no-glow",
          ].join(" ")}
          style={{
            ["--gw" as any]: "#505555ff",
          }}
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

          const style: CSSProperties & { ["--gw"]?: string } = {
            gridColumn: `auto / span ${Math.max(
              1,
              Math.min(12, card.w)
            )}`,
            gridRow: `auto / span ${Math.max(1, card.h)}`,
            ...(card.glow ? { ["--gw"]: card.glow } : {}),
          }

          // escolhe o conteúdo daquele slot
          const sourceMap = {
            ...(defaultContent || {}),
            ...(cardContent || {}),
          }
          const plug = sourceMap[card.id]

          let content: React.ReactNode | null = null
          if (typeof plug === "function") {
            // @ts-ignore – 3º arg é o refreshKey global
            content = plug(card.id, data, refreshKey)
          } else {
            content = plug ?? null
          }

          const fallback =
            card.kind === "donut" && !hideDefaultDonut ? (
              <div className="flex h-full w-full items-center justify-center text-black/55 dark:text-white/55 text-sm">
                Aguardando vendas...
              </div>
            ) : (
              <Placeholder slotId={card.id} />
            )

          return (
            <Block
              key={`${card.id}-${idx}`} // NÃO usa refreshKey aqui (não reinicia o neon)
              className={cls}
              style={style}
            >
              {/* Wrapper para overlay de atualização */}
              <div className="relative">
                {/* conteúdo interno (remontado a cada refresh) */}
                <div className={isRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"} key={`content-${refreshKey}`}>
                  {content ?? fallback}
                </div>

                {/* canto superior direito: só o spinner (sem timestamp) */}
                {isRefreshing && (
                  <div className="absolute top-2 right-2 text-black/60 dark:text-white/60">
                    <span
                      aria-label="atualizando"
                      className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin inline-block"
                    />
                  </div>
                )}
              </div>
            </Block>
          )
        })}
      </div>
    </div>
  )
}
