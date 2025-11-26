// components/funnel-node.tsx
"use client"

import type { NodeProps } from "reactflow"

export function FunnelNode({ data }: NodeProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#05070b] px-4 py-3 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
      {/* Tipo do nó / categoria */}
      <div className="mb-1 text-[10px] uppercase tracking-wide text-white/40">
        {data.kind}
      </div>

      {/* Título principal */}
      <div className="text-sm font-semibold text-white">{data.title}</div>

      {/* Subtítulo / descrição */}
      {data.subtitle && (
        <div className="mt-1 text-xs text-white/60">{data.subtitle}</div>
      )}

      {/* Botão CTA */}
      {data.ctaLabel && (
        <button className="mt-3 inline-flex h-7 items-center justify-center rounded-full bg-white/10 px-3 text-[11px] font-medium text-white hover:bg-white/20">
          {data.ctaLabel}
        </button>
      )}
    </div>
  )
}
