import { Handle, Position } from "reactflow"
import {
  Edit,
  FileText,
  Lightbulb,
  Search,
  ListChecks,
  FileCheck,
  CheckCircle,
  Upload,
  MessageCircle,
} from "lucide-react"

// Mapeamento de ícones para diferentes tipos de nós de escrita
const iconMap: Record<string, any> = {
  ideation: Lightbulb,
  research: Search,
  outline: ListChecks,
  draft: Edit,
  revision: FileCheck,
  feedback: MessageCircle,
  finalization: CheckCircle,
  publication: Upload,
  default: FileText,
}

export default function WritingNode({ data }: { data: any }) {
  // Determinar qual ícone usar com base no tipo do nó
  const IconComponent = data.nodeType && iconMap[data.nodeType] ? iconMap[data.nodeType] : iconMap.default

  return (
    <div
      className="relative bg-white rounded-md border-2 p-4 w-[260px]"
      style={{ borderColor: data.color || "#3498db" }}
    >
      {/* Pontos de conexão */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3"
        style={{ backgroundColor: data.color || "#3498db" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3"
        style={{ backgroundColor: data.color || "#3498db" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
        style={{ backgroundColor: data.color || "#3498db" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3"
        style={{ backgroundColor: data.color || "#3498db" }}
      />

      {/* Ícone e título */}
      <div className="flex items-start mb-3">
        <div className="mr-2" style={{ color: data.color || "#3498db" }}>
          <IconComponent size={20} />
        </div>
        <div className="text-gray-800 font-medium">{data.label || "Nó de escrita"}</div>
      </div>

      {/* Conteúdo */}
      <div className="text-sm">
        <div className="font-medium mb-1" style={{ color: data.color || "#3498db" }}>
          {data.title || "Etapa de escrita:"}
        </div>
        <p className="text-gray-700">{data.description || "Descrição da etapa de escrita"}</p>

        {data.tasks && data.tasks.length > 0 && (
          <>
            <div className="font-medium mt-2 mb-1" style={{ color: data.color || "#3498db" }}>
              Tarefas:
            </div>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              {data.tasks.map((task: string, index: number) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
