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

  return (
    <div
      className={`relative rounded-md overflow-hidden border ${
        selected ? "border-blue-500" : "border-gray-700"
      } bg-black shadow-lg w-[180px]`}
    >
      {/* Barra de navegador simulada */}
      <div className="h-6 bg-gray-900 flex items-center px-2">
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        </div>
      </div>

      {/* Cabeçalho com título */}
      <div className="p-3">
        <div className="text-sm font-medium text-white mb-1">{data.label}</div>
        {data.description && <div className="text-xs text-gray-400 mb-2">{data.description}</div>}

        {/* Representação visual do conteúdo da página */}
        <div className="space-y-2 mb-2">
          <div className="h-2 bg-gray-800 rounded w-full"></div>
          <div className="h-2 bg-gray-800 rounded w-5/6"></div>
          <div className="h-2 bg-gray-800 rounded w-4/6"></div>
        </div>

        {/* Botão de call to action */}
        {data.hasCallToAction && (
          <div className="mt-2 py-1 px-2 bg-white text-black text-xs font-medium text-center rounded">
            {getButtonText()}
          </div>
        )}
      </div>

      {/* Conectores */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
    </div>
  )
})

PageNode.displayName = "PageNode"

export default PageNode
