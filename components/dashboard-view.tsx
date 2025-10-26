"use client"
import React, { useMemo } from "react"

type SalesByPlatform = Record<string, number>

interface DashboardProps {
  userName?: string
  salesByPlatform?: SalesByPlatform
}

const HEADER_H = 80

/* --------- LISTA DE CARDS (edite livremente) ----------
 * Cada card só precisa de w (largura em colunas) e h (altura em linhas).
 * O grid se vira para posicionar automaticamente.
 */
type AutoCard = {
  id: string
  w: number // 1..12 (largura em colunas)
  h: number // 1..N  (altura em linhas)
  kind?: "donut" | "empty"
  className?: string
}

const CARDS: AutoCard[] = [
  // topo (4 cards largos)
  { id: "top-1", w: 3, h: 2 },
  { id: "top-2", w: 3, h: 2 },
  { id: "top-3", w: 3, h: 2 },
  { id: "top-4", w: 3, h: 2 },

  // bloco grande com donut
  { id: "big-donut", w: 5, h: 6, kind: "donut" },

  // coluna direita (3x2 menores)
  { id: "r1", w: 3, h: 2 },
  { id: "r2", w: 2, h: 2 },
  { id: "r3", w: 3, h: 2 },
  { id: "r4", w: 2, h: 2 },
  { id: "r5", w: 2, h: 2 },
  { id: "r6", w: 2, h: 2 },

  // linhas inferiores (8 cards largos)
  { id: "b1", w: 3, h: 2 },
  { id: "b2", w: 2, h: 2 },
  { id: "b3", w: 2, h: 2 },
  { id: "b4", w: 3, h: 2 },
  { id: "b5", w: 3, h: 2 },
  { id: "b6", w: 3, h: 2 },
  { id: "b7", w: 3, h: 2 },
  { id: "b8", w: 3, h: 2 },
  { id: "b9", w: 3, h: 2 },
  { id: "b10", w: 3, h: 2 },
  { id: "b11", w: 3, h: 2 },
]

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
        "border border-white/25 bg-transparent",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
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
  // calculo de linhas necessárias: soma das áreas / 12 colunas
  const rowsNeeded = useMemo(() => {
    const units = CARDS.reduce((sum, c) => sum + c.w * c.h, 0)
    // margem de segurança de 1 linha para encaixe "dense"
    return Math.max(1, Math.ceil(units / 12) + 1)
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
          gridAutoFlow: "dense",        // ► reencaixa automaticamente
        }}
      >
        {CARDS.map((card) => (
          <Block
            key={card.id}
            style={{
              gridColumn: `auto / span ${card.w}`,
              gridRow: `auto / span ${card.h}`,
            }}
            className={card.className}
          >
            {card.kind === "donut" ? <DonutChart salesByPlatform={salesByPlatform} /> : null}
          </Block>
        ))}
      </div>

      <div className="sr-only">{hasAnySale ? "Com vendas" : "Sem vendas"}</div>
    </div>
  )
}
