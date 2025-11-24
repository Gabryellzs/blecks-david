"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { FileText, Play, BarChart2 } from "lucide-react"

function ContentNode({ data }: NodeProps) {
  const accent = data.color || "#3b82f6"
  const tag = data.tag || data.contentType || "CONTENT"
  const iconType = (data.iconType || tag || "").toString().toLowerCase()

  const renderIcon = () => {
    if (iconType.includes("video") || iconType.includes("webinar")) {
      return <Play className="h-4 w-4 text-white" />
    }
    if (iconType.includes("report") || iconType.includes("analytics")) {
      return <BarChart2 className="h-4 w-4 text-white" />
    }
    return <FileText className="h-4 w-4 text-white" />
  }

  return (
    <div
      className={[
        "relative rounded-xl border shadow-[0_16px_40px_rgba(0,0,0,0.7)]",
        "bg-[#050816]/95 text-slate-100 w-[230px] transition-all duration-150",
        "border-slate-800 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]",
      ].join(" ")}
    >
      {/* Top bar estilo janela */}
      <div className="flex items-center justify-between border-b border-slate-800/70 bg-[#020617] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <div
          className="rounded-full px-2 py-[2px] text-[9px] font-medium tracking-[0.15em] uppercase"
          style={{
            border: `1px solid ${accent}60`,
            color: accent,
          }}
        >
          {tag}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md shadow-md"
            style={{
              background: accent,
              boxShadow: `0 0 10px ${accent}80`,
            }}
          >
            {renderIcon()}
          </div>

          <div className="flex flex-col">
            <span className="text-[12px] font-semibold leading-tight">
              {data.label || "Content Piece"}
            </span>
            {data.description && (
              <span className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                {data.description}
              </span>
            )}
          </div>
        </div>

        {/* Linhas de conteúdo fake */}
        <div className="space-y-1.5 mt-1">
          <div className="h-1.5 w-11/12 rounded-md bg-slate-800" />
          <div className="h-1.5 w-9/12 rounded-md bg-slate-800" />
          <div className="h-1.5 w-6/12 rounded-md bg-slate-900" />
        </div>
      </div>

      {/* Handles pra fora do card */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 -left-3 top-1/2 -translate-y-1/2 rounded-full border-2 bg-slate-950 z-[40]"
        style={{
          borderColor: accent,
          boxShadow: `0 0 12px ${accent}a0`,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 -right-3 top-1/2 -translate-y-1/2 rounded-full border-2 bg-slate-950 z-[40]"
        style={{
          background: accent,
          borderColor: "#000",
          boxShadow: `0 0 12px ${accent}b0`,
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3.5 h-3.5 top-[-7px] left-1/2 -translate-x-1/2 rounded-full border-2 bg-slate-950 z-[40]"
        style={{
          borderColor: accent,
          boxShadow: `0 0 10px ${accent}a0`,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3.5 h-3.5 bottom-[-7px] left-1/2 -translate-x-1/2 rounded-full border-2 bg-slate-950 z-[40]"
        style={{
          background: accent,
          borderColor: "#000",
          boxShadow: `0 0 10px ${accent}a0`,
        }}
      />
    </div>
  )
}

export default memo(ContentNode)
