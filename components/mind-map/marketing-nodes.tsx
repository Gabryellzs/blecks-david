import { Handle, Position } from "reactflow"
import { FileText, BarChart2, Mail, Megaphone, Share2 } from "lucide-react"

// Nó de Criação de Conteúdo (Vermelho)
export function ContentCreationNode({ data }: { data: any }) {
  return (
    <div className="relative bg-white rounded-md border-2 border-red-500 p-4 w-[260px]">
      {/* Pontos de conexão */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-red-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-red-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-red-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-red-500" />

      {/* Ícone e título */}
      <div className="flex items-start mb-3">
        <div className="mr-2 text-red-500">
          <FileText size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de criação de conteúdo</div>
      </div>

      {/* Conteúdo */}
      <div className="text-sm">
        <div className="font-medium text-red-500 mb-1">Tipos de Conteúdo:</div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Posts de blog</li>
          <li>Vídeos</li>
          <li>Infográficos</li>
          <li>Whitepapers</li>
          <li>Posts de mídia social</li>
        </ul>
      </div>
    </div>
  )
}

// Nó de Análise de Marketing (Amarelo)
export function MarketingAnalysisNode({ data }: { data: any }) {
  return (
    <div className="relative bg-white rounded-md border-2 border-yellow-500 p-4 w-[260px]">
      {/* Pontos de conexão */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-yellow-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-500" />

      {/* Ícone e título */}
      <div className="flex items-start mb-3">
        <div className="mr-2 text-yellow-500">
          <BarChart2 size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de análise de marketing</div>
      </div>

      {/* Conteúdo */}
      <div className="text-sm">
        <div className="font-medium text-yellow-500 mb-1">Métricas Principais:</div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Taxa de conversão</li>
          <li>Engajamento</li>
          <li>ROI</li>
          <li>Taxa de cliques</li>
        </ul>
      </div>
    </div>
  )
}

// Nó de Marketing por Email (Verde)
export function EmailMarketingNode({ data }: { data: any }) {
  return (
    <div className="relative bg-white rounded-md border-2 border-green-500 p-4 w-[260px]">
      {/* Pontos de conexão */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500" />

      {/* Ícone e título */}
      <div className="flex items-start mb-3">
        <div className="mr-2 text-green-500">
          <Mail size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de marketing por email</div>
      </div>

      {/* Conteúdo */}
      <div className="text-sm">
        <div className="font-medium text-green-500 mb-1">Campanha de Email:</div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Linha de assunto</li>
          <li>Conteúdo do email</li>
          <li>Segmentação de público</li>
          <li>Teste A/B</li>
        </ul>
      </div>
    </div>
  )
}

// Nó de Campanha de Marketing (Azul Escuro)
export function MarketingCampaignNode({ data }: { data: any }) {
  return (
    <div className="relative bg-white rounded-md border-2 border-blue-900 p-4 w-[260px]">
      {/* Pontos de conexão */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-900" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-900" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-900" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-900" />

      {/* Ícone e título */}
      <div className="flex items-start mb-3">
        <div className="mr-2 text-blue-900">
          <Megaphone size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de campanha de marketing</div>
      </div>

      {/* Conteúdo */}
      <div className="text-sm">
        <div className="font-medium text-blue-900 mb-1">Detalhes da Campanha:</div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Público-alvo</li>
          <li>Objetivos da campanha</li>
          <li>Cronograma e orçamento</li>
        </ul>
      </div>
    </div>
  )
}

// Nó de Marketing em Mídia Social (Roxo)
export function SocialMediaMarketingNode({ data }: { data: any }) {
  return (
    <div className="relative bg-white rounded-md border-2 border-purple-500 p-4 w-[260px]">
      {/* Pontos de conexão */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />

      {/* Ícone e título */}
      <div className="flex items-start mb-3">
        <div className="mr-2 text-purple-500">
          <Share2 size={20} />
        </div>
        <div className="text-gray-800 font-medium">Nó de marketing em mídia social</div>
      </div>

      {/* Conteúdo */}
      <div className="text-sm">
        <div className="font-medium text-purple-500 mb-1">Canais de Mídia Social:</div>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Instagram</li>
          <li>Facebook</li>
          <li>Twitter</li>
          <li>LinkedIn</li>
          <li>TikTok</li>
        </ul>
      </div>
    </div>
  )
}
