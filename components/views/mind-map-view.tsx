"use client"

import React from "react"
import { useState, useCallback, useEffect } from "react"
import {
  Save,
  Trash2,
  LayoutGrid,
  FileText,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize,
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
  Edit,
  Copy,
  Circle,
  X,
  Lightbulb,
  ListChecks,
  FileCheck,
  CheckCircle,
  Upload,
  Calendar,
  Move,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useTheme } from "@/hooks/use-theme"
import { Card, CardContent } from "@/components/ui/card"

// Verificar se estamos no navegador
const isBrowser = typeof window !== "undefined"

// Função segura para acessar localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (isBrowser) {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (isBrowser) {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (isBrowser) {
      localStorage.removeItem(key)
    }
  },
}

// Tipos para os nós e conexões
interface MindMapNode {
  id: string
  type: "custom" | "marketing" | "page"
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    color?: string
    iconId?: string
    pageType?: string
  }
}

interface MindMapConnection {
  id: string
  source: string
  target: string
  style?: {
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
  }
  animated?: boolean
}

// Componente de nó personalizado
function CustomMindMapNode({
  node,
  onDrag,
  onDelete,
  isSelected,
  onSelect,
}: {
  node: MindMapNode
  onDrag: (id: string, position: { x: number; y: number }) => void
  onDelete: (id: string) => void
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    })
    onSelect(node.id)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }
        onDrag(node.id, newPosition)
      }
    },
    [isDragging, dragStart, node.id, onDrag],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (node.type === "marketing") {
    return (
      <div
        className={`absolute cursor-move ${isSelected ? "ring-2 ring-blue-500" : ""}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          transform: "translate(-50%, -50%)",
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 border-white relative group"
          style={{ backgroundColor: node.data.color || "#3498db" }}
        >
          <div className="w-8 h-8 text-white flex items-center justify-center">{getIconForType(node.data.iconId)}</div>

          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-center">
          <div className="bg-card border border-border rounded px-2 py-1 shadow-sm">
            <h3 className="text-foreground font-medium text-sm whitespace-nowrap">{node.data.label}</h3>
            {node.data.description && <p className="text-muted-foreground text-xs mt-1">{node.data.description}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`absolute cursor-move ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg min-w-[240px] max-w-[280px] relative group">
        {/* Header com botões de janela */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="w-4 h-2 bg-blue-500 rounded-full"></div>
        </div>

        {/* Conteúdo do card */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            {node.data.pageType && (
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                {getIconForPageType(node.data.pageType)}
              </div>
            )}
            <div>
              <h3 className="text-foreground font-semibold text-lg">{node.data.label}</h3>
              {node.data.description && <p className="text-muted-foreground text-sm">{node.data.description}</p>}
            </div>
          </div>

          {/* Linhas simulando conteúdo */}
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded w-full"></div>
            <div className="h-2 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded w-1/2"></div>
          </div>
        </div>

        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node.id)
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// Função para obter ícone baseado no tipo
function getIconForType(iconId?: string) {
  switch (iconId) {
    case "search":
      return <Search size={20} />
    case "facebook":
      return <Facebook size={20} />
    case "instagram":
      return <Instagram size={20} />
    case "youtube":
      return <Youtube size={20} />
    case "linkedin":
      return <Linkedin size={20} />
    case "email":
      return <Mail size={20} />
    case "video":
      return <Video size={20} />
    case "blog":
      return <FileText size={20} />
    case "users":
      return <Users size={20} />
    case "target":
      return <Target size={20} />
    case "chart":
      return <BarChart size={20} />
    case "shopping":
      return <ShoppingCart size={20} />
    case "message":
      return <MessageCircle size={20} />
    case "dollar":
      return <DollarSign size={20} />
    case "clock":
      return <Clock size={20} />
    case "calendar":
      return <Calendar size={20} />
    default:
      return <Circle size={20} />
  }
}

// Função para obter ícone baseado no tipo de página
function getIconForPageType(pageType: string) {
  switch (pageType) {
    case "landing":
      return <FileCode className="w-5 h-5 text-muted-foreground" />
    case "sales":
      return <ShoppingCart className="w-5 h-5 text-muted-foreground" />
    case "checkout":
      return <CreditCard className="w-5 h-5 text-muted-foreground" />
    case "thank-you":
      return <ThumbsUp className="w-5 h-5 text-muted-foreground" />
    case "webinar":
      return <Video className="w-5 h-5 text-muted-foreground" />
    case "blog":
      return <FileText className="w-5 h-5 text-muted-foreground" />
    case "about":
      return <Info className="w-5 h-5 text-muted-foreground" />
    case "contact":
      return <Mail className="w-5 h-5 text-muted-foreground" />
    case "faq":
      return <FileQuestion className="w-5 h-5 text-muted-foreground" />
    case "members":
      return <Lock className="w-5 h-5 text-muted-foreground" />
    case "comparison":
      return <BarChart2 className="w-5 h-5 text-muted-foreground" />
    case "affiliates":
      return <Users className="w-5 h-5 text-muted-foreground" />
    case "ideation":
      return <Lightbulb className="w-5 h-5 text-muted-foreground" />
    case "research":
      return <Search className="w-5 h-5 text-muted-foreground" />
    case "outline":
      return <ListChecks className="w-5 h-5 text-muted-foreground" />
    case "draft":
      return <Edit className="w-5 h-5 text-muted-foreground" />
    case "revision":
      return <FileCheck className="w-5 h-5 text-muted-foreground" />
    case "feedback":
      return <MessageCircle className="w-5 h-5 text-muted-foreground" />
    case "finalization":
      return <CheckCircle className="w-5 h-5 text-muted-foreground" />
    case "publication":
      return <Upload className="w-5 h-5 text-muted-foreground" />
    default:
      return <FileText className="w-5 h-5 text-muted-foreground" />
  }
}

// Componente para desenhar conexões SVG
function ConnectionsLayer({
  nodes,
  connections,
}: {
  nodes: MindMapNode[]
  connections: MindMapConnection[]
}) {
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {connections.map((connection) => {
        const sourceNode = nodes.find((n) => n.id === connection.source)
        const targetNode = nodes.find((n) => n.id === connection.target)

        if (!sourceNode || !targetNode) return null

        return (
          <line
            key={connection.id}
            x1={sourceNode.position.x}
            y1={sourceNode.position.y}
            x2={targetNode.position.x}
            y2={targetNode.position.y}
            stroke={connection.style?.stroke || "#6b7280"}
            strokeWidth={connection.style?.strokeWidth || 2}
            strokeDasharray={connection.style?.strokeDasharray}
            className={connection.animated ? "animate-pulse" : ""}
          />
        )
      })}
    </svg>
  )
}

// Ícones de marketing disponíveis
const marketingIcons = [
  { id: "search", label: "Pesquisa", icon: Search, color: "#FF5252", category: "acquisition" },
  { id: "blog", label: "Blog", icon: FileText, color: "#3498db", category: "content" },
  { id: "affiliates", label: "Afiliados", icon: Users, color: "#2ecc71", category: "acquisition" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#4267B2", category: "acquisition" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", category: "acquisition" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "#FF0000", category: "acquisition" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0077B5", category: "acquisition" },
  { id: "email", label: "Email", icon: Mail, color: "#3498db", category: "communication" },
  { id: "webinar", label: "Webinar", icon: Video, color: "#2ecc71", category: "content" },
  { id: "video", label: "Vídeo", icon: Video, color: "#e74c3c", category: "content" },
  { id: "conversation", label: "Conversação", icon: MessageCircle, color: "#3498db", category: "sales" },
  { id: "pipeline", label: "Pipeline", icon: BarChart, color: "#e74c3c", category: "sales" },
  { id: "front-end", label: "Front-end", icon: DollarSign, color: "#2ecc71", category: "customer" },
  { id: "back-end", label: "Back-end", icon: DollarSign, color: "#27ae60", category: "customer" },
  { id: "follow-up", label: "Acompanhamento", icon: Clock, color: "#3498db", category: "sales" },
  { id: "sms", label: "SMS", icon: MessageSquare, color: "#9b59b6", category: "communication" },
  { id: "order-page", label: "Página de Pedido", icon: ShoppingCart, color: "#2ecc71", category: "sales" },
  { id: "report", label: "Relatório", icon: FileBarChart, color: "#7f8c8d", category: "content" },
  { id: "support", label: "Assistência", icon: HelpCircle, color: "#e74c3c", category: "customer" },
  { id: "calendar", label: "Calendário", icon: Calendar, color: "#3498db", category: "conversion" },
]

// Templates disponíveis
const templateItems = [
  {
    id: "funnel-basic",
    label: "Funil de Vendas Básico",
    icon: LayoutTemplate,
    description: "Um funil de vendas clássico com landing page, página de vendas, checkout e acompanhamento por email",
  },
  {
    id: "webinar-funnel",
    label: "Funil de Webinar Profissional",
    icon: Video,
    description: "Funil completo para promoção, inscrição e conversão através de webinar",
  },
  {
    id: "content-marketing",
    label: "Marketing de Conteúdo",
    icon: FileText,
    description: "Estratégia completa de marketing de conteúdo com blog, SEO, redes sociais e conversão",
  },
  {
    id: "affiliate-marketing",
    label: "Marketing de Afiliados",
    icon: Users,
    description: "Estratégia completa para promover produtos como afiliado e maximizar comissões",
  },
]

// Páginas principais do funil
const mainPageItems = [
  {
    id: "landing",
    label: "Landing Page",
    description: "Página de captura de leads",
    icon: FileCode,
    category: "main",
    pageType: "landing",
  },
  {
    id: "sales",
    label: "Página de Vendas",
    description: "Página para converter visitantes em clientes",
    icon: ShoppingCart,
    category: "main",
    pageType: "sales",
  },
  {
    id: "checkout",
    label: "Checkout",
    description: "Página de finalização de compra",
    icon: CreditCard,
    category: "main",
    pageType: "checkout",
  },
  {
    id: "thank-you",
    label: "Agradecimento",
    description: "Página pós-compra com próximos passos",
    icon: ThumbsUp,
    category: "main",
    pageType: "thank-you",
  },
]

// Páginas de conteúdo
const contentPageItems = [
  {
    id: "webinar",
    label: "Página de Webinar",
    description: "Inscrição em webinar ou evento",
    icon: Video,
    category: "content",
    pageType: "webinar",
  },
  {
    id: "blog",
    label: "Blog",
    description: "Página de conteúdo e artigos",
    icon: FileText,
    category: "content",
    pageType: "blog",
  },
  {
    id: "comparison",
    label: "Comparação",
    description: "Comparação de produtos",
    icon: BarChart2,
    category: "content",
    pageType: "comparison",
  },
  {
    id: "affiliates",
    label: "Afiliados",
    description: "Programa de afiliados",
    icon: Users,
    category: "content",
    pageType: "affiliates",
  },
  {
    id: "members",
    label: "Área de Membros",
    description: "Login e área restrita",
    icon: Lock,
    category: "content",
    pageType: "members",
  },
  {
    id: "faq",
    label: "FAQ/Suporte",
    description: "Perguntas frequentes e suporte",
    icon: FileQuestion,
    category: "content",
    pageType: "faq",
  },
  {
    id: "about",
    label: "Sobre Nós",
    description: "Sobre a empresa ou marca",
    icon: Info,
    category: "content",
    pageType: "about",
  },
  {
    id: "contact",
    label: "Contato",
    description: "Informações de contato",
    icon: Mail,
    category: "content",
    pageType: "contact",
  },
]

// Todas as páginas combinadas
const pageItems = [...mainPageItems, ...contentPageItems]

// Componente principal
export default function MindMapView() {
  const [isClient, setIsClient] = useState(false)
  const { theme } = useTheme()
  const { toast } = useToast()

  const [activeView, setActiveView] = useState<"dashboard" | "editor">("dashboard")
  const [activeNavItem, setActiveNavItem] = useState<"pages" | "templates" | "icons">("templates")
  const [showPanel, setShowPanel] = useState<"pages" | "templates" | "icons" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSidebar, setShowSidebar] = useState(false)

  const [nodes, setNodes] = useState<MindMapNode[]>([])
  const [connections, setConnections] = useState<MindMapConnection[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [flowName, setFlowName] = useState("Novo Projeto de Marketing")

  const [savedFlows, setSavedFlows] = useLocalStorage<
    {
      name: string
      nodes: MindMapNode[]
      connections: MindMapConnection[]
    }[]
  >("mind-map-flows", [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleDashboardClick = () => {
    setActiveView("dashboard")
  }

  const handleFunnelClick = () => {
    setActiveView("editor")
  }

  const handleCreateProject = () => {
    setActiveView("editor")
  }

  const handleNavClick = (navItem: "pages" | "templates" | "icons") => {
    if (activeNavItem === navItem && showPanel === navItem) {
      setShowPanel(null)
      setShowSidebar(false)
    } else {
      setActiveNavItem(navItem)
      setShowPanel(navItem)
      setShowSidebar(true)
    }
    setSearchTerm("")
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  const handleNodeDrag = (id: string, position: { x: number; y: number }) => {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, position } : node)))
  }

  const handleNodeDelete = (id: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== id))
    setConnections((prev) => prev.filter((conn) => conn.source !== id && conn.target !== id))
    setSelectedNodeId(null)
  }

  const handleNodeSelect = (id: string) => {
    setSelectedNodeId(id)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNodeId(null)
    }
  }

  const addNode = (type: "custom" | "marketing" | "page", data: any) => {
    const newNode: MindMapNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 400, y: 300 },
      data,
    }
    setNodes((prev) => [...prev, newNode])

    toast({
      title: "Item adicionado",
      description: `${data.label} foi adicionado ao mapa mental.`,
    })
  }

  const saveFlow = () => {
    if (nodes.length === 0) {
      toast({
        title: "Erro ao salvar",
        description: "Não é possível salvar um fluxo vazio.",
        variant: "destructive",
      })
      return
    }

    const newFlow = {
      name: flowName,
      nodes,
      connections,
    }

    const existingFlowIndex = savedFlows.findIndex((flow) => flow.name === flowName)

    if (existingFlowIndex >= 0) {
      const updatedFlows = [...savedFlows]
      updatedFlows[existingFlowIndex] = newFlow
      setSavedFlows(updatedFlows)
    } else {
      setSavedFlows([...savedFlows, newFlow])
    }

    toast({
      title: "Fluxo salvo",
      description: `O fluxo "${flowName}" foi salvo com sucesso.`,
    })

    setActiveView("dashboard")
  }

  const clearFlow = () => {
    if (nodes.length === 0) return

    setNodes([])
    setConnections([])
    setFlowName("Novo Projeto de Marketing")
    setSelectedNodeId(null)

    toast({
      title: "Fluxo limpo",
      description: "Todos os elementos foram removidos do fluxo.",
    })
  }

  const loadFlow = (flow: { name: string; nodes: MindMapNode[]; connections: MindMapConnection[] }) => {
    setNodes(flow.nodes)
    setConnections(flow.connections)
    setFlowName(flow.name)
    setActiveView("editor")
  }

  const deleteFlow = (index: number) => {
    const updatedFlows = [...savedFlows]
    updatedFlows.splice(index, 1)
    setSavedFlows(updatedFlows)

    toast({
      title: "Fluxo excluído",
      description: "O fluxo foi excluído com sucesso.",
    })
  }

  const duplicateFlow = (
    flow: { name: string; nodes: MindMapNode[]; connections: MindMapConnection[] },
    index: number,
  ) => {
    const newFlow = {
      ...flow,
      name: `${flow.name} (cópia)`,
    }

    const updatedFlows = [...savedFlows]
    updatedFlows.splice(index + 1, 0, newFlow)
    setSavedFlows(updatedFlows)

    toast({
      title: "Fluxo duplicado",
      description: `Uma cópia de "${flow.name}" foi criada.`,
    })
  }

  const filteredIcons = marketingIcons.filter((icon) => icon.label.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredTemplates = templateItems.filter(
    (template) =>
      template.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredMainPages = mainPageItems.filter(
    (page) =>
      page.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredContentPages = contentPageItems.filter(
    (page) =>
      page.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!isClient) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header com navegação horizontal */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          {/* Navegação horizontal */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={handleDashboardClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "dashboard"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <LayoutGrid size={16} />
              Dashboard
            </button>
            <button
              onClick={handleFunnelClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "editor"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <FileText size={16} />
              Criação de Funil
            </button>
          </div>
        </div>

        {/* Botão de toggle da sidebar (apenas no editor) */}
        {activeView === "editor" && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            aria-label={showSidebar ? "Esconder painel" : "Mostrar painel"}
          >
            {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        )}
      </div>

      <div className="flex-1 flex">
        {activeView === "dashboard" ? (
          <DashboardView
            savedFlows={savedFlows}
            onCreateProject={handleCreateProject}
            onLoadFlow={loadFlow}
            onDeleteFlow={deleteFlow}
            onDuplicateFlow={duplicateFlow}
          />
        ) : (
          <>
            <div className="w-[60px] bg-background border-r border-border">
              <NavButton
                icon={<FileText size={20} />}
                label="Páginas"
                active={activeNavItem === "pages"}
                onClick={() => handleNavClick("pages")}
              />
              <NavButton
                icon={<Layers size={20} />}
                label="Templates"
                active={activeNavItem === "templates"}
                onClick={() => handleNavClick("templates")}
              />
              <NavButton
                icon={<Palette size={20} />}
                label="Ícones"
                active={activeNavItem === "icons"}
                onClick={() => handleNavClick("icons")}
              />
            </div>

            <div className="flex-1 flex">
              {showPanel && (
                <div className="w-[300px] bg-background border-r border-border flex flex-col">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-4">
                      {showPanel === "pages" && <FileText size={20} />}
                      {showPanel === "templates" && <Layers size={20} />}
                      {showPanel === "icons" && <Palette size={20} />}
                      <h2 className="text-lg font-semibold">
                        {showPanel === "pages" && "Páginas"}
                        {showPanel === "templates" && "Templates"}
                        {showPanel === "icons" && "Ícones"}
                      </h2>
                    </div>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        size={16}
                      />
                      <Input
                        placeholder={`Buscar ${
                          showPanel === "pages" ? "páginas" : showPanel === "templates" ? "templates" : "ícones"
                        }...`}
                        className="pl-9 bg-card border-border text-foreground"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    {showPanel === "pages" && (
                      <div className="space-y-3">
                        <div className="mb-4 p-3 bg-card rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Contém componentes relacionados a diferentes tipos de páginas usadas em funis de marketing.
                          </p>
                        </div>

                        {filteredMainPages.length > 0 && (
                          <div className="space-y-2">
                            {filteredMainPages.map((page) => (
                              <DraggablePageItem
                                key={page.id}
                                page={page}
                                onAdd={() =>
                                  addNode("page", {
                                    label: page.label,
                                    description: page.description,
                                    pageType: page.pageType,
                                  })
                                }
                              />
                            ))}
                          </div>
                        )}

                        {filteredContentPages.length > 0 && (
                          <div className="mt-6 mb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Páginas de Conteúdo</h3>
                          </div>
                        )}

                        {filteredContentPages.length > 0 && (
                          <div className="space-y-2">
                            {filteredContentPages.map((page) => (
                              <DraggablePageItem
                                key={page.id}
                                page={page}
                                onAdd={() =>
                                  addNode("page", {
                                    label: page.label,
                                    description: page.description,
                                    pageType: page.pageType,
                                  })
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {showPanel === "templates" && (
                      <div className="space-y-4 p-2">
                        {filteredTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onUse={() => {
                              // Implementar carregamento de template
                              toast({
                                title: "Template carregado",
                                description: `Template "${template.label}" foi aplicado.`,
                              })
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {showPanel === "icons" && (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredIcons.map((icon) => (
                          <DraggableIconButton
                            key={icon.id}
                            icon={icon}
                            onAdd={() =>
                              addNode("marketing", {
                                label: icon.label,
                                color: icon.color,
                                iconId: icon.id,
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col">
                <div className="h-16 border-b border-border flex items-center justify-between px-4">
                  <Input
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    className="max-w-xs bg-card border-border text-foreground"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-card border-border text-foreground hover:bg-accent h-8 px-2"
                      onClick={saveFlow}
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-card border-border text-foreground hover:bg-accent h-8 px-2"
                      onClick={clearFlow}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Limpar
                    </Button>
                  </div>
                </div>

                <div className="flex-1 relative bg-background overflow-hidden" onClick={handleCanvasClick}>
                  {/* Grid de fundo */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                      radial-gradient(circle, #666 1px, transparent 1px)
                    `,
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {/* Camada de conexões */}
                  <ConnectionsLayer nodes={nodes} connections={connections} />

                  {/* Camada de nós */}
                  <div className="absolute inset-0" style={{ zIndex: 2 }}>
                    {nodes.map((node) => (
                      <CustomMindMapNode
                        key={node.id}
                        node={node}
                        onDrag={handleNodeDrag}
                        onDelete={handleNodeDelete}
                        isSelected={selectedNodeId === node.id}
                        onSelect={handleNodeSelect}
                      />
                    ))}
                  </div>

                  {/* Controles de zoom */}
                  <div className="absolute bottom-4 right-4 flex flex-col bg-card border border-border rounded">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <ZoomIn size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <ZoomOut size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <Maximize size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Componente de visualização do dashboard
function DashboardView({
  savedFlows,
  onCreateProject,
  onLoadFlow,
  onDeleteFlow,
  onDuplicateFlow,
}: {
  savedFlows: any[]
  onCreateProject: () => void
  onLoadFlow: (flow: any) => void
  onDeleteFlow: (index: number) => void
  onDuplicateFlow: (flow: any, index: number) => void
}) {
  return (
    <div className="w-full flex flex-col p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meus Projetos</h1>
        <Button onClick={onCreateProject} className="bg-card border border-border hover:bg-accent text-foreground">
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Novo Funil
        </Button>
      </div>

      {savedFlows.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16">
          <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-3">Nenhum projeto encontrado</h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Você ainda não criou nenhum projeto. Comece criando um novo funil de marketing.
          </p>
          <Button onClick={onCreateProject} className="bg-card border border-border hover:bg-accent text-foreground">
            Criar Primeiro Projeto
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedFlows.map((flow, index) => (
            <Card key={index} className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="h-40 bg-muted relative cursor-pointer" onClick={() => onLoadFlow(flow)}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Move className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Mind Map</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-background bg-opacity-30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button variant="secondary" size="sm" className="bg-background text-foreground hover:bg-accent">
                      Abrir Projeto
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{flow.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {flow.nodes.length} nós e {flow.connections.length} conexões
                  </p>
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-foreground border-border bg-transparent"
                      onClick={() => onLoadFlow(flow)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-400 border-border bg-transparent"
                        onClick={() => onDuplicateFlow(flow, index)}
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-border bg-transparent"
                        onClick={() => onDeleteFlow(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de item de página arrastável
function DraggablePageItem({
  page,
  onAdd,
}: {
  page: any
  onAdd: () => void
}) {
  return (
    <div
      className="flex items-center p-3 bg-card rounded-lg cursor-pointer hover:bg-accent transition-colors"
      onClick={onAdd}
    >
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3 flex-shrink-0">
        <div className="h-5 w-5 text-muted-foreground">{React.createElement(page.icon)}</div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">{page.label}</h3>
        <p className="text-xs text-muted-foreground">{page.description}</p>
      </div>
    </div>
  )
}

// Componente de cartão de template
function TemplateCard({
  template,
  onUse,
}: {
  template: any
  onUse: () => void
}) {
  return (
    <div className="mb-4 bg-background border border-border rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="text-xl font-medium text-foreground mb-1">{template.label}</h3>
        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
        <button
          className="w-full bg-card hover:bg-accent text-foreground py-2 px-4 rounded-md flex items-center justify-center"
          onClick={onUse}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Usar Template
        </button>
      </div>
    </div>
  )
}

// Componente de botão de ícone arrastável
function DraggableIconButton({
  icon,
  onAdd,
}: {
  icon: any
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col items-center mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={onAdd}>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-1 shadow-md"
        style={{
          background: icon.color,
        }}
      >
        <div className="h-5 w-5 text-white">{React.createElement(icon.icon)}</div>
      </div>
      <span className="text-xs text-center text-muted-foreground">{icon.label}</span>
    </div>
  )
}

// Componente de botão de navegação
function NavButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <div className="flex flex-col items-center py-4" onClick={onClick}>
      <div className={`p-2 rounded-md cursor-pointer ${active ? "bg-accent" : "hover:bg-accent/50"}`}>{icon}</div>
      <span className="text-xs mt-1 text-muted-foreground">{label}</span>
    </div>
  )
}
