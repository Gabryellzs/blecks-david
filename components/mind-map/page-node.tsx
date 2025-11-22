"use client"

import { memo } from "react"
import { Handle, Position } from "reactflow"

interface PageNodeProps {
  data: {
    label: string
    description?: string
    pageType?: string
    hasCallToAction?: boolean
  }
  selected: boolean
}

const PageNode = memo(({ data, selected }: PageNodeProps) => {
  // Determinar o texto do botão com base no tipo de página
  const getButtonText = () => {
    if (data.pageType === "checkout") return "COMPRAR AGORA"
    return "CALL TO ACTION"
  }

  const showButton = data.hasCallToAction ?? true

  return (
    <div
      className={[
        "relative",
        // REMOVI overflow-hidden pra não cortar os pontos de conexão
        "rounded-xl border bg-[#050816]/95 shadow-[0_16px_40px_rgba(0,0,0,0.8)]",
        "w-[220px] text-xs text-slate-100",
        "transition-all duration-150",
        selected
          ? "border-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.5)]"
          : "border-slate-800/80",
      ].join(" ")}
    >
      {/* TOP BAR - janela do navegador */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/70 bg-[#020617] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500/90" />
          <span className="h-2 w-2 rounded-full bg-yellow-400/90" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
        </div>
        {data.pageType && (
          <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-[2px] text-[9px] uppercase tracking-[0.16em] text-slate-400">
            {data.pageType.replace("-", " ")}
          </span>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="space-y-2 px-3 pb-3 pt-2">
        {/* Título e descrição */}
        <div>
          <p className="mb-1 text-[11px] font-semibold leading-snug">
            {data.label || "Página"}
          </p>
          {data.description && (
            <p className="text-[10px] leading-snug text-slate-400 line-clamp-2">
              {data.description}
            </p>
          )}
        </div>

        {/* Linhas fake de conteúdo */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-11/12 rounded-full bg-slate-800" />
          <div className="h-1.5 w-9/12 rounded-full bg-slate-800" />
          <div className="h-1.5 w-7/12 rounded-full bg-slate-900" />
        </div>

        {/* CTA */}
        {showButton && (
          <div className="mt-2 flex justify-center">
            <button className="inline-flex items-center justify-center rounded-md border border-slate-950 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-900 shadow-[0_6px_18px_rgba(0,0,0,0.5)]">
              {getButtonText()}
            </button>
          </div>
        )}
      </div>

      {/* HANDLES (PONTOS DE CONEXÃO) — FORA DO CARD */}

      {/* Esquerda - entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 -left-3 top-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 bg-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.9)] z-[40]"
      />

      {/* Direita - saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 -right-3 top-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] z-[40]"
      />

      {/* Topo - entrada extra */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3.5 h-3.5 top-[-7px] left-1/2 -translate-x-1/2 rounded-full border-2 border-cyan-400 bg-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.9)] z-[40]"
      />

      {/* Bottom - saída extra */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3.5 h-3.5 bottom-[-7px] left-1/2 -translate-x-1/2 rounded-full border-2 border-slate-900 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] z-[40]"
      />
    </div>
  )
})

PageNode.displayName = "PageNode"

export default PageNode
