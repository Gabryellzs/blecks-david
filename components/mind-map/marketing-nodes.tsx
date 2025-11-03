import { memo } from "react"
import { Handle, Position } from "reactflow"
import { FileText, BarChart2, Mail, Megaphone, Share2 } from "lucide-react"

/** ---------- Helpers comuns (mantém tudo alinhado) ---------- */
const HandleDot = ({
  position,
  color,
  id,
}: {
  position: Position
  color: string
  id: string
}) => {
  const base: React.CSSProperties = {
    background: color,
    border: "2px solid #fff",
    width: 12,
    height: 12,
  }

  if (position === Position.Left) {
    Object.assign(base, { left: -10, top: "50%", transform: "translateY(-50%)" })
  } else if (position === Position.Right) {
    Object.assign(base, { right: -10, top: "50%", transform: "translateY(-50%)" })
  } else if (position === Position.Top) {
    Object.assign(base, { top: -10, left: "50%", transform: "translateX(-50%)" })
  } else if (position === Position.Bottom) {
    Object.assign(base, { bottom: -10, left: "50%", transform: "translateX(-50%)" })
  }

  // type: source/target definido pelo lado
  const type = position === Position.Left || position === Position.Top ? "target" : "source"

  return <Handle id={id} type={type as any} position={position} style={base} />
}

const NodeCard: React.FC<{
  borderColor: string
  width?: number
  minHeight?: number
  children: React.ReactNode
  handles?: Array<{ id: string; position: Position; color: string }>
}> = ({ borderColor, width = 260, minHeight = 120, children, handles = [] }) => (
  <div
    className="relative rounded-md bg-white border-2 shadow-md"
    style={{ borderColor, width, minHeight, overflow: "hidden" }}
  >
    {/* conteúdo com padding separado (evita deslocar os handles) */}
    <div className="absolute inset-0 p-4">{children}</div>
    {handles.map((h) => (
      <HandleDot key={h.id} id={h.id} position={h.position} color={h.color} />
    ))}
  </div>
)

/** ---------- Nós específicos (todos corrigidos) ---------- */

// Nó de Criação de Conteúdo (Vermelho)
export const ContentCreationNode = memo(function ContentCreationNode({ data }: { data: any }) {
  const color = "#ef4444" // red-500
  return (
    <NodeCard
      borderColor={color}
      handles={[
        { id: "t", position: Position.Top, color },
        { id: "r", position: Position.Right, color },
        { id: "b", position: Position.Bottom, color },
        { id: "l", position: Position.Left, color },
      ]}
    >
      <div className="flex items-start mb-3">
        <div className="mr-2" style={{ color }}>
          <FileText size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de criação de conteúdo</div>
      </div>

      <div className="text-sm">
        <div className="font-medium mb-1" style={{ color }}>
          Tipos de Conteúdo:
        </div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Posts de blog</li>
          <li>Vídeos</li>
          <li>Infográficos</li>
          <li>Whitepapers</li>
          <li>Posts de mídia social</li>
        </ul>
      </div>
    </NodeCard>
  )
})

// Nó de Análise de Marketing (Amarelo)
export const MarketingAnalysisNode = memo(function MarketingAnalysisNode({ data }: { data: any }) {
  const color = "#eab308" // yellow-500
  return (
    <NodeCard
      borderColor={color}
      handles={[
        { id: "t", position: Position.Top, color },
        { id: "r", position: Position.Right, color },
        { id: "b", position: Position.Bottom, color },
        { id: "l", position: Position.Left, color },
      ]}
    >
      <div className="flex items-start mb-3">
        <div className="mr-2" style={{ color }}>
          <BarChart2 size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de análise de marketing</div>
      </div>

      <div className="text-sm">
        <div className="font-medium mb-1" style={{ color }}>
          Métricas Principais:
        </div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Taxa de conversão</li>
          <li>Engajamento</li>
          <li>ROI</li>
          <li>Taxa de cliques</li>
        </ul>
      </div>
    </NodeCard>
  )
})

// Nó de Marketing por Email (Verde)
export const EmailMarketingNode = memo(function EmailMarketingNode({ data }: { data: any }) {
  const color = "#22c55e" // green-500
  return (
    <NodeCard
      borderColor={color}
      handles={[
        { id: "t", position: Position.Top, color },
        { id: "r", position: Position.Right, color },
        { id: "b", position: Position.Bottom, color },
        { id: "l", position: Position.Left, color },
      ]}
    >
      <div className="flex items-start mb-3">
        <div className="mr-2" style={{ color }}>
          <Mail size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de marketing por email</div>
      </div>

      <div className="text-sm">
        <div className="font-medium mb-1" style={{ color }}>
          Campanha de Email:
        </div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Linha de assunto</li>
          <li>Conteúdo do email</li>
          <li>Segmentação de público</li>
          <li>Teste A/B</li>
        </ul>
      </div>
    </NodeCard>
  )
})

// Nó de Campanha de Marketing (Azul Escuro)
export const MarketingCampaignNode = memo(function MarketingCampaignNode({ data }: { data: any }) {
  const color = "#1e3a8a" // blue-900
  return (
    <NodeCard
      borderColor={color}
      handles={[
        { id: "t", position: Position.Top, color },
        { id: "r", position: Position.Right, color },
        { id: "b", position: Position.Bottom, color },
        { id: "l", position: Position.Left, color },
      ]}
    >
      <div className="flex items-start mb-3">
        <div className="mr-2" style={{ color }}>
          <Megaphone size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de campanha de marketing</div>
      </div>

      <div className="text-sm">
        <div className="font-medium mb-1" style={{ color }}>
          Detalhes da Campanha:
        </div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Público-alvo</li>
          <li>Objetivos da campanha</li>
          <li>Cronograma e orçamento</li>
        </ul>
      </div>
    </NodeCard>
  )
})

// Nó de Marketing em Mídia Social (Roxo)
export const SocialMediaMarketingNode = memo(function SocialMediaMarketingNode({ data }: { data: any }) {
  const color = "#a855f7" // purple-500
  return (
    <NodeCard
      borderColor={color}
      handles={[
        { id: "t", position: Position.Top, color },
        { id: "r", position: Position.Right, color },
        { id: "b", position: Position.Bottom, color },
        { id: "l", position: Position.Left, color },
      ]}
    >
      <div className="flex items-start mb-3">
        <div className="mr-2" style={{ color }}>
          <Share2 size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de marketing em mídia social</div>
      </div>

      <div className="text-sm">
        <div className="font-medium mb-1" style={{ color }}>
          Canais de Mídia Social:
        </div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Instagram</li>
          <li>Facebook</li>
          <li>Twitter</li>
          <li>LinkedIn</li>
          <li>TikTok</li>
        </ul>
      </div>
    </NodeCard>
  )
})
