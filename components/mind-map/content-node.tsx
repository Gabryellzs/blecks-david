import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { FileText } from "lucide-react"

function ContentNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 cursor-move" style={{ borderColor: data.color }}>
      <div className="flex items-center">
        <div
          className="rounded-full w-10 h-10 flex items-center justify-center"
          style={{ backgroundColor: data.color }}
        >
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label}</div>
          {data.description && <div className="text-xs text-gray-500">{data.description}</div>}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
    </div>
  )
}

export default memo(ContentNode)
