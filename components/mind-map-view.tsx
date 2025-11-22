"use client"

import React, { useCallback, useState } from "react"
import ReactFlow, {
  ReactFlowProvider,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
} from "reactflow"
import "reactflow/dist/style.css"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

import {
  Save,
  Download,
  Trash2,
  LayoutGrid,
  FileText,
  Grid3x3,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize,
  Moon,
  Sun,
  ArrowRight,
  PlusCircle,
  Search,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Video,
  DollarSign,
  MessageCircle,
  ShoppingCart,
  MessageSquare,
  FileBarChart,
  Target,
  BarChart,
  Users,
  Clock,
  HelpCircle,
  Layers,
  FileCode,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeft,
  CreditCard,
  ThumbsUp,
  FileQuestion,
  Info,
  Lock,
  BarChart2,
  Plus,
  Edit,
  Copy,
  Circle,
  Minus,
  X,
  Settings,
  Lightbulb,
  ListChecks,
  FileCheck,
  CheckCircle,
  Upload,
  Calendar,
  Briefcase,
} from "lucide-react"

// ===============================
// NODES INICIAIS (EXEMPLO)
// ===============================

const initialNodes: Node[] = [
  {
    id: "entrada",
    type: "default",
    position: { x: 0, y: 0 },
    data: { label: "Entrada do Funil" },
  },
  {
    id: "audiencia",
    type: "default",
    position: { x: -200, y: 150 },
    data: { label: "Audiência / Público" },
  },
  {
    id: "campanha",
    type: "default",
    position: { x: 200, y: 150 },
    data: { label: "Campanha / Criativos" },
  },
  {
    id: "pagina",
    type: "default",
    position: { x: 0, y: 300 },
    data: { label: "Página de Captura / VSL" },
  },
  {
    id: "conversao",
    type: "default",
    position: { x: 0, y: 450 },
    data: { label: "Conversão / Oferta Principal" },
  },
]

const initialEdges: Edge[] = [
  { id: "e1", source: "entrada", target: "audiencia", type: "smoothstep" },
  { id: "e2", source: "entrada", target: "campanha", type: "smoothstep" },
  { id: "e3", source: "campanha", target: "pagina", type: "smoothstep" },
  { id: "e4", source: "pagina", target: "conversao", type: "smoothstep" },
]

// ===============================
// CANVAS DO MAPA MENTAL
// ===============================

function MindMapCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isDark, setIsDark] = useState(true)
  const [showGrid, setShowGrid] = useState(true)

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds))
    },
    [setEdges],
  )

  const handleReset = () => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }

  const handleClear = () => {
    setNodes([])
    setEdges([])
  }

  const handleAddNode = () => {
    const id = `node-${nodes.length + 1}`
    setNodes((prev) => [
      ...prev,
      {
        id,
        type: "default",
        position: { x: 0, y: 150 + prev.length * 80 },
        data: { label: `Novo Bloco ${prev.length + 1}` },
      },
    ])
  }

  return (
    <div className="mt-20 px-3 pb-6 flex h-full min-h-[600px] flex-col gap-3 md:px-0">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/60 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80">
            <LayoutGrid className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              Mapa Mental de Marketing
            </h2>
            <p className="text-xs text-slate-400">
              Estruture seu funil visualmente e organize suas campanhas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-500/60 bg-emerald-500/10 text-[11px] font-medium text-emerald-300"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Autosave em breve
          </Badge>

          <div className="h-5 w-px bg-slate-700/70" />

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 border-slate-700/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
            onClick={handleAddNode}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 border-slate-700/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
            onClick={handleReset}
          >
            <RotateCwIcon />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 border-slate-700/80 bg-slate-900/80 text-rose-300 hover:bg-rose-900/40"
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 border-slate-700/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
            onClick={() => setShowGrid((v) => !v)}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 border-slate-700/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
            onClick={() => setIsDark((v) => !v)}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            className="ml-1 gap-1 rounded-full bg-sky-500 px-3 text-xs font-semibold text-slate-950 hover:bg-sky-400"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar Mapa
          </Button>
        </div>
      </div>

      {/* Canvas + Sidebar */}
      <div className="grid h-full min-h-[520px] gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.7fr)]">
        {/* Canvas do ReactFlow */}
        <Card className="relative overflow-hidden border-slate-800/80 bg-slate-950/80 shadow-lg shadow-sky-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-800/70 pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-50">
                Fluxo visual
              </CardTitle>
              <p className="text-xs text-slate-400">
                Arraste, conecte e reorganize os blocos do seu funil.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Circle className="h-2 w-2 text-emerald-400" />
              <span>Mapa ativo</span>
            </div>
          </CardHeader>
          <CardContent className="h-[460px] p-0">
            <div className="h-full w-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
              >
                {showGrid && (
                  <Background
                    color={isDark ? "#1e293b" : "#cbd5f5"}
                    gap={18}
                    size={1}
                  />
                )}
                <MiniMap
                  className="!bg-slate-900/80 !border !border-slate-800"
                  maskColor={isDark ? "#020617ee" : "#0f172acc"}
                  nodeStrokeColor={() => "#38bdf8"}
                  nodeColor={() => "#0f172a"}
                />
              </ReactFlow>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar/checklist */}
        <Card className="border-slate-800/80 bg-slate-950/80">
          <CardHeader className="space-y-1 border-b border-slate-800/70 pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-50">
              Blueprint do Funil
              <Badge className="gap-1 rounded-full bg-sky-500/10 px-2 py-0 text-[10px] font-medium text-sky-300">
                <Briefcase className="h-3 w-3" />
                Estrutura PRO
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <ScrollArea className="h-[420px] pr-2">
              <div className="space-y-3 text-xs text-slate-300">
                <SectionTitle icon={Target} label="Objetivo principal" />
                <ChecklistItem label="Definir o que é uma conversão (lead, venda, agendamento, etc.)" />
                <ChecklistItem label="Escolher um único produto / oferta principal" />

                <SectionTitle icon={Users} label="Audiência e tráfego" />
                <ChecklistItem label="Mapa de interesses, dores e desejos do público" />
                <ChecklistItem label="Definir canais principais (Meta Ads, Google, Orgânico, etc.)" />
                <ChecklistItem label="Separar campanhas por nível de consciência" />

                <SectionTitle icon={FileText} label="Páginas e ativos" />
                <ChecklistItem label="Página de captura / VSL configurada" />
                <ChecklistItem label="Página de obrigado com pixel configurado" />
                <ChecklistItem label="Oferta com garantia e prova social" />

                <SectionTitle icon={MessageCircle} label="Follow-up e recorrência" />
                <ChecklistItem label="Fluxo de WhatsApp / e-mail para leads não convertidos" />
                <ChecklistItem label="Oferta de recorrência / assinatura mapeada" />

                <SectionTitle icon={BarChart2} label="Métricas mínimas" />
                <ChecklistItem label="Custo por lead (CPL) alvo definido" />
                <ChecklistItem label="ROAS mínimo aceitável" />
                <ChecklistItem label="Taxa de conversão por etapa do funil" />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ===============================
// COMPONENTES AUXILIARES
// ===============================

function RotateCwIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 3v6h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.51 9A9 9 0 1 0 6 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
}) {
  return (
    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      <Icon className="h-3.5 w-3.5 text-sky-400" />
      <span>{label}</span>
    </div>
  )
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-slate-800/70 bg-slate-950/70 p-2">
      <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
        <CheckCircle className="h-3 w-3 text-emerald-400" />
      </div>
      <p className="text-[11px] leading-snug text-slate-300">{label}</p>
    </div>
  )
}

// ===============================
// EXPORT DEFAULT
// ===============================

export default function MindMapView() {
  return (
    <ReactFlowProvider>
      <MindMapCanvas />
    </ReactFlowProvider>
  )
}
