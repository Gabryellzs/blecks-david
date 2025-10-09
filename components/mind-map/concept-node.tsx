"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type ConceptNodeProps = NodeProps<{
  label: string
  url?: string
  color?: string
  isRoot?: boolean
}>

function ConceptNode({ data, selected }: ConceptNodeProps) {
  const { label, url, color = "#8a2be2", isRoot } = data

  return (
    <div
      className={`px-4 py-2 rounded-md cursor-move transition-all duration-200 ${
        selected ? "shadow-md shadow-purple-400" : "shadow-sm"
      } ${isRoot ? "font-bold" : ""}`}
      style={{
        border: `2px solid ${color}`,
        backgroundColor: isRoot ? color : "white",
        color: isRoot ? "white" : "black",
        minWidth: "120px",
        maxWidth: "300px",
      }}
    >
      <div className="flex flex-col">
        <div className="text-center whitespace-normal break-words">{label}</div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 underline mt-1 truncate hover:text-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3" style={{ backgroundColor: color }} />
      <Handle type="source" position={Position.Right} className="w-3 h-3" style={{ backgroundColor: color }} />
    </div>
  )
}

export default memo(ConceptNode)
