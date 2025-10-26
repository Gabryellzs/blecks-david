"use client"
import React, { useMemo } from "react"

type SalesByPlatform = Record<string, number>

interface DashboardProps {
  userName?: string
  salesByPlatform?: SalesByPlatform
}

const HEADER_H = 80

/* --------- LISTA DE CARDS (edite livremente) ----------
 * Agora cada card pode receber:
 *  - effect: "neon" | "neonTop" | "neonGold" | "none"
 *  - glow: qualquer cor CSS (ex.: "#00f7ff", "rgb(147 51 234)", "hsl(280 100% 70%)")
 */
type AutoCard = {
  id: string
  w: number // 1..12 (largura em colunas)
  h: number // 1..N  (altura em linhas)
  kind?: "donut" | "empty"
  className?: string
  effect?: "neon" | "neonTop" | "neonGold" | "none"
  glow?: string
}

const CARDS: AutoCard[] = [
  // topo (4 cards largos)
  { id: "top-1", w: 3, h: 2, effect: "neonTop",    glow: "#00f7ff" },
  { id: "top-2", w: 3, h: 2, effect: "neonTop", glow: "rgb(147 51 234)" }, // roxo
  { id: "top-3", w: 3, h: 2, effect: "neonTop", glow: "#c81331ff" },
  { id: "top-4", w: 3, h: 2, effect: "neonTop",    glow: "#f472b6" }, // rosa

  // bloco grande com donut (neon dourado)
  { id: "big-donut", w: 5, h: 6, kind: "donut", effect: "neonTop", glow: "#0d2de3ff"},

  // coluna direita (3x2 menores)
  { id: "r1", w: 3, h: 2, effect: "neonTop", glow: "#22d3ee" },
  { id: "r2", w: 2, h: 2, effect: "neonTop", glow: "#c81331ff" },
  { id: "r3", w: 3, h: 2, effect: "neonTop", glow: "#a3e635" },
  { id: "r4", w: 2, h: 2, effect: "neonTop", glow: "#60a5fa" },
  { id: "r5", w: 2, h: 2, effect: "neonTop", glow: "#c81331ff" },
  { id: "r6", w: 2, h: 2, effect: "neonTop", glow: "#fb7185" },

  // linhas inferiores (8 cards largos)
  { id: "b1",  w: 3, h: 2, effect: "neonTop", glow: "#34d399" },
  { id: "b2",  w: 2, h: 2, effect: "neonTop", glow: "#34d399"},
  { id: "b3",  w: 2, h: 2, effect: "neonTop", glow: "#f59e0b" },
  { id: "b4",  w: 3, h: 2, effect: "neonTop", glow: "#34d399"},
  { id: "b5",  w: 3, h: 2, effect: "neonTop", glow: "#a06a0eff" },
  { id: "b6",  w: 3, h: 2, effect: "neonTop", glow: "#a855f7" },
  { id: "b7",  w: 3, h: 2, effect: "neonTop", glow: "#a855f7" } ,
  { id: "b8",  w: 3, h: 2, effect: "neonTop", glow: "#c81331ff" },
  { id: "b9",  w: 3, h: 2, effect: "neonTop", glow: "#c81331ff" },
  { id: "b10", w: 3, h: 2, effect: "neonTop", glow: "#10b981" },
  { id: "b11", w: 3, h: 2, effect: "neonTop", glow: "#c81331ff" },
]

/* ---------- helpers ---------- */
function neonClass(effect?: AutoCard["effect"]) {
  switch (effect) {
    case "neon":     return "neon-card"
    case "neonTop":  return "neon-card neon-top"
    case "neonGold": return "neon-card neon-top neon-gold"
    default:         return ""
  }
}

/* ---------- Blocos visuais ---------- */
function Block({
  className = "",
  style,
  children,
}: React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) {
  return (
    <div
      className={[
        "rounded-[14px]",
        // borda discreta para não brigar com o glow
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
          <circle r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
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
        {entries.map(([name]) => (
          <Badge key={name} label={name} />
        ))}
      </div>
    </div>
  )
}

/* ---------- Página (auto-placement + sem scroll) ---------- */
export default function DashboardView({
  userName = "",
  salesByPlatform = {
    Cakto: 0, Kirvano: 0, Pepper: 0, Kiwify: 0, Hotmart: 0, Monetizze: 0, Eduzz: 0, Braip: 0, Lastlink: 0,
  },
}: DashboardProps) {
  // linhas calculadas p/ caber sem scroll
  const rowsNeeded = useMemo(() => {
    const units = CARDS.reduce((sum, c) => sum + c.w * c.h, 0)
    return Math.max(6, Math.ceil(units / 12) + 1)
  }, [])

  const hasAnySale = useMemo(
    () => Object.values(salesByPlatform).some((v) => v > 0),
    [salesByPlatform]
  )

  return (
    <div
      className="px-4 md:px-8 pt-4 md:pt-6 pb-0 overflow-hidden"
      style={{ height: `calc(100vh - ${HEADER_H}px)` }}
    >
      <h2 className="sr-only">{userName ? `Olá, ${userName}` : "Dashboard"}</h2>

      <div
        className="grid h-full"
        style={{
          gap: 12,
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gridTemplateRows: `repeat(${rowsNeeded}, 1fr)`,
          gridAutoFlow: "dense",
        }}
      >
        {CARDS.map((card, idx) => (
          <Block
            key={`${card.id}-${idx}`}
            className={neonClass(card.effect)}
            style={{
              // passa a cor do glow para o CSS: .neon-card usa var(--gw)
              // (se não definir glow, usa a padrão do CSS)
              ...(card.glow ? ({ ["--gw" as any]: card.glow } as React.CSSProperties) : {}),
              gridColumn: `auto / span ${Math.max(1, Math.min(12, card.w))}`,
              gridRow: `auto / span ${Math.max(1, card.h)}`,
            }}
          >
            {card.kind === "donut" ? <DonutChart salesByPlatform={salesByPlatform} /> : null}
          </Block>
        ))}
      </div>

      <div className="sr-only">{hasAnySale ? "Com vendas" : "Sem vendas"}</div>
    </div>
  )
}
