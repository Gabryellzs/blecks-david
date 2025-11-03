import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Megaphone } from "lucide-react"

function CampaignNode({ data }: NodeProps) {
  return (
    <div
      className="relative bg-white rounded-xl shadow-md border-2 cursor-move"
      style={{
        borderColor: data.color,
        width: 280,
        minHeight: 100,
        overflow: "hidden",
      }}
    >
      {/* conteúdo interno */}
      <div className="flex items-center p-4 gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
          style={{ backgroundColor: data.color }}
        >
          <Megaphone className="h-6 w-6 text-white" />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold leading-tight">{data.label}</span>
          {data.description && (
            <span className="text-xs text-gray-500">{data.description}</span>
          )}
        </div>
      </div>

      {/* Handles centralizados */}
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        style={{
          left: -10,
          top: "50%",
          transform: "translateY(-50%)",
          background: data.color || "#3b82f6",
          border: "2px solid #fff",
          width: 12,
          height: 12,
        }}
      />

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{
          right: -10,
          top: "50%",
          transform: "translateY(-50%)",
          background: data.color || "#3b82f6",
          border: "2px solid #fff",
          width: 12,
          height: 12,
        }}
      />
    </div>
  )
}

export default memo(CampaignNode)
