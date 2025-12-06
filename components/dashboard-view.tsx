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
import { Info } from "lucide-react"
import {
  getFacebookAdAccounts,
  getFacebookCampaignsWithInsights,
} from "@/lib/facebook-ads-service"

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
// TIPOS DE PLATAFORMAS DE ADS
// =============================
type AdsPlatform = "all" | "meta" | "google" | "analytics" | "tiktok" | "kwai"

type AdsMetrics = {
  adSpend: number
  pendingSales: number
  profit: number
  roi: number
  roas: number
  profitMargin: number
  costPerConversation: number
  conversations: number
  tax: number
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
  if (!APPROVED_STATUS.includes(st)) return false
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

function getBruto(row: GatewayTransaction) {
  const raw = row.amount ?? 0
  const num = Number(raw) || 0
  return num
}

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
    if (isRefund(r)) reembolsosTotal += Math.abs(getBruto(r))
    if (isChargeback(r)) chargebacksTotal += Math.abs(getBruto(r))
  }

  return { receitaTotal, vendas, reembolsosTotal, chargebacksTotal }
}

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

function dedupById<T extends { id: string }>(arr: T[]): T[] {
  const m = new Map<string, T>()
  for (const it of arr) m.set(it.id, it)
  return Array.from(m.values())
}

// =============================
// HOOK SUPABASE (fetch + realtime) — LGPD SAFE
// =============================
export function useGatewayKpis(filter: KpiFilter) {
  const { userId, from, to, search } = filter

  const [rows, setRows] = useState<GatewayTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const initialLoadedRef = useRef(false)

  // FETCH PRINCIPAL — só busca se userId existir
  async function fetchAll() {
    setLoading(true)
    setError(null)

    // 🚫 Segurança / LGPD: sem userId -> não mostra nada
    if (!userId) {
      setRows([])
      seenIdsRef.current = new Set()
      initialLoadedRef.current = true
      setLoading(false)
      return
    }

    const q = supabase
      .from("gateway_transactions")
      .select(
        "id,user_id,transaction_id,gateway_id,amount,currency,customer_name,customer_email,customer_phone,product_name,payment_method,fee,net_amount,event_type,status,raw_payload,created_at,updated_by,fees,updated_at,product_price"
      )
      .eq("user_id", userId) // filtro absoluto por usuário
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
      seenIdsRef.current = new Set()
      initialLoadedRef.current = true
      setLoading(false)
      return
    }

    const clean = dedupById((data || []) as GatewayTransaction[])
    setRows(clean)
    seenIdsRef.current = new Set(clean.map((r) => r.id))
    initialLoadedRef.current = true
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, from, to, search])

  // REALTIME — só assina se userId existir
  useEffect(() => {
    // Sem userId: limpa canal e sai
    if (!userId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const chanName = `gateway_transactions_dashboard_${userId}_${
      from || "min"
    }_${to || "max"}_${Math.random().toString(36).slice(2)}`

    const channel = supabase.channel(chanName)

    const fromMs = from ? Date.parse(from) : null
    const toMs = to ? Date.parse(to) : null

    // INSERT
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "gateway_transactions" },
      (payload) => {
        if (!initialLoadedRef.current) return
        const row = payload.new as GatewayTransaction

        // LGPD: ignora linhas de outro usuário
        if (row.user_id !== userId) return

        const rowMs = Date.parse(row.created_at)
        if (fromMs !== null && rowMs < fromMs) return
        if (toMs !== null && rowMs >= toMs) return

        setRows((prev) => {
          if (seenIdsRef.current.has(row.id)) {
            return prev.map((r) => (r.id === row.id ? row : r))
          }
          seenIdsRef.current.add(row.id)
          return [row, ...prev]
        })
      }
    )

    // UPDATE
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "gateway_transactions" },
      (payload) => {
        const row = payload.new as GatewayTransaction

        if (row.user_id !== userId) return // segurança

        const rowMs = Date.parse(row.created_at)

        setRows((prev) => {
          if ((fromMs !== null && rowMs < fromMs) || (toMs !== null && rowMs >= toMs)) {
            seenIdsRef.current.delete(row.id)
            return prev.filter((r) => r.id !== row.id)
          }

          if (!seenIdsRef.current.has(row.id)) {
            seenIdsRef.current.add(row.id)
            return [row, ...prev]
          }
          return prev.map((r) => (r.id === row.id ? row : r))
        })
      }
    )

    channel.subscribe()
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
// DONUT CHART (cores reais + popup)
// =============================
function DonutChart({
  data,
  size = 220,
  radius = 60,
  stroke = 20,
}: {
  data: Record<string, number>
  size: number
  radius?: number
  stroke?: number
}) {
  const entries = useMemo(
    () => Object.entries(data).filter(([, v]) => v > 0),
    [data]
  )
  const total = useMemo(
    () => entries.reduce((s, [, v]) => s + v, 0),
    [entries]
  )

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [tip, setTip] = useState({
    show: false,
    name: "",
    pct: 0,
    x: 0,
    y: 0,
  })

  if (total === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-black/55 dark:text-white/55 text-sm">
          Aguardando vendas...
        </div>
      </div>
    )
  }

  const OUTER_R = radius
  const STROKE = stroke
  const INNER_R = OUTER_R - STROKE
  const C = 2 * Math.PI * OUTER_R
  const BOX = OUTER_R * 2 + STROKE * 2
  const CENTER = OUTER_R + STROKE

  function colorForGateway(name: string) {
    const key = (name || "").toLowerCase().trim()

    if (key.includes("pepper")) return "#FF6B00"
    if (key.includes("cakto")) return "#6D28D9"
    if (key.includes("kirvano")) return "#0EA5E9"
    if (key.includes("kiwify")) return "#00C853"
    if (key.includes("hotmart")) return "#FF4C4C"
    if (key.includes("monetizze")) return "#0069FF"
    if (key.includes("eduzz")) return "#F9A826"
    if (key.includes("braip")) return "#4F46E5"

    if (key.includes("pix")) return "#00C853"
    if (key.includes("card") || key.includes("credito")) return "#3B82F6"

    const palette = [
      "#8b5cf6",
      "#22c55e",
      "#3b82f6",
      "#eab308",
      "#ec4899",
      "#06b6d4",
      "#fb923c",
      "#ef4444",
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
    const a = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }

  function handleSliceMove(
    e: React.MouseEvent<SVGCircleElement, MouseEvent>,
    name: string,
    pct: number
  ) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    setTip({
      show: true,
      name,
      pct,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  function handleSliceLeave() {
    setTip((prev) => ({ ...prev, show: false }))
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
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
        className="cursor-pointer"
        onMouseMove={(e) => handleSliceMove(e, name, pct100)}
        onMouseLeave={handleSliceLeave}
      />
    )

    const startFrac = offsetLen / C
    const endFrac = (offsetLen + sliceLen) / C
    const midFrac = (startFrac + endFrac) / 2
    const midAngleDeg = midFrac * 360 - 90
    const labelRadius = INNER_R + STROKE / 1 - 1
    const { x, y } = polarToCartesian(1, 1, labelRadius, midAngleDeg)

    const pctText = pct100.toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    })

    labels.push(
      <text
        key={name + "-label"}
        x={x}
        y={y}
        fill="#fff"
        fontSize="10px"
        fontWeight={800}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {pctText}%
      </text>
    )

    offsetLen += sliceLen
  })

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center"
    >
      <svg
        className="block mx-auto my-auto"
        width="100%"
        height="100%"
        viewBox={`0 0 ${BOX} ${BOX}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: size, maxHeight: size }}
      >
        <g transform={`translate(${CENTER}, ${CENTER})`}>
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

      {tip.show && (
        <div
          className="pointer-events-none absolute rounded-md px-2 py-1 text-xs font-medium shadow-lg bg-black/80 text-white whitespace-nowrap"
          style={{ left: tip.x + 8, top: tip.y + 8 }}
        >
          {tip.name || "Outro"} —{" "}
          {tip.pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
        </div>
      )}
    </div>
  )
}

// =============================
// DASHBOARD LAYOUT / GRID
// =============================
type CardRenderer =
  | React.ReactNode
  | ((
      slotId: string,
      ctx: ReturnType<typeof useGatewayKpis>,
      refreshKey: number
    ) => React.ReactNode)

type CardContentMap = Record<string, CardRenderer>
type VisibleSlotsMap = Record<string, boolean>
type LayoutOverride = { w?: number; h?: number }
type LayoutOverridesMap = Record<string, LayoutOverride>

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

const CARDS: AutoCard[] = [
  { id: "top-1", w: 3, h: 2, effect: "neonTop", glow: "#00f7ff" },
  { id: "top-2", w: 3, h: 2, effect: "neonTop", glow: "#00f7ff" },
  { id: "top-3", w: 3, h: 2, effect: "neonTop", glow: "rgba(3,144,245,1)" },
  { id: "top-4", w: 3, h: 2, effect: "neonTop", glow: "#008ffcff" },
  { id: "big-donut", w: 4, h: 6, kind: "donut", effect: "neonTop", glow: "#0d2de3ff" },
  { id: "r1", w: 3, h: 2, effect: "neonTop", glow: "#22d3ee" },
  { id: "r2", w: 2, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "r4", w: 3, h: 2, effect: "neonTop", glow: "#60a5fa" },
  { id: "r3", w: 3, h: 2, effect: "neonTop", glow: "#00e5ffff" },
  { id: "r5", w: 2, h: 2, effect: "neonTop", glow: "#0014f3ff" },
  { id: "r6", w: 3, h: 2, effect: "neonTop", glow: "#00bbffff" },
  { id: "b1", w: 3, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b2", w: 2, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b3", w: 3, h: 2, effect: "neonTop", glow: "#f59e0b" },
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
type RangePreset = "maximo" | "hoje" | "ontem" | "7d" | "30d" | "90d" | "custom"

function presetToFbDatePreset(preset: RangePreset): string {
  switch (preset) {
    case "hoje":
      return "today"
    case "ontem":
      return "yesterday"
    case "7d":
      return "last_7d"
    case "30d":
      return "last_30d"
    case "90d":
      return "last_90d"
    case "maximo":
      return "maximum"
    case "custom":
    default:
      return "maximum"
  }
}

function makeRange(
  preset: RangePreset,
  customStart?: string,
  customEnd?: string
) {
  const now = new Date()

  if (preset === "maximo") return { from: undefined, to: undefined }

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
    end.setHours(23, 59, 59, 999)

    const start = new Date(end)
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)

    return { from: start.toISOString(), to: end.toISOString() }
  }

  const startDate = customStart ? new Date(customStart + "T00:00:00") : undefined
  const endDateExclusive = customEnd
    ? new Date(new Date(customEnd + "T00:00:00").getTime() + 24 * 60 * 60 * 1000)
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

  // Usuário logado (Supabase Auth)
  const [authUserId, setAuthUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar usuário autenticado:", error)
          return
        }
        const u = data?.user
        if (u?.id) {
          setAuthUserId(u.id)
        }
      })
      .catch((err) => {
        console.error("Erro inesperado ao buscar usuário autenticado:", err)
      })
  }, [])

  const [preset, setPreset] = useState<RangePreset>("hoje")
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedPlatform, setSelectedPlatform] = useState<AdsPlatform>("all")
  const [metaAdSpend, setMetaAdSpend] = useState(0)
  const [loadingMetaSpend, setLoadingMetaSpend] = useState(false)

  const { from, to } = useMemo(
    () => makeRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  )

  // userId efetivo (padrão = usuário logado)
  const effectiveUserId = kpiFilter?.userId ?? authUserId ?? undefined

  const data = useGatewayKpis({
    userId: effectiveUserId,
    search: kpiFilter?.search,
    from,
    to,
  })

  const { rows } = data

  // Receita total (net_amount, 1x por transação)
  const totalNetRevenue = useMemo(() => {
    const byTxn = new Map<string, GatewayTransaction>()

    for (const r of rows || []) {
      if (!isApprovedSale(r)) continue

      const tKey = r.transaction_id || r.id
      const prev = byTxn.get(tKey)
      if (!prev || new Date(r.created_at) > new Date(prev.created_at)) {
        byTxn.set(tKey, r)
      }
    }

    let sum = 0
    for (const r of byTxn.values()) {
      const n = Number(r.net_amount ?? 0) || 0
      if (n > 0) sum += n
    }
    return sum
  }, [rows])

  // Gasto Meta ADS
  useEffect(() => {
    async function fetchMetaSpend() {
      try {
        setLoadingMetaSpend(true)
        const fbPreset = presetToFbDatePreset(preset)

        const accounts = await getFacebookAdAccounts()
        let total = 0

        for (const acc of accounts) {
          const campaigns = await getFacebookCampaignsWithInsights(
            acc.id,
            undefined,
            fbPreset
          )

          for (const c of campaigns) {
            total += Number(c.spend || 0)
          }
        }

        setMetaAdSpend(total)
      } catch (err) {
        console.error("Erro ao carregar gastos Meta ADS:", err)
      } finally {
        setLoadingMetaSpend(false)
      }
    }

    fetchMetaSpend()
  }, [preset, refreshKey])

  function brl(n: number) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const greenPct = (p: string) => {
    const numeric = parseFloat(p.replace("%", "").replace(",", ".")) || 0

    let colorClass = "text-white"
    if (numeric > 0) colorClass = "text-green-500 dark:text-green-400"
    else if (numeric < 0) colorClass = "text-red-500 dark:text-red-400"

    return <span className={`${colorClass} text-2xl font-semibold`}>{p}</span>
  }

  const adsMetricsByPlatform: Record<AdsPlatform, AdsMetrics> = useMemo(() => {
    const zero: AdsMetrics = {
      adSpend: 0,
      pendingSales: 0,
      profit: 0,
      roi: 0,
      roas: 0,
      profitMargin: 0,
      costPerConversation: 0,
      conversations: 0,
      tax: 0,
    }

    const totalProfit = Object.values(salesByPlatform || {}).reduce(
      (sum, v) => sum + (v || 0),
      0
    )

    const get = (key: AdsPlatform) =>
      key === "all" ? 0 : (salesByPlatform?.[key] ?? 0)

    const totalAdSpendAllPlatforms = metaAdSpend

    return {
      all: {
        ...zero,
        adSpend: totalAdSpendAllPlatforms,
        profit: totalProfit,
      },
      meta: {
        ...zero,
        adSpend: metaAdSpend,
        profit: get("meta"),
      },
      google: {
        ...zero,
        adSpend: 0,
        profit: get("google"),
      },
      analytics: {
        ...zero,
        adSpend: 0,
        profit: get("analytics"),
      },
      tiktok: {
        ...zero,
        adSpend: 0,
        profit: get("tiktok"),
      },
      kwai: {
        ...zero,
        adSpend: 0,
        profit: get("kwai"),
      },
    }
  }, [salesByPlatform, metaAdSpend])

  const currentAdsMetrics = adsMetricsByPlatform[selectedPlatform]

  const totalAdSpendAllPlatforms = adsMetricsByPlatform.all?.adSpend ?? 0
  const globalProfit = totalNetRevenue - totalAdSpendAllPlatforms

  const globalRoas =
    totalAdSpendAllPlatforms > 0
      ? totalNetRevenue / totalAdSpendAllPlatforms
      : 0

  const globalRoi =
    totalAdSpendAllPlatforms > 0
      ? (globalProfit / totalAdSpendAllPlatforms) * 100
      : 0

  const globalProfitMargin =
    totalNetRevenue > 0 ? (globalProfit / totalNetRevenue) * 100 : 0

  const selectedPlatformLabel = useMemo(() => {
    switch (selectedPlatform) {
      case "meta":
        return "Meta ADS"
      case "google":
        return "Google ADS"
      case "analytics":
        return "Analytics"
      case "tiktok":
        return "TikTok ADS"
      case "kwai":
        return "Kwai ADS"
      default:
        return "Todas plataformas"
    }
  }, [selectedPlatform])

  const defaultContent: CardContentMap = {
    "top-1": (_slotId, ctx, key) => {
      const loading = ctx.loading || isRefreshing

      const totalNet = React.useMemo(() => {
        const byTxn = new Map<string, GatewayTransaction>()

        for (const r of ctx.rows || []) {
          if (!isApprovedSale(r)) continue
          if (isRefund(r) || isChargeback(r)) continue

          const tKey = r.transaction_id || r.id
          const prev = byTxn.get(tKey)
          if (!prev || new Date(r.created_at) > new Date(prev.created_at)) {
            byTxn.set(tKey, r)
          }
        }

        let sum = 0
        for (const r of byTxn.values()) {
          const n = Number(r.net_amount ?? 0) || 0
          if (n > 0) sum += n
        }
        return sum
      }, [ctx.rows])

      return (
        <div
          key={`kpi-top1-${key}`}
          className="p-3 text-black dark:text-white relative"
        >
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-black/70 dark:text-white/70">
              Receita Total
            </span>
            <div className="group relative flex items-center">
              <Info
                size={13}
                className="text-black/50 dark:text-white/50 cursor-pointer hover:text-black dark:hover:text-white transition"
              />
              <div className="absolute left-4 top-4 z-20 hidden w-56 rounded-md bg-black/80 text-white text-[11px] p-2 leading-tight group-hover:block shadow-lg">
                Soma do <b>net_amount</b> das vendas aprovadas, 1x por
                transação, sem reembolsos/chargebacks.
              </div>
            </div>
          </div>

          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(totalNet)
            )}
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
            {loading ? (
              <span className="inline-block h-6 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              value.toLocaleString("pt-BR")
            )}
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
            {loading ? (
              <span className="inline-block h-6 w-28 rounded bg-black/10 dark:bg:white/10 animate-pulse" />
            ) : (
              brl(value)
            )}
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
        {loading ? (
          <span className="inline-block h-6 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        ) : (
          brl(value)
        )}
      </div>
    </div>
  )
},

    r1: (_slot, _ctx, key) => {
      const loading = isRefreshing || loadingMetaSpend
      return (
        <div key={`r1-${key}`} className="p-3 text-black dark:text-white">
          <div className="mb-1">
            <div className="text-xs text-black/70 dark:text-white/70">
              Gastos com anúncios
            </div>
            <div className="text-[10px] text-black/50 dark:text-white/50">
              {selectedPlatformLabel}
            </div>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(currentAdsMetrics.adSpend)
            )}
          </div>
        </div>
      )
    },

    r2: (_slot, _ctx, key) => {
      const loading = isRefreshing || loadingMetaSpend
      const roas = globalRoas

      const roasColor =
        roas > 0 && roas < 1
          ? "text-red-500 dark:text-red-400"
          : roas >= 1
          ? "text-green-500 dark:text-green-400"
          : "text-white"

      return (
        <div key={`r2-${key}`} className="p-3 text-black dark:text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-black/70 dark:text-white/70">ROAS</div>
            <span className="text-[10px] text-black/50 dark:text-white/50">
              Todas plataformas
            </span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              <span className={roasColor}>{roas.toFixed(2)}</span>
            )}
          </div>
        </div>
      )
    },

    r3: (_slot, _ctx, key) => {
      const loading = isRefreshing || loadingMetaSpend
      return (
        <div key={`r3-${key}`} className="p-3 text-black dark:text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-black/70 dark:text-white/70">
              Vendas Pendentes
            </div>
            <span className="text-[10px] text-black/50 dark:text-white/50">
              {selectedPlatformLabel}
            </span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(currentAdsMetrics.pendingSales)
            )}
          </div>
        </div>
      )
    },

    r4: (_slot, _ctx, key) => {
      const loading = isRefreshing || loadingMetaSpend
      const lucro = globalProfit

      const lucroColor =
        lucro > 0
          ? "text-green-500 dark:text-green-400"
          : lucro < 0
          ? "text-red-500 dark:text-red-400"
          : "text-white"

      return (
        <div key={`r4-${key}`} className="p-3 text-black dark:text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-black/70 dark:text-white/70">Lucro</div>
            <span className="text-[10px] text-black/50 dark:text-white/50">
              Todas plataformas
            </span>
          </div>
          <div className={`text-2xl font-semibold ${lucroColor}`}>
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(lucro)
            )}
          </div>
        </div>
      )
    },

    r5: (_slot, _ctx, key) => {
      const loading = isRefreshing || loadingMetaSpend
      return (
        <div key={`r5-${key}`} className="p-3 text-black dark:text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-black/70 dark:text-white/70">ROI</div>
            <span className="text-[10px] text-black/50 dark:text-white/50">
              Todas plataformas
            </span>
          </div>
          {loading ? (
            <span className="inline-block h-6 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          ) : (
            greenPct(`${globalRoi.toFixed(1)}%`)
          )}
        </div>
      )
    },

    r6: (_slot, _ctx, key) => {
      const loading = isRefreshing || loadingMetaSpend
      return (
        <div key={`r6-${key}`} className="p-3 text-black dark:text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-black/70 dark:text-white/70">
              Margem de Lucro
            </div>
            <span className="text-[10px] text-black/50 dark:text-white/50">
              Todas plataformas
            </span>
          </div>
          {loading ? (
            <span className="inline-block h-6 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          ) : (
            greenPct(`${globalProfitMargin.toFixed(1)}%`)
          )}
        </div>
      )
    },

    b1: (_slot, _ctx, key) => {
      const loading = isRefreshing
      return (
        <div key={`b1-${key}`} className="p-3 text-black dark:text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-black/70 dark:text-white/70">
              Custo por conversa
            </div>
            <span className="text-[10px] text-black/50 dark:text-white/50">
              {selectedPlatformLabel}
            </span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(currentAdsMetrics.costPerConversation)
            )}
          </div>
        </div>
      )
    },

    b2: (_slot, _ctx, key) => {
      const loading = isRefreshing
      return (
        <div key={`b2-${key}`} className="p-3 text-black dark:text-white">
          <div className="mb-1">
            <div className="text-xs text-black/70 dark:text-white/70">
              Conversa
            </div>
            <div className="text-[10px] text-black/50 dark:text-white/50">
              {selectedPlatformLabel}
            </div>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-12 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              currentAdsMetrics.conversations.toLocaleString("pt-BR")
            )}
          </div>
        </div>
      )
    },

    b3: (_slot, _ctx, key) => {
      const loading = isRefreshing
      return (
        <div key={`b3-${key}`} className="p-3 text-black dark:text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-black/70 dark:text-white/70">
              Imposto
            </div>
            <span className="text-[10px] text-black/50 dark:text-white/50">
              {selectedPlatformLabel}
            </span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(currentAdsMetrics.tax)
            )}
          </div>
        </div>
      )
    },

    b4: (_slot, _ctx, key) => {
      const loading = isRefreshing
      return (
        <div key={`b4-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img
              src="/ads-logos/meta-ads.png"
              alt=""
              className="w-4 h-4 object-contain"
            />
            <span className="leading-none">Meta ADS — Gasto</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading || loadingMetaSpend ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(adsMetricsByPlatform.meta.adSpend)
            )}
          </div>
        </div>
      )
    },

    b5: (_slot, _ctx, key) => {
      const loading = isRefreshing
      return (
        <div key={`b5-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img
              src="/ads-logos/google-ads.png"
              alt=""
              className="w-4 h-4 object-contain"
            />
            <span className="leading-none">Google ADS</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(adsMetricsByPlatform.google.profit)
            )}
          </div>
        </div>
      )
    },

    b6: (_slot, _ctx, key) => {
      const loading = isRefreshing
      return (
        <div key={`b6-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img
              src="/ads-logos/google-analytics.png"
              alt=""
              className="w-4 h-4 object-contain"
            />
            <span className="leading-none">Analytics</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(adsMetricsByPlatform.analytics.profit)
            )}
          </div>
        </div>
      )
    },

    b7: (_slot, _ctx, key) => {
      const loading = isRefreshing
      return (
        <div key={`b7-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img
              src="/ads-logos/tiktok-ads.png"
              alt=""
              className="w-4 h-4 object-contain"
            />
            <span className="leading-none">TikTok ADS</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(adsMetricsByPlatform.tiktok.profit)
            )}
          </div>
        </div>
      )
    },

    b8: (_slot, _ctx, key) => {
      const loading = isRefreshing
      return (
        <div key={`b8-${key}`} className="p-3 text-black dark:text-white">
          <div className="text-xs text-black/70 dark:text-white/70 mb-2 flex items-center gap-2">
            <img
              src="/ads-logos/kwai-ads.png"
              alt=""
              className="w-4 h-4 object-contain"
            />
            <span className="leading-none">Kwai ADS</span>
          </div>
          <div className="text-2xl font-semibold">
            {loading ? (
              <span className="inline-block h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : (
              brl(adsMetricsByPlatform.kwai.profit)
            )}
          </div>
        </div>
      )
    },

    "big-donut": (_slotId, ctx, key) => {
      const split = calcGatewaySplit(ctx.rows)
      return (
        <div
          key={`donut-${key}`}
          className="h-full w-full flex items-center justify-center"
        >
          <DonutChart data={split} size={220} radius={60} stroke={20} />
        </div>
      )
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
        sum + Math.max(1, Math.min(12, c.w)) * Math.max(1, c.h),
      0
    )
    return Math.max(6, Math.ceil(units / 12) + 1)
  }, [effectiveCards])

  const doRefresh = useCallback(
    async () => {
      try {
        setIsRefreshing(true)
        await data.refetch()
        if (onRefresh) await onRefresh()
        else if ("refresh" in router) {
          // @ts-ignore
          router.refresh?.()
        }
        setRefreshKey((k) => k + 1)
      } finally {
        setIsRefreshing(false)
      }
    },
    [onRefresh, router, data]
  )

  function PeriodSelector() {
    return (
      <div className="flex flex-col gap-2">
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
            onChange={(e) => setPreset(e.target.value as RangePreset)}
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

  const adsPlatformOptions: { value: AdsPlatform; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "meta", label: "Meta ADS" },
    { value: "google", label: "Google ADS" },
    { value: "analytics", label: "Analytics" },
    { value: "tiktok", label: "TikTok ADS" },
    { value: "kwai", label: "Kwai ADS" },
  ]

  return (
    <div
      className="px-4 md:px-8 pt-2 md:pt-3 pb-0 overflow-hidden"
      style={{ height: `calc(100vh - ${HEADER_H}px)` }}
    >
      {/* HEADER */}
      <div className="mb-2 flex items-start justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap items-end gap-3">
          <PeriodSelector />

          {/* Seletor de plataforma de anúncios */}
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-black/40 px-1 py-1 shadow-inner">
            {adsPlatformOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedPlatform(opt.value)}
                className={[
                  "text-xs px-3 py-1 rounded-full transition-all",
                  "border border-transparent",
                  selectedPlatform === opt.value
                    ? "bg-emerald-500 text-black font-semibold shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                    : "text-zinc-300 hover:bg-white/5",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={doRefresh}
          disabled={isRefreshing}
          className={[
            "relative inline-flex items-center justify-center px-4 py-2 rounded-md border font-medium transition-all disabled:opacity-60 active:scale-[0.99]",
            "border-black/25 text-black/90 bg-black/5 hover:bg-black/10",
            "dark:border-white/25 dark:text-white/90 dark:bg-black/40 dark:hover:bg:white/5",
            "neon-card neon-top no-glow",
          ].join(" ")}
          style={{ ["--gw" as any]: "#505555ff" }}
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
            gridColumn: `auto / span ${Math.max(1, Math.min(12, card.w))}`,
            gridRow: `auto / span ${Math.max(1, card.h)}`,
            ...(card.glow ? { ["--gw"]: card.glow } : {}),
          }

          const sourceMap = { ...(defaultContent || {}), ...(cardContent || {}) }
          const plug = sourceMap[card.id]

          let content: React.ReactNode | null = null
          if (typeof plug === "function") {
            // @ts-ignore
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
            <Block key={`${card.id}-${idx}`} className={cls} style={style}>
              <div className="relative h-full">
                <div
                  className={
                    (isRefreshing ? "opacity-60 " : "") +
                    "transition-opacity h-full"
                  }
                  key={`content-${refreshKey}`}
                >
                  {content ?? fallback}
                </div>

                {isRefreshing && (
                  <div className="absolute top-2 right-2 text-black/60 dark:text-white/60">
                    <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
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
