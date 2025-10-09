"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  ReactFlowProvider,
  getRectOfNodes,
  type EdgeTypes,
  MarkerType,
  useOnSelectionChange,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import {
  Save,
  Download,
  Trash2,
  LayoutGrid,
  FileText,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Importar dados de templates
import { getTemplateById } from "@/lib/template-data"

// Tipos de nós personalizados para marketing
import CampaignNode from "@/components/mind-map/campaign-node"
import AudienceNode from "@/components/mind-map/audience-node"
import ChannelNode from "@/components/mind-map/channel-node"
import ContentNode from "@/components/mind-map/content-node"
import ConversionNode from "@/components/mind-map/conversion-node"
import MarketingIconNode from "@/components/mind-map/marketing-icon-node"
import PageNode from "@/components/mind-map/page-node"
import {
  ContentCreationNode,
  MarketingAnalysisNode,
  EmailMarketingNode,
  MarketingCampaignNode,
  SocialMediaMarketingNode,
} from "@/components/mind-map/marketing-nodes"
import WritingNode from "@/components/mind-map/writing-node"

// Atualizar a importação do AdvancedFunnelView
import FunilAvancadoView from "@/components/views/advanced-funnel-view"

// Verificar se estamos no navegador
const isBrowser = typeof window !== "undefined"

// Função segura para acessar localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (isBrowser) return localStorage.getItem(key)
    return null
  },
  setItem: (key: string, value: string): void => {
    if (isBrowser) localStorage.setItem(key, value)
  },
  removeItem: (key: string): void => {
    if (isBrowser) localStorage.removeItem(key)
  },
}

// Definição dos tipos de nós
const nodeTypes: NodeTypes = {
  campaignNode: CampaignNode,
  audienceNode: AudienceNode,
  channelNode: ChannelNode,
  contentNode: ContentNode,
  conversionNode: ConversionNode,
  marketingIconNode: MarketingIconNode,
  pageNode: PageNode,
  contentCreationNode: ContentCreationNode,
  marketingAnalysisNode: MarketingAnalysisNode,
  emailMarketingNode: EmailMarketingNode,
  marketingCampaignNode: MarketingCampaignNode,
  socialMediaMarketingNode: SocialMediaMarketingNode,
  writingNode: WritingNode,
}

// Tipos de linhas personalizadas
const edgeTypes: EdgeTypes = {}

// Ícones de marketing disponíveis
const marketingIcons = [
  { id: "search", label: "Pesquisa", icon: Search, color: "#FF5252", category: "acquisition" },
  { id: "blog", label: "Blog", icon: FileText, color: "#3498db", category: "content" },
  { id: "affiliates", label: "Afiliados", icon: Users, color: "#2ecc71", category: "acquisition" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#4267B2", category: "acquisition" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", category: "acquisition" },
  { id: "tiktok", label: "TikTok", icon: "tiktok", color: "#000000", category: "acquisition" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "#FF0000", category: "acquisition" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0077B5", category: "acquisition" },
  { id: "lead", label: "Lead", icon: "lead", color: "#b07f33", category: "conversion" },
  { id: "email", label: "Email", icon: Mail, color: "#3498db", category: "communication" },
  { id: "webinar", label: "Webinar", icon: Video, color: "#2ecc71", category: "content" },
  { id: "webinar-reg", label: "Webinar Reg", icon: Video, color: "#3498db", category: "conversion" },
  { id: "retargeting", label: "Retargeting", icon: Target, color: "#34495e", category: "engagement" },
  { id: "sales-page", label: "Página de Vendas", icon: FileText, color: "#3498db", category: "conversion" },
  { id: "front-end", label: "Front-end", icon: DollarSign, color: "#2ecc71", category: "customer" },
  { id: "email-broadcast", label: "Email Broadcast", icon: Mail, color: "#3498db", category: "communication" },
  { id: "video", label: "Vídeo", icon: Video, color: "#e74c3c", category: "content" },
  { id: "conversation", label: "Conversação de vendas", icon: MessageCircle, color: "#3498db", category: "sales" },
  { id: "pipeline", label: "Pipeline", icon: BarChart, color: "#e74c3c", category: "sales" },
  { id: "conversation-2", label: "Conversa", icon: MessageCircle, color: "#9b59b6", category: "sales" },
  { id: "deal-lost", label: "Negócio Perdido", icon: "deal-lost", color: "#e74c3c", category: "sales" },
  { id: "back-end", label: "Back-end", icon: DollarSign, color: "#27ae60", category: "customer" },
  { id: "upsell", label: "Upsell", icon: "upsell", color: "#e74c3c", category: "sales" },
  { id: "follow-up", label: "Acompanhamento", icon: Clock, color: "#3498db", category: "sales" },
  { id: "sms", label: "SMS", icon: MessageSquare, color: "#9b59b6", category: "communication" },
  { id: "order-page", label: "Página de Pedido", icon: ShoppingCart, color: "#2ecc71", category: "sales" },
  { id: "search-2", label: "Pesquisa", icon: Search, color: "#3498db", category: "acquisition" },
  { id: "report", label: "Relatório", icon: FileBarChart, color: "#7f8c8d", category: "content" },
  { id: "support", label: "Assistência", icon: HelpCircle, color: "#e74c3c", category: "customer" },
  { id: "calendar", label: "Calendário", icon: Calendar, color: "#3498db", category: "conversion" },
  { id: "segment", label: "Segmento", icon: "segment", color: "#e74c3c", category: "analysis" },
]

// Tipos de nós para funil de escrita (agora convertidos para páginas)
const writingNodeItems = [
  {
    id: "ideation",
    label: "Ideação",
    description: "Brainstorming e geração de ideias",
    icon: Lightbulb,
    color: "#3498db",
    pageType: "ideation",
  },
  {
    id: "research",
    label: "Pesquisa",
    description: "Coleta de informações e dados",
    icon: Search,
    color: "#2ecc71",
    pageType: "research",
  },
  {
    id: "outline",
    label: "Estruturação",
    description: "Criação de estrutura e esboço",
    icon: ListChecks,
    color: "#f39c12",
    pageType: "outline",
  },
  {
    id: "draft",
    label: "Rascunho",
    description: "Escrita do primeiro rascunho",
    icon: Edit,
    color: "#9b59b6",
    pageType: "draft",
  },
  {
    id: "revision",
    label: "Revisão",
    description: "Edição e aprimoramento do texto",
    icon: FileCheck,
    color: "#e74c3c",
    pageType: "revision",
  },
  {
    id: "feedback",
    label: "Feedback",
    description: "Obtenção de feedback externo",
    icon: MessageCircle,
    color: "#1abc9c",
    pageType: "feedback",
  },
  {
    id: "finalization",
    label: "Finalização",
    description: "Ajustes finais e formatação",
    icon: CheckCircle,
    color: "#34495e",
    pageType: "finalization",
  },
  {
    id: "publication",
    label: "Publicação",
    description: "Publicação e distribuição",
    icon: Upload,
    color: "#e67e22",
    pageType: "publication",
  },
]

// Verificar se o template B2B está corretamente listado nos templateItems
const templateItems = [
  {
    id: "exact-reference",
    label: "Funil de Marketing Completo",
    icon: LayoutTemplate,
    description: "Funil completo com múltiplos canais, webinar, segmentação e follow-up",
  },
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
    id: "product-launch",
    label: "Lançamento de Produto",
    icon: Rocket,
    description: "Funil completo para lançamento de produto com conteúdo, engajamento e vendas",
  },
  {
    id: "blog-lead",
    label: "Blog para Lead",
    icon: FileText,
    description: "Funil que converte visitantes do blog em leads qualificados",
  },
  {
    id: "funnel-advanced",
    label: "Funil de Vendas Avançado",
    icon: LayoutTemplate,
    description: "Funil de vendas completo com múltiplos canais, segmentação, upsell e follow-up",
  },
  {
    id: "info-product-launch",
    label: "Lançamento de Infoproduto",
    icon: Rocket,
    description: "Estratégia completa de lançamento de infoproduto com conteúdo gratuito, lista VIP e oferta especial",
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
  {
    id: "b2b-sales-funnel",
    label: "Funil de Vendas B2B",
    icon: BarChart,
    description: "Estratégia completa para geração de leads e vendas no mercado B2B",
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

// Páginas de conteúdo (agora incluindo os antigos nós)
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
  // Adicionando os antigos nós como páginas de conteúdo
  {
    id: "content-creation",
    label: "Conteúdo",
    description: "Etapa de criação de conteúdo",
    icon: Plus,
    category: "content",
    pageType: "content-creation",
  },
  {
    id: "marketing-analysis",
    label: "Análise",
    description: "Rastrear e analisar resultados",
    icon: Plus,
    category: "content",
    pageType: "marketing-analysis",
  },
  {
    id: "email-marketing",
    label: "Email",
    description: "Etapa de marketing por email",
    icon: Plus,
    category: "content",
    pageType: "email-marketing",
  },
  {
    id: "marketing-campaign",
    label: "Campanha",
    description: "Iniciar ou definir uma campanha",
    icon: Plus,
    category: "content",
    pageType: "marketing-campaign",
  },
  {
    id: "social-media",
    label: "Mídia Social",
    description: "Marketing em mídia social",
    icon: Plus,
    category: "content",
    pageType: "social-media",
  },
  // Adicionando os itens de escrita como páginas de conteúdo
  ...writingNodeItems,
]

// Função para gerar uma miniatura do fluxo
function generateFlowPreview(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return "/marketing-flow.png"
  if (!isBrowser) return "/marketing-flow.png"

  const canvas = document.createElement("canvas")
  canvas.width = 300
  canvas.height = 200
  const ctx = canvas.getContext("2d")
  if (!ctx) return "/marketing-flow.png"

  ctx.fillStyle = "#111"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const nodeRect = getRectOfNodes(nodes)
  const padding = 30
  const xScale = (canvas.width - padding * 2) / (nodeRect.width || 1)
  const yScale = (canvas.height - padding * 2) / (nodeRect.height || 1)
  const scale = Math.min(xScale, yScale, 1)

  ctx.strokeStyle = "#555"
  ctx.lineWidth = 2

  edges.forEach((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source)
    const targetNode = nodes.find((node) => node.id === edge.target)

    if (sourceNode && targetNode) {
      const sourceX = (sourceNode.position.x - nodeRect.x) * scale + padding
      const sourceY = (sourceNode.position.y - nodeRect.y) * scale + padding
      const targetX = (targetNode.position.x - nodeRect.x) * scale + padding
      const targetY = (targetNode.position.y - nodeRect.y) * scale + padding

      ctx.beginPath()
      if (edge.style?.strokeDasharray) {
        ctx.setLineDash(edge.style.strokeDasharray.split(" ").map(Number))
      } else {
        ctx.setLineDash([])
      }
      ctx.moveTo(sourceX, sourceY)
      ctx.lineTo(targetX, targetY)
      ctx.stroke()
      ctx.setLineDash([])
    }
  })

  nodes.forEach((node) => {
    const x = (node.position.x - nodeRect.x) * scale + padding
    const y = (node.position.y - nodeRect.y) * scale + padding
    const width = 40
    const height = 30

    let color = "#666"
    if (node.type === "contentCreationNode") color = "#c0392b"
    else if (node.type === "marketingAnalysisNode") color = "#f39c12"
    else if (node.type === "emailMarketingNode") color = "#2ecc71"
    else if (node.type === "marketingCampaignNode") color = "#34495e"
    else if (node.type === "socialMediaMarketingNode") color = "#9b59b6"

    ctx.fillStyle = color
    ctx.fillRect(x - width / 2, y - height / 2, width, height)
    ctx.strokeStyle = "#fff"
    ctx.strokeRect(x - width / 2, y - height / 2, width, height)
  })

  return canvas.toDataURL("image/png")
}

// Componente principal
export default function MindMapView() {
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === "dark"
  const [activeView, setActiveView] = useState<"dashboard" | "editor" | "advanced-funnel">("dashboard")
  const [activeNavItem, setActiveNavItem] = useState<"pages" | "templates" | "icons">("templates")
  const [showPanel, setShowPanel] = useState<"pages" | "templates" | "icons" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Adicionar após os outros estados
  const [workInProgress, setWorkInProgress] = useLocalStorage<{
    nodes: Node[]
    edges: Edge[]
    flowName: string
  } | null>("work-in-progress", null)

  const handleDashboardClick = () => {
    if (activeView === "editor" || activeView === "advanced-funnel") {
      const currentWork = safeLocalStorage.getItem("current-work-state")
      if (currentWork) {
        try {
          const workData = JSON.parse(currentWork)
          setWorkInProgress(workData)
        } catch (error) {
          console.error("Erro ao salvar trabalho em progresso:", error)
        }
      }
    }
    setActiveView("dashboard")
  }

  const handleFunnelClick = () => setActiveView("editor")
  const handleAdvancedFunnelClick = () => setActiveView("advanced-funnel")
  const handleCreateProject = () => setActiveView("editor")

  const handleNavClick = (navItem: "pages" | "templates" | "icons") => {
    if (activeNavItem === navItem && showPanel === navItem) {
      setShowPanel(null)
    } else {
      setActiveNavItem(navItem)
      setShowPanel(navItem)
    }
    setSearchTerm("")
  }

  const toggleSidebar = () => setShowSidebar(!showSidebar)

  const handleLoadTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    safeLocalStorage.setItem("selected-template-id", templateId)

    const template = getTemplateById(templateId)
    if (template) {
      // pronto para carregar via FlowBuilder
    }
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

  useEffect(() => {
    if (selectedTemplateId) {
      handleLoadTemplate(selectedTemplateId)
    }
  }, [selectedTemplateId])

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Barra lateral esquerda (condicional baseada em showSidebar) */}
      {showSidebar && (
        <div className="w-[230px] border-r border-gray-800 flex flex-col">
          {/* Título sem o logo */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h1 className="text-lg font-bold">BLACK's FANNEL</h1>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
              aria-label="Esconder menu"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          {/* Menu de navegação */}
          <div className="flex-1 py-4">
            <NavItem
              icon={<LayoutGrid size={18} />}
              label="Dashboard"
              active={activeView === "dashboard"}
              onClick={handleDashboardClick}
            />
            <NavItem
              icon={<FileText size={18} />}
              label="Criação de Funil"
              active={activeView === "editor"}
              onClick={handleFunnelClick}
            />
            <NavItem
              icon={<Layers size={18} />}
              label="Funil Avançado"
              active={activeView === "advanced-funnel"}
              onClick={handleAdvancedFunnelClick}
            />
          </div>

          {/* Toggle de tema */}
          <div className="p-4 border-t border-gray-800 flex items-center">
            <div className="flex items-center gap-2">
              <Sun size={16} className={cn("text-gray-400", !isDarkMode && "text-yellow-400")} />
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-5 w-10 items-center rounded-full ${
                  isDarkMode ? "bg-primary" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    isDarkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <Moon size={16} className={cn("text-gray-400", isDarkMode && "text-blue-400")} />
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex">
        {/* Botão para mostrar a barra lateral (visível apenas quando a barra está escondida) */}
        {!showSidebar && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-10 p-2 rounded-md bg-gray-900 border border-gray-700 text-white hover:bg-gray-800"
            aria-label="Mostrar menu"
          >
            <PanelLeft size={18} />
          </button>
        )}

        {activeView === "dashboard" ? (
          <DashboardView onCreateProject={handleCreateProject} />
        ) : activeView === "advanced-funnel" ? (
          <FunilAvancadoView />
        ) : (
          <>
            {/* Barra de navegação vertical */}
            <div className="w-[60px] bg-black border-r border-gray-800">
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

            {/* Área principal do fluxo com painel lateral condicional */}
            <div className="flex-1 flex">
              {/* Painel lateral (visível apenas quando showPanel não é null) */}
              {showPanel && (
                <div className="w-[300px] bg-black border-r border-gray-800 flex flex-col">
                  {/* Cabeçalho do painel */}
                  <div className="p-4 border-b border-gray-800">
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
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        placeholder={`Buscar ${
                          showPanel === "pages" ? "páginas" : showPanel === "templates" ? "templates" : "ícones"
                        }...`}
                        className="pl-9 bg-gray-900 border-gray-700 text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Conteúdo do painel */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {/* Painel de Páginas */}
                    {showPanel === "pages" && (
                      <div className="space-y-3">
                        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-300">
                            Contém componentes relacionados a diferentes tipos de páginas usadas em funis de marketing.
                          </p>
                        </div>

                        {/* Páginas principais do funil */}
                        {filteredMainPages.length > 0 && (
                          <div className="space-y-2">
                            {filteredMainPages.map((page) => (
                              <DraggablePageItemNew
                                key={page.id}
                                id={page.id}
                                icon={page.icon}
                                label={page.label}
                                description={page.description}
                                pageType={page.pageType}
                              />
                            ))}
                          </div>
                        )}

                        {/* Título da seção de páginas de conteúdo */}
                        {filteredContentPages.length > 0 && (
                          <div className="mt-6 mb-2">
                            <h3 className="text-sm font-medium text-gray-400">Páginas de Conteúdo</h3>
                          </div>
                        )}

                        {/* Páginas de conteúdo */}
                        {filteredContentPages.length > 0 && (
                          <div className="space-y-2">
                            {filteredContentPages.map((page) => (
                              <DraggablePageItemNew
                                key={page.id}
                                id={page.id}
                                icon={page.icon}
                                label={page.label}
                                description={page.description}
                                pageType={page.pageType}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Painel de Templates */}
                    {showPanel === "templates" && (
                      <div className="space-y-4 p-2">
                        {filteredTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            id={template.id}
                            label={template.label}
                            description={template.description}
                            onUseTemplate={handleLoadTemplate}
                          />
                        ))}
                      </div>
                    )}

                    {/* Painel de Ícones */}
                    {showPanel === "icons" && (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredIcons.map((icon) => (
                          <DraggableIconButton
                            key={icon.id}
                            id={icon.id}
                            icon={icon.icon}
                            label={icon.label}
                            color={icon.color}
                            customIcon={typeof icon.icon === "string" ? icon.icon : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Área do fluxo */}
              <div className="flex-1 flex flex-col">
                <ReactFlowProvider>
                  <FlowBuilder
                    onSaveComplete={() => setActiveView("dashboard")}
                    selectedTemplateId={selectedTemplateId}
                    setSelectedTemplateId={setSelectedTemplateId}
                  />
                </ReactFlowProvider>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Componente de estilo de ícone compartilhado
const IconStyle = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <div
    className="w-12 h-12 rounded-full flex items-center justify-center mb-1 shadow-md"
    style={{
      background: color,
    }}
  >
    {children}
  </div>
)

// Componente de botão de ícone arrastável
function DraggableIconButton({
  id,
  icon,
  label,
  color,
  customIcon,
}: {
  id: string
  icon: any
  label: string
  color: string
  customIcon?: string
}) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ type: "marketingIconNode", id, label, color, iconId: id }),
    )
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      className="flex flex-col items-center mb-4 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={onDragStart}
    >
      <IconStyle color={color}>
        {customIcon ? (
          <div className="text-white">
            {customIcon === "tiktok" && (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            )}
            {customIcon === "lead" && (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="#b07f33" />
                <circle cx="12" cy="9" r="3" fill="#fff" />
                <path d="M12 12c-2.8 0-5 1.5-5 3.5V18h10v-2.5c0-2-2.2-3.5-5-3.5z" fill="#fff" />
              </svg>
            )}
            {customIcon === "upsell" && (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
              </svg>
            )}
            {customIcon === "deal-lost" && (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            )}
            {customIcon === "segment" && (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </div>
        ) : (
          <div className="h-5 w-5 text-white">{React.createElement(icon)}</div>
        )}
      </IconStyle>
      <span className="text-xs text-center text-gray-300">{label}</span>
    </div>
  )
}

// Componente de item de página arrastável (novo design)
function DraggablePageItemNew({
  id,
  icon,
  label,
  description,
  pageType,
}: {
  id: string
  icon: any
  label: string
  description: string
  pageType: string
}) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ type: "pageNode", id, label, description, pageType }),
    )
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      className="flex items-center p-3 bg-gray-900 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-800 transition-colors"
      draggable
      onDragStart={onDragStart}
    >
      <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center mr-3 flex-shrink-0">
        <div className="h-5 w-5 text-gray-300">{React.createElement(icon)}</div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  )
}

// Componente de cartão de template
function TemplateCard({
  id,
  label,
  description,
  onUseTemplate,
}: {
  id: string
  label: string
  description: string
  onUseTemplate: (id: string) => void
}) {
  return (
    <div className="mb-4 bg-black border border-gray-800 rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="text-xl font-medium text-white mb-1">{label}</h3>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        <button
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
          onClick={() => onUseTemplate(id)}
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

// Componente de visualização do dashboard
function DashboardView({ onCreateProject }: { onCreateProject: () => void }) {
  const [savedFlows, setSavedFlows] = useLocalStorage<
    {
      name: string
      nodes: Node[]
      edges: Edge[]
      preview?: string
    }[]
  >("marketing-flows", [])

  const { toast } = useToast()

  const loadFlow = (flow: { name: string; nodes: Node[]; edges: Edge[] }) => {
    safeLocalStorage.setItem("selected-flow", JSON.stringify(flow))
    onCreateProject()
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

  const duplicateFlow = (flow: { name: string; nodes: Node[]; edges: Edge[]; preview?: string }, index: number) => {
    const newFlow = { ...flow, name: `${flow.name} (cópia)` }
    const updatedFlows = [...savedFlows]
    updatedFlows.splice(index + 1, 0, newFlow)
    setSavedFlows(updatedFlows)

    toast({
      title: "Fluxo duplicado",
      description: `Uma cópia de "${flow.name}" foi criada.`,
    })
  }

  return (
    <div className="w-full flex flex-col p-8">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meus Projetos</h1>
        <Button onClick={onCreateProject} className="bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Novo Funil
        </Button>
      </div>

      {savedFlows.length === 0 ? (
        // Estado vazio - nenhum projeto encontrado
        <div className="flex flex-col items-center justify-center flex-1 py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-3">Nenhum projeto encontrado</h2>
          <p className="text-gray-400 text-center max-w-md mb-8">
            Você ainda não criou nenhum projeto. Comece criando um novo funil de marketing.
          </p>
          <Button onClick={onCreateProject} className="bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white">
            Criar Primeiro Projeto
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        // Grid de projetos salvos
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedFlows.map((flow, index) => (
            <Card key={index} className="bg-gray-900 border-gray-700 overflow-hidden">
              <CardContent className="p-0">
                {/* Miniatura do fluxo */}
                <div className="h-40 bg-gray-800 relative cursor-pointer" onClick={() => loadFlow(flow)}>
                  {flow.preview ? (
                    <img
                      src={flow.preview || "/placeholder.svg"}
                      alt={`Miniatura do fluxo ${flow.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={`/marketing-flow.png?height=160&width=300&query=marketing%20flow%20${encodeURIComponent(
                          flow.name,
                        )}`}
                        alt={`Miniatura do fluxo ${flow.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button variant="secondary" size="sm" className="bg-white text-black hover:bg-gray-200">
                      Abrir Projeto
                    </Button>
                  </div>
                </div>

                {/* Informações e ações */}
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 text-white">{flow.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {flow.nodes.length} nós e {flow.edges.length} conexões
                  </p>
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-gray-700"
                      onClick={() => loadFlow(flow)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-400 border-gray-700"
                        onClick={() => duplicateFlow(flow, index)}
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-gray-700"
                        onClick={() => deleteFlow(index)}
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

// Componente do construtor de fluxo
function FlowBuilder({
  onSaveComplete,
  selectedTemplateId,
  setSelectedTemplateId,
}: {
  onSaveComplete: () => void
  selectedTemplateId: string | null
  setSelectedTemplateId: (id: string | null) => void
}) {
  const { toast } = useToast()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [flowName, setFlowName] = useState("Novo Projeto de Marketing")

  // Estado para configurações de linha
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([])
  const [showEdgeSettings, setShowEdgeSettings] = useState(false)
  const [defaultLineStyle, setDefaultLineStyle] = useState<string>("solid")
  const [defaultAnimation, setDefaultAnimation] = useState<string>("none")
  const [defaultLineColor, setDefaultLineColor] = useState<string>("#ffffff")

  // Armazenamento local para salvar os fluxos
  const [savedFlows, setSavedFlows] = useLocalStorage<
    {
      name: string
      nodes: Node[]
      edges: Edge[]
      preview?: string
    }[]
  >("marketing-flows", [])

  // Carregar template ou fluxo selecionado quando o componente for montado
  useEffect(() => {
    const selectedFlowJson = safeLocalStorage.getItem("selected-flow")
    const storedTemplateId = safeLocalStorage.getItem("selected-template-id")

    if (selectedFlowJson) {
      try {
        const selectedFlow = JSON.parse(selectedFlowJson)
        setNodes(selectedFlow.nodes || [])
        setEdges(selectedFlow.edges || [])
        setFlowName(selectedFlow.name || "Novo Projeto de Marketing")

        // Limpar o fluxo selecionado após carregá-lo
        safeLocalStorage.removeItem("selected-flow")

        toast({
          title: "Fluxo carregado",
          description: `O fluxo "${selectedFlow.name}" foi carregado para edição.`,
        })
      } catch (error) {
        console.error("Erro ao carregar fluxo selecionado:", error)
      }
    } else if (storedTemplateId) {
      loadTemplateById(storedTemplateId)
      safeLocalStorage.removeItem("selected-template-id")
    }
  }, [setNodes, setEdges, toast])

  // Efeito para carregar template quando selectedTemplateId muda
  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateById(selectedTemplateId)
      setSelectedTemplateId(null)
    }
  }, [selectedTemplateId, setSelectedTemplateId])

  // Função para carregar um template pelo ID
  const loadTemplateById = (templateId: string) => {
    const template = getTemplateById(templateId)

    if (template) {
      setNodes(template.nodes)
      setEdges(template.edges)
      setFlowName(template.name)

      toast({
        title: "Template carregado",
        description: `O template "${template.name}" foi carregado com sucesso.`,
      })
    } else {
      toast({
        title: "Erro ao carregar template",
        description: "O template selecionado não foi encontrado.",
        variant: "destructive",
      })
    }
  }

  // Monitorar seleção de arestas
  useOnSelectionChange({
    onChange: ({ edges }) => {
      setSelectedEdges(edges)
      setShowEdgeSettings(edges.length > 0)
    },
  })

  // Adicionar conexão entre nós
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        animated: defaultAnimation === "dots",
        style: {
          stroke: defaultLineColor,
          strokeWidth: 2,
          ...(defaultLineStyle === "dashed" && { strokeDasharray: "5 5" }),
          ...(defaultLineStyle === "dotted" && { strokeDasharray: "2 2" }),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: defaultLineColor,
        },
      }

      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges, defaultLineStyle, defaultAnimation, defaultLineColor],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds || !reactFlowInstance) return

      const data = event.dataTransfer.getData("application/reactflow")
      if (!data) return

      try {
        const nodeData = JSON.parse(data)
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        const newNode: Node = {
          id: `${nodeData.id}-${Date.now()}`,
          type: nodeData.type,
          position,
          data: {
            label: nodeData.label,
            color: nodeData.color,
            ...(nodeData.iconId && { iconId: nodeData.iconId }),
            ...(nodeData.description && { description: nodeData.description }),
            ...(nodeData.pageType && { pageType: nodeData.pageType }),
          },
          draggable: true,
        }

        setNodes((nds) => nds.concat(newNode))

        toast({
          title: "Item adicionado",
          description: `${nodeData.label} foi adicionado ao fluxo.`,
        })
      } catch (error) {
        console.error("Erro ao adicionar nó:", error)
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o item ao fluxo.",
          variant: "destructive",
        })
      }
    },
    [reactFlowInstance, setNodes, toast],
  )

  const updateSelectedEdgesStyle = useCallback(
    (style: string) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (selectedEdges.some((selectedEdge) => selectedEdge.id === edge.id)) {
            return {
              ...edge,
              style: {
                ...edge.style,
                strokeDasharray: style === "solid" ? undefined : style === "dashed" ? "5 5" : "2 2",
              },
            }
          }
          return edge
        }),
      )
    },
    [selectedEdges, setEdges],
  )

  const updateSelectedEdgesAnimation = useCallback(
    (animation: string) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (selectedEdges.some((selectedEdge) => selectedEdge.id === edge.id)) {
            return { ...edge, animated: animation === "dots" }
          }
          return edge
        }),
      )
    },
    [selectedEdges, setEdges],
  )

  const updateSelectedEdgesColor = useCallback(
    (color: string) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (selectedEdges.some((selectedEdge) => selectedEdge.id === edge.id)) {
            return {
              ...edge,
              style: { ...edge.style, stroke: color },
              markerEnd: { ...edge.markerEnd, color },
            }
          }
          return edge
        }),
      )
    },
    [selectedEdges, setEdges],
  )

  const saveFlow = useCallback(() => {
    if (nodes.length === 0) {
      toast({
        title: "Erro ao salvar",
        description: "Não é possível salvar um fluxo vazio.",
        variant: "destructive",
      })
      return
    }

    const preview = generateFlowPreview(nodes, edges)
    const newFlow = { name: flowName, nodes, edges, preview }

    const existingFlowIndex = savedFlows.findIndex((flow) => flow.name === flowName)
    if (existingFlowIndex >= 0) {
      const updatedFlows = [...savedFlows]
      updatedFlows[existingFlowIndex] = newFlow
      setSavedFlows(updatedFlows)
    } else {
      setSavedFlows([...savedFlows, newFlow])
    }

    safeLocalStorage.removeItem("current-work-state")
    safeLocalStorage.removeItem("work-in-progress")

    toast({ title: "Fluxo salvo", description: `O fluxo "${flowName}" foi salvo com sucesso.` })

    onSaveComplete()
  }, [flowName, nodes, edges, savedFlows, setSavedFlows, toast, onSaveComplete])

  const loadFlow = useCallback(() => {
    if (savedFlows.length === 0) {
      toast({ title: "Nenhum fluxo salvo", description: "Não há fluxos salvos para carregar." })
      return
    }
    const flow = savedFlows[savedFlows.length - 1]
    setNodes(flow.nodes)
    setEdges(flow.edges)
    setFlowName(flow.name)
    toast({ title: "Fluxo carregado", description: `O fluxo "${flow.name}" foi carregado com sucesso.` })
  }, [savedFlows, setNodes, setEdges, toast])

  const clearFlow = useCallback(() => {
    if (nodes.length === 0) return
    setNodes([])
    setEdges([])
    setFlowName("Novo Projeto de Marketing")
    toast({ title: "Fluxo limpo", description: "Todos os elementos foram removidos do fluxo." })
  }, [nodes.length, setNodes, setEdges, toast])

  useEffect(() => {
    if (isBrowser) {
      const currentWorkState = { nodes, edges, flowName }
      safeLocalStorage.setItem("current-work-state", JSON.stringify(currentWorkState))
    }
  }, [nodes, edges, flowName])

  useEffect(() => {
    if (isBrowser) {
      const workInProgress = safeLocalStorage.getItem("work-in-progress")
      if (workInProgress && !selectedTemplateId) {
        try {
          const workData = JSON.parse(workInProgress)
          if (workData.nodes && workData.nodes.length > 0) {
            setNodes(workData.nodes)
            setEdges(workData.edges || [])
            setFlowName(workData.flowName || "Trabalho em Progresso")

            safeLocalStorage.removeItem("work-in-progress")

            toast({ title: "Trabalho restaurado", description: "Seu trabalho anterior foi restaurado automaticamente." })
          }
        } catch (error) {
          console.error("Erro ao restaurar trabalho em progresso:", error)
        }
      }
    }
  }, [selectedTemplateId, setNodes, setEdges, toast])

  return (
    <>
      {/* Barra de ferramentas superior */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4">
        <Input
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          className="max-w-xs bg-gray-900 border-gray-700 text-white"
        />
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 h-8 px-2"
            onClick={saveFlow}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            Salvar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 h-8 px-2"
            onClick={loadFlow}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Carregar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 h-8 px-2"
            onClick={clearFlow}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Limpar
          </Button>

          {/* Configurações de linha padrão */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 h-8 px-2"
              >
                <Settings className="mr-1 h-3.5 w-3.5" />
                Estilo
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-gray-900 border-gray-700 text-white p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Configurações de Linha Padrão</h3>
                <div className="space-y-2">
                  <Label htmlFor="line-style">Estilo de Linha</Label>
                  <Select value={defaultLineStyle} onValueChange={(value) => setDefaultLineStyle(value)}>
                    <SelectTrigger id="line-style" className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Selecione um estilo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="solid">Sólida</SelectItem>
                      <SelectItem value="dashed">Tracejada</SelectItem>
                      <SelectItem value="dotted">Pontilhada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="animation-type">Animação</Label>
                  <Select value={defaultAnimation} onValueChange={(value) => setDefaultAnimation(value)}>
                    <SelectTrigger id="animation-type" className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Selecione uma animação" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="dots">Bolinhas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-color">Cor da Linha</Label>
                  <div className="flex gap-2">
                    <button
                      className={`w-8 h-8 rounded-full ${defaultLineColor === "#ffffff" ? "ring-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#ffffff" }}
                      onClick={() => setDefaultLineColor("#ffffff")}
                    />
                    <button
                      className={`w-8 h-8 rounded-full ${defaultLineColor === "#3498db" ? "ring-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#3498db" }}
                      onClick={() => setDefaultLineColor("#3498db")}
                    />
                    <button
                      className={`w-8 h-8 rounded-full ${defaultLineColor === "#2ecc71" ? "ring-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#2ecc71" }}
                      onClick={() => setDefaultLineColor("#2ecc71")}
                    />
                    <button
                      className={`w-8 h-8 rounded-full ${defaultLineColor === "#e74c3c" ? "ring-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#e74c3c" }}
                      onClick={() => setDefaultLineColor("#e74c3c")}
                    />
                    <button
                      className={`w-8 h-8 rounded-full ${defaultLineColor === "#f39c12" ? "ring-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#f39c12" }}
                      onClick={() => setDefaultLineColor("#f39c12")}
                    />
                    <button
                      className={`w-8 h-8 rounded-full ${defaultLineColor === "#9b59b6" ? "ring-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#9b59b6" }}
                      onClick={() => setDefaultLineColor("#9b59b6")}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Área do fluxo */}
      <div ref={reactFlowWrapper} className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => setReactFlowInstance(instance)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          fitViewOptions={{ padding: 100 }}
          nodesDraggable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          defaultEdgeOptions={{
            animated: defaultAnimation === "dots",
            style: {
              stroke: defaultLineColor,
              strokeWidth: 2,
              ...(defaultLineStyle === "dashed" && { strokeDasharray: "5 5" }),
              ...(defaultLineStyle === "dotted" && { strokeDasharray: "2 2" }),
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: defaultLineColor,
            },
          }}
          proOptions={{ hideAttribution: true }}
          className="bg-black"
        >
          <Background color="#333" variant="dots" gap={12} size={1} />

          {/* Controles personalizados no canto inferior direito */}
          <div className="absolute bottom-4 right-4 flex flex-col bg-gray-900 border border-gray-700 rounded">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ZoomIn size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ZoomOut size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Maximize size={16} />
            </Button>
          </div>

          {/* Painel de configuração de linhas selecionadas */}
          {showEdgeSettings && (
            <Panel position="top-right" className="bg-gray-900 border border-gray-700 rounded p-3 mr-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Configurar Linhas</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-white"
                    onClick={() => setShowEdgeSettings(false)}
                  >
                    <X size={14} />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Estilo de Linha</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                      onClick={() => updateSelectedEdgesStyle("solid")}
                    >
                      <Minus size={14} className="mr-1" />
                      Sólida
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                      onClick={() => updateSelectedEdgesStyle("dashed")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1">
                        <path
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray="5,5"
                          d="M3 12h18"
                        />
                      </svg>
                      Tracejada
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                      onClick={() => updateSelectedEdgesStyle("dotted")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1">
                        <path
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray="2,2"
                          d="M3 12h18"
                        />
                      </svg>
                      Pontilhada
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Animação</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                      onClick={() => updateSelectedEdgesAnimation("none")}
                    >
                      Nenhuma
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                      onClick={() => updateSelectedEdgesAnimation("dots")}
                    >
                      <Circle size={14} className="mr-1" />
                      Bolinhas
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Cor</Label>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-white" onClick={() => updateSelectedEdgesColor("#ffffff")} />
                    <button className="w-8 h-8 rounded-full bg-blue-500" onClick={() => updateSelectedEdgesColor("#3498db")} />
                    <button className="w-8 h-8 rounded-full bg-green-500" onClick={() => updateSelectedEdgesColor("#2ecc71")} />
                    <button className="w-8 h-8 rounded-full bg-red-500" onClick={() => updateSelectedEdgesColor("#e74c3c")} />
                    <button className="w-8 h-8 rounded-full bg-yellow-500" onClick={() => updateSelectedEdgesColor("#f39c12")} />
                    <button className="w-8 h-8 rounded-full bg-purple-500" onClick={() => updateSelectedEdgesColor("#9b59b6")} />
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </>
  )
}

// Componente de item de navegação
function NavItem({
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
    <div
      className={`flex items-center gap-3 px-4 py-2 my-1 mx-2 rounded-md cursor-pointer ${
        active ? "bg-gray-800" : "hover:bg-gray-800/50"
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-sm">{label}</span>
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
      <div className={`p-2 rounded-md cursor-pointer ${active ? "bg-gray-800" : "hover:bg-gray-800/50"}`}>{icon}</div>
      <span className="text-xs mt-1 text-gray-400">{label}</span>
    </div>
  )
}

// Ícone Rocket (usado em templateItems)
function Rocket(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}
