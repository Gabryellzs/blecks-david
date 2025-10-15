"use client"

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react"
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
  useReactFlow,
  getRectOfNodes,
  type EdgeTypes,
  MarkerType,
  useOnSelectionChange,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"

import {
  Save, Download, Trash2, LayoutGrid, FileText, Palette, ZoomIn, ZoomOut, Maximize,
  Moon, Sun, ArrowRight, PlusCircle, Search, Facebook, Instagram, Youtube, Linkedin, Mail,
  Video, DollarSign, MessageCircle, ShoppingCart, MessageSquare, FileBarChart, Target, BarChart,
  Users, Clock, HelpCircle, Layers, FileCode, LayoutTemplate, PanelLeftClose, PanelLeft,
  CreditCard, ThumbsUp, FileQuestion, Info, Lock, BarChart2, Plus, Edit, Copy, Circle, Minus, X,
  Settings, Lightbulb, ListChecks, FileCheck, CheckCircle, Upload, Calendar,
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

// templates
import { getTemplateById } from "@/lib/template-data"

// mind-map nodes
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

// advanced view
import FunilAvancadoView from "@/components/views/advanced-funnel-view"

const isBrowser = typeof window !== "undefined"

// safe localStorage
const safeLocalStorage = {
  getItem: (k: string) => (isBrowser ? window.localStorage.getItem(k) : null),
  setItem: (k: string, v: string) => { if (isBrowser) window.localStorage.setItem(k, v) },
  removeItem: (k: string) => { if (isBrowser) window.localStorage.removeItem(k) },
}

// node & edge types
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
const edgeTypes: EdgeTypes = {}

// marketing icons
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

// writing flow (como páginas)
const writingNodeItems = [
  { id: "ideation", label: "Ideação", description: "Brainstorming e geração de ideias", icon: Lightbulb, color: "#3498db", pageType: "ideation" },
  { id: "research", label: "Pesquisa", description: "Coleta de informações e dados", icon: Search, color: "#2ecc71", pageType: "research" },
  { id: "outline", label: "Estruturação", description: "Criação de estrutura e esboço", icon: ListChecks, color: "#f39c12", pageType: "outline" },
  { id: "draft", label: "Rascunho", description: "Escrita do primeiro rascunho", icon: Edit, color: "#9b59b6", pageType: "draft" },
  { id: "revision", label: "Revisão", description: "Edição e aprimoramento do texto", icon: FileCheck, color: "#e74c3c", pageType: "revision" },
  { id: "feedback", label: "Feedback", description: "Obtenção de feedback externo", icon: MessageCircle, color: "#1abc9c", pageType: "feedback" },
  { id: "finalization", label: "Finalização", description: "Ajustes finais e formatação", icon: CheckCircle, color: "#34495e", pageType: "finalization" },
  { id: "publication", label: "Publicação", description: "Publicação e distribuição", icon: Upload, color: "#e67e22", pageType: "publication" },
]

// templates
function Rocket(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}

const templateItems = [
  { id: "exact-reference", label: "Funil de Marketing Completo", icon: LayoutTemplate, description: "Funil completo com múltiplos canais, webinar, segmentação e follow-up" },
  { id: "funnel-basic", label: "Funil de Vendas Básico", icon: LayoutTemplate, description: "Landing → Vendas → Checkout → Email" },
  { id: "webinar-funnel", label: "Funil de Webinar Profissional", icon: Video, description: "Promoção, inscrição e conversão via webinar" },
  { id: "product-launch", label: "Lançamento de Produto", icon: Rocket, description: "Conteúdo, engajamento e vendas" },
  { id: "blog-lead", label: "Blog para Lead", icon: FileText, description: "Converte visitantes do blog em leads" },
  { id: "funnel-advanced", label: "Funil de Vendas Avançado", icon: LayoutTemplate, description: "Segmentação, upsell e follow-up" },
  { id: "info-product-launch", label: "Lançamento de Infoproduto", icon: Rocket, description: "Conteúdo gratuito, lista VIP e oferta" },
  { id: "content-marketing", label: "Marketing de Conteúdo", icon: FileText, description: "Blog, SEO, redes sociais e conversão" },
  { id: "affiliate-marketing", label: "Marketing de Afiliados", icon: Users, description: "Estratégia para maximizar comissões" },
  { id: "b2b-sales-funnel", label: "Funil de Vendas B2B", icon: BarChart, description: "Geração de leads e vendas B2B" },
]

// páginas
const mainPageItems = [
  { id: "landing", label: "Landing Page", description: "Captura de leads", icon: FileCode, category: "main", pageType: "landing" },
  { id: "sales", label: "Página de Vendas", description: "Converter visitantes", icon: ShoppingCart, category: "main", pageType: "sales" },
  { id: "checkout", label: "Checkout", description: "Finalização de compra", icon: CreditCard, category: "main", pageType: "checkout" },
  { id: "thank-you", label: "Agradecimento", description: "Pós-compra", icon: ThumbsUp, category: "main", pageType: "thank-you" },
]

const contentPageItems = [
  { id: "webinar", label: "Página de Webinar", description: "Inscrição em evento", icon: Video, category: "content", pageType: "webinar" },
  { id: "blog", label: "Blog", description: "Artigos e conteúdo", icon: FileText, category: "content", pageType: "blog" },
  { id: "comparison", label: "Comparação", description: "Comparativo de produtos", icon: BarChart2, category: "content", pageType: "comparison" },
  { id: "affiliates", label: "Afiliados", description: "Programa de afiliados", icon: Users, category: "content", pageType: "affiliates" },
  { id: "members", label: "Área de Membros", description: "Login e restrito", icon: Lock, category: "content", pageType: "members" },
  { id: "faq", label: "FAQ/Suporte", description: "Dúvidas e suporte", icon: FileQuestion, category: "content", pageType: "faq" },
  { id: "about", label: "Sobre Nós", description: "A empresa/marca", icon: Info, category: "content", pageType: "about" },
  { id: "contact", label: "Contato", description: "Fale conosco", icon: Mail, category: "content", pageType: "contact" },
  { id: "content-creation", label: "Conteúdo", description: "Criação de conteúdo", icon: Plus, category: "content", pageType: "content-creation" },
  { id: "marketing-analysis", label: "Análise", description: "Medição e análise", icon: Plus, category: "content", pageType: "marketing-analysis" },
  { id: "email-marketing", label: "Email", description: "Fluxos de email", icon: Plus, category: "content", pageType: "email-marketing" },
  { id: "marketing-campaign", label: "Campanha", description: "Campanhas", icon: Plus, category: "content", pageType: "marketing-campaign" },
  { id: "social-media", label: "Mídia Social", description: "Redes sociais", icon: Plus, category: "content", pageType: "social-media" },
  ...writingNodeItems,
]

const pageItems = [...mainPageItems, ...contentPageItems]

const lineStyles = [
  { id: "solid", label: "Sólida", icon: Minus },
  { id: "dashed", label: "Tracejada", icon: Minus },
  { id: "dotted", label: "Pontilhada", icon: Minus },
]

const animationTypes = [
  { id: "none", label: "Nenhuma" },
  { id: "dots", label: "Bolinhas" },
  { id: "pulse", label: "Pulsar" },
]

// preview
function generateFlowPreview(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0 || !isBrowser) return "/marketing-flow.png"
  const canvas = document.createElement("canvas")
  canvas.width = 300
  canvas.height = 200
  const ctx = canvas.getContext("2d")
  if (!ctx) return "/marketing-flow.png"

  ctx.fillStyle = "#111"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const rect = getRectOfNodes(nodes)
  const pad = 30
  const xScale = (canvas.width - pad * 2) / (rect.width || 1)
  const yScale = (canvas.height - pad * 2) / (rect.height || 1)
  const scale = Math.min(xScale, yScale, 1)

  ctx.strokeStyle = "#555"
  ctx.lineWidth = 2

  edges.forEach((e) => {
    const s = nodes.find((n) => n.id === e.source)
    const t = nodes.find((n) => n.id === e.target)
    if (!s || !t) return
    const sx = (s.position.x - rect.x) * scale + pad
    const sy = (s.position.y - rect.y) * scale + pad
    const tx = (t.position.x - rect.x) * scale + pad
    const ty = (t.position.y - rect.y) * scale + pad
    ctx.beginPath()
    if (e.style?.strokeDasharray) ctx.setLineDash(e.style.strokeDasharray.split(" ").map(Number))
    else ctx.setLineDash([])
    ctx.moveTo(sx, sy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
    ctx.setLineDash([])
  })

  nodes.forEach((n) => {
    const x = (n.position.x - rect.x) * scale + pad
    const y = (n.position.y - rect.y) * scale + pad
    const w = 40, h = 30
    let color = "#666"
    if (n.type === "contentCreationNode") color = "#c0392b"
    else if (n.type === "marketingAnalysisNode") color = "#f39c12"
    else if (n.type === "emailMarketingNode") color = "#2ecc71"
    else if (n.type === "marketingCampaignNode") color = "#34495e"
    else if (n.type === "socialMediaMarketingNode") color = "#9b59b6"
    ctx.fillStyle = color
    ctx.fillRect(x - w / 2, y - h / 2, w, h)
    ctx.strokeStyle = "#fff"
    ctx.strokeRect(x - w / 2, y - h / 2, w, h)
  })

  return canvas.toDataURL("image/png")
}

// ========= PAGE =========
export default function MindMapView() {
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === "dark"

  const [activeView, setActiveView] = useState<"dashboard" | "editor" | "advanced-funnel">("dashboard")
  const [activeNavItem, setActiveNavItem] = useState<"pages" | "templates" | "icons">("templates")
  const [showPanel, setShowPanel] = useState<"pages" | "templates" | "icons" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const [workInProgress, setWorkInProgress] = useLocalStorage<{ nodes: Node[]; edges: Edge[]; flowName: string } | null>("work-in-progress", null)

  const filteredIcons = useMemo(
    () => marketingIcons.filter((i) => i.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm],
  )
  const filteredTemplates = useMemo(
    () => templateItems.filter(t =>
      t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm],
  )
  const filteredMainPages = useMemo(
    () => mainPageItems.filter(p =>
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm],
  )
  const filteredContentPages = useMemo(
    () => contentPageItems.filter(p =>
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm],
  )

  const handleDashboardClick = () => {
    if (activeView !== "dashboard") {
      const currentWork = safeLocalStorage.getItem("current-work-state")
      if (currentWork) {
        try {
          setWorkInProgress(JSON.parse(currentWork))
        } catch {}
      }
    }
    setActiveView("dashboard")
  }
  const handleFunnelClick = () => setActiveView("editor")
  const handleAdvancedFunnelClick = () => setActiveView("advanced-funnel")
  const handleCreateProject = () => setActiveView("editor")

  const handleNavClick = (nav: "pages" | "templates" | "icons") => {
    setShowPanel((prev) => (prev === nav ? null : nav))
    setActiveNavItem(nav)
    setSearchTerm("")
  }
  const toggleSidebar = () => setShowSidebar((v) => !v)

  const handleLoadTemplate = (id: string) => {
    setSelectedTemplateId(id)
    safeLocalStorage.setItem("selected-template-id", id)
  }

  useEffect(() => {
    if (selectedTemplateId) handleLoadTemplate(selectedTemplateId)
  }, [selectedTemplateId])

  return (
    <div className="flex h-[calc(100vh-0px)] bg-background text-foreground">
      {showSidebar && (
        <div className="w-[230px] border-r border-border flex flex-col bg-card/40 backdrop-blur-sm">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-lg font-bold">BLACK&apos;s FANNEL</h1>
            <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Esconder menu">
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div className="flex-1 py-4">
            <NavItem icon={<LayoutGrid size={18} />} label="Dashboard" active={activeView === "dashboard"} onClick={handleDashboardClick} />
            <NavItem icon={<FileText size={18} />} label="Criação de Funil" active={activeView === "editor"} onClick={handleFunnelClick} />
            <NavItem icon={<Layers size={18} />} label="Funil Avançado" active={activeView === "advanced-funnel"} onClick={handleAdvancedFunnelClick} />
          </div>

          <div className="p-4 border-t border-border flex items-center">
            <div className="flex items-center gap-2">
              <Sun size={16} className={cn("text-muted-foreground", !isDarkMode && "text-yellow-500")} />
              <button onClick={toggleTheme} className={cn("relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                isDarkMode ? "bg-primary" : "bg-muted")}>
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-background shadow transition",
                  isDarkMode ? "translate-x-6" : "translate-x-1")} />
              </button>
              <Moon size={16} className={cn("text-muted-foreground", isDarkMode && "text-blue-400")} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {!showSidebar && (
          <button onClick={toggleSidebar}
            className="absolute top-4 left-4 z-10 p-2 rounded-md bg-card border border-border text-foreground hover:bg-muted"
            aria-label="Mostrar menu">
            <PanelLeft size={18} />
          </button>
        )}

        {activeView === "dashboard" ? (
          <DashboardView onCreateProject={handleCreateProject} />
        ) : activeView === "advanced-funnel" ? (
          <FunilAvancadoView />
        ) : (
          <>
            <div className="w-[60px] bg-card/40 border-r border-border">
              <NavButton icon={<FileText size={20} />} label="Páginas" active={activeNavItem === "pages"} onClick={() => handleNavClick("pages")} />
              <NavButton icon={<Layers size={20} />} label="Templates" active={activeNavItem === "templates"} onClick={() => handleNavClick("templates")} />
              <NavButton icon={<Palette size={20} />} label="Ícones" active={activeNavItem === "icons"} onClick={() => handleNavClick("icons")} />
            </div>

            <div className="flex-1 flex min-h-0">
              {showPanel && (
                <div className="w-[300px] bg-card/40 border-r border-border flex flex-col min-h-0">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-4">
                      {showPanel === "pages" && <FileText size={20} />}
                      {showPanel === "templates" && <Layers size={20} />}
                      {showPanel === "icons" && <Palette size={20} />}
                      <h2 className="text-lg font-semibold">
                        {showPanel === "pages" ? "Páginas" : showPanel === "templates" ? "Templates" : "Ícones"}
                      </h2>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        placeholder={`Buscar ${showPanel === "pages" ? "páginas" : showPanel === "templates" ? "templates" : "ícones"}...`}
                        className="pl-9 bg-background border-border"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    {showPanel === "pages" && (
                      <div className="space-y-3">
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Componentes de páginas para funis de marketing.</p>
                        </div>

                        {filteredMainPages.length > 0 && (
                          <div className="space-y-2">
                            {filteredMainPages.map((page) => (
                              <DraggablePageItemNew key={page.id} id={page.id} icon={page.icon}
                                label={page.label} description={page.description} pageType={page.pageType} />
                            ))}
                          </div>
                        )}

                        {filteredContentPages.length > 0 && (
                          <>
                            <div className="mt-6 mb-2">
                              <h3 className="text-sm font-medium text-muted-foreground">Páginas de Conteúdo</h3>
                            </div>
                            <div className="space-y-2">
                              {filteredContentPages.map((page) => (
                                <DraggablePageItemNew key={page.id} id={page.id} icon={page.icon}
                                  label={page.label} description={page.description} pageType={page.pageType} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {showPanel === "templates" && (
                      <div className="space-y-4 p-2">
                        {filteredTemplates.map((tpl) => (
                          <TemplateCard key={tpl.id} id={tpl.id} label={tpl.label}
                            description={tpl.description} onUseTemplate={handleLoadTemplate} />
                        ))}
                      </div>
                    )}

                    {showPanel === "icons" && (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredIcons.map((icon) => (
                          <DraggableIconButton key={icon.id} id={icon.id} icon={icon.icon}
                            label={icon.label} color={icon.color}
                            customIcon={typeof icon.icon === "string" ? icon.icon : undefined} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0">
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

// ------------ shared ui ------------
const IconStyle = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1 shadow-md" style={{ background: color }}>
    {children}
  </div>
)

function DraggableIconButton({ id, icon, label, color, customIcon }: {
  id: string; icon: any; label: string; color: string; customIcon?: string
}) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow", JSON.stringify({ type: "marketingIconNode", id, label, color, iconId: id }))
    e.dataTransfer.effectAllowed = "move"
  }
  return (
    <div className="flex flex-col items-center mb-4 cursor-grab active:cursor-grabbing" draggable onDragStart={onDragStart}>
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
      <span className="text-xs text-center text-muted-foreground">{label}</span>
    </div>
  )
}

function DraggablePageItemNew({ id, icon, label, description, pageType }: {
  id: string; icon: any; label: string; description: string; pageType: string
}) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow", JSON.stringify({ type: "pageNode", id, label, description, pageType }))
    e.dataTransfer.effectAllowed = "move"
  }
  return (
    <div className="flex items-center p-3 bg-card rounded-lg cursor-grab active:cursor-grabbing hover:bg-muted transition-colors border border-border"
      draggable onDragStart={onDragStart}>
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3 flex-shrink-0">
        <div className="h-5 w-5 text-foreground">{React.createElement(icon)}</div>
      </div>
      <div>
        <h3 className="text-sm font-medium">{label}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function TemplateCard({ id, label, description, onUseTemplate }: {
  id: string; label: string; description: string; onUseTemplate: (id: string) => void
}) {
  return (
    <div className="mb-4 bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="text-xl font-medium mb-1">{label}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <button className="w-full bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-md flex items-center justify-center"
          onClick={() => onUseTemplate(id)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Usar Template
        </button>
      </div>
    </div>
  )
}

function DashboardView({ onCreateProject }: { onCreateProject: () => void }) {
  const [savedFlows, setSavedFlows] = useLocalStorage<{ name: string; nodes: Node[]; edges: Edge[]; preview?: string }[]>(
    "marketing-flows", []
  )
  const { toast } = useToast()

  const loadFlow = (flow: { name: string; nodes: Node[]; edges: Edge[] }) => {
    safeLocalStorage.setItem("selected-flow", JSON.stringify(flow))
    onCreateProject()
  }

  const deleteFlow = (idx: number) => {
    const arr = [...savedFlows]
    arr.splice(idx, 1)
    setSavedFlows(arr)
    toast({ title: "Fluxo excluído", description: "O fluxo foi excluído com sucesso." })
  }

  const duplicateFlow = (flow: { name: string; nodes: Node[]; edges: Edge[]; preview?: string }, idx: number) => {
    const newFlow = { ...flow, name: `${flow.name} (cópia)` }
    const arr = [...savedFlows]
    arr.splice(idx + 1, 0, newFlow)
    setSavedFlows(arr)
    toast({ title: "Fluxo duplicado", description: `Uma cópia de "${flow.name}" foi criada.` })
  }

  return (
    <div className="w-full flex flex-col p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meus Projetos</h1>
        <Button onClick={onCreateProject} className="bg-muted border border-border hover:bg-muted/80">
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Novo Funil
        </Button>
      </div>

      {savedFlows.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-3">Nenhum projeto encontrado</h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Você ainda não criou nenhum projeto. Comece criando um novo funil de marketing.
          </p>
          <Button onClick={onCreateProject} className="bg-muted border border-border hover:bg-muted/80">
            Criar Primeiro Projeto
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedFlows.map((flow, index) => (
            <Card key={index} className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="h-40 bg-muted relative cursor-pointer" onClick={() => loadFlow(flow)}>
                  {flow.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={flow.preview} alt={`Miniatura do fluxo ${flow.name}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/marketing-flow.png?height=160&width=300&query=${encodeURIComponent(flow.name)}`}
                        alt={`Miniatura do fluxo ${flow.name}`} className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button variant="secondary" size="sm" className="bg-background text-foreground hover:bg-muted">
                      Abrir Projeto
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{flow.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {flow.nodes.length} nós e {flow.edges.length} conexões
                  </p>
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" className="border-border" onClick={() => loadFlow(flow)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-border" onClick={() => duplicateFlow(flow, index)}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicar</span>
                      </Button>
                      <Button variant="outline" size="sm" className="border-border" onClick={() => deleteFlow(index)}>
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

// ------------ Flow Builder ------------
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
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [flowName, setFlowName] = useState("Novo Projeto de Marketing")
  const { project } = useReactFlow()

  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([])
  const [showEdgeSettings, setShowEdgeSettings] = useState(false)
  const [defaultLineStyle, setDefaultLineStyle] = useState<string>("solid")
  const [defaultAnimation, setDefaultAnimation] = useState<string>("none")
  const [defaultLineColor, setDefaultLineColor] = useState<string>("#ffffff")

  const [savedFlows, setSavedFlows] = useLocalStorage<{ name: string; nodes: Node[]; edges: Edge[]; preview?: string }[]>(
    "marketing-flows", []
  )

  useEffect(() => {
    const selectedFlowJson = safeLocalStorage.getItem("selected-flow")
    const storedTemplateId = safeLocalStorage.getItem("selected-template-id")

    if (selectedFlowJson) {
      try {
        const selectedFlow = JSON.parse(selectedFlowJson)
        setNodes(selectedFlow.nodes || [])
        setEdges(selectedFlow.edges || [])
        setFlowName(selectedFlow.name || "Novo Projeto de Marketing")
        safeLocalStorage.removeItem("selected-flow")
        toast({ title: "Fluxo carregado", description: `O fluxo "${selectedFlow.name}" foi carregado para edição.` })
      } catch {}
    } else if (storedTemplateId) {
      loadTemplateById(storedTemplateId)
      safeLocalStorage.removeItem("selected-template-id")
    }
  }, [setNodes, setEdges, toast])

  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateById(selectedTemplateId)
      setSelectedTemplateId(null)
    }
  }, [selectedTemplateId, setSelectedTemplateId])

  const loadTemplateById = (templateId: string) => {
    const template = getTemplateById(templateId)
    if (template) {
      setNodes(template.nodes)
      setEdges(template.edges)
      setFlowName(template.name)
      toast({ title: "Template carregado", description: `O template "${template.name}" foi carregado com sucesso.` })
    } else {
      toast({ title: "Erro ao carregar template", description: "Template não encontrado.", variant: "destructive" })
    }
  }

  useOnSelectionChange({
    onChange: ({ edges }) => {
      setSelectedEdges(edges)
      setShowEdgeSettings(edges.length > 0)
    },
  })

  const onConnect = useCallback((params: Connection) => {
    const newEdge: Edge = {
      ...params,
      animated: defaultAnimation === "dots",
      style: {
        stroke: defaultLineColor,
        strokeWidth: 2,
        ...(defaultLineStyle === "dashed" && { strokeDasharray: "5 5" }),
        ...(defaultLineStyle === "dotted" && { strokeDasharray: "2 2" }),
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: defaultLineColor },
    }
    setEdges((eds) => addEdge(newEdge, eds))
  }, [setEdges, defaultLineStyle, defaultAnimation, defaultLineColor])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const wrap = reactFlowWrapper.current?.getBoundingClientRect()
    if (!wrap || !reactFlowInstance) return

    const data = e.dataTransfer.getData("application/reactflow")
    if (!data) return

    try {
      const nodeData = JSON.parse(data)
      const position = reactFlowInstance.project({ x: e.clientX - wrap.left, y: e.clientY - wrap.top })
      const newNode: Node = {
        id: `${nodeData.id}-${Date.now()}`,
        type: nodeData.type,
        position,
        data: { label: nodeData.label, color: nodeData.color, ...(nodeData.iconId && { iconId: nodeData.iconId }), ...(nodeData.description && { description: nodeData.description }), ...(nodeData.pageType && { pageType: nodeData.pageType }) },
        draggable: true,
      }
      setNodes((nds) => nds.concat(newNode))
      toast({ title: "Item adicionado", description: `${nodeData.label} foi adicionado ao fluxo.` })
    } catch {
      toast({ title: "Erro", description: "Não foi possível adicionar o item ao fluxo.", variant: "destructive" })
    }
  }, [reactFlowInstance, setNodes, toast])

  const updateSelectedEdgesStyle = useCallback((style: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        selectedEdges.some((s) => s.id === edge.id)
          ? { ...edge, style: { ...edge.style, strokeDasharray: style === "solid" ? undefined : style === "dashed" ? "5 5" : "2 2" } }
          : edge
      ),
    )
  }, [selectedEdges, setEdges])

  const updateSelectedEdgesAnimation = useCallback((animation: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        selectedEdges.some((s) => s.id === edge.id) ? { ...edge, animated: animation === "dots" } : edge
      ),
    )
  }, [selectedEdges, setEdges])

  const updateSelectedEdgesColor = useCallback((color: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        selectedEdges.some((s) => s.id === edge.id)
          ? { ...edge, style: { ...edge.style, stroke: color }, markerEnd: { ...edge.markerEnd, color } }
          : edge
      ),
    )
  }, [selectedEdges, setEdges])

  const saveFlow = useCallback(() => {
    if (nodes.length === 0) {
      toast({ title: "Erro ao salvar", description: "Não é possível salvar um fluxo vazio.", variant: "destructive" })
      return
    }
    const preview = generateFlowPreview(nodes, edges)
    const newFlow = { name: flowName, nodes, edges, preview }
    const idx = savedFlows.findIndex((f) => f.name === flowName)
    if (idx >= 0) {
      const arr = [...savedFlows]; arr[idx] = newFlow; setSavedFlows(arr)
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
    setNodes([]); setEdges([]); setFlowName("Novo Projeto de Marketing")
    toast({ title: "Fluxo limpo", description: "Todos os elementos foram removidos do fluxo." })
  }, [nodes.length, setNodes, setEdges, toast])

  useEffect(() => {
    if (isBrowser) {
      const state = { nodes, edges, flowName }
      safeLocalStorage.setItem("current-work-state", JSON.stringify(state))
    }
  }, [nodes, edges, flowName])

  useEffect(() => {
    if (isBrowser) {
      const wip = safeLocalStorage.getItem("work-in-progress")
      if (wip && !selectedTemplateId) {
        try {
          const data = JSON.parse(wip)
          if (data.nodes?.length) {
            setNodes(data.nodes); setEdges(data.edges || []); setFlowName(data.flowName || "Trabalho em Progresso")
            safeLocalStorage.removeItem("work-in-progress")
            toast({ title: "Trabalho restaurado", description: "Seu trabalho anterior foi restaurado automaticamente." })
          }
        } catch {}
      }
    }
  }, [selectedTemplateId, setNodes, setEdges, toast])

  return (
    <>
      <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card/40">
        <Input value={flowName} onChange={(e) => setFlowName(e.target.value)} className="max-w-xs bg-background border-border" />
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="bg-muted border-border hover:bg-muted/80 h-8 px-2" onClick={saveFlow}>
            <Save className="mr-1 h-3.5 w-3.5" />Salvar
          </Button>
          <Button variant="outline" size="sm" className="bg-muted border-border hover:bg-muted/80 h-8 px-2" onClick={loadFlow}>
            <Download className="mr-1 h-3.5 w-3.5" />Carregar
          </Button>
          <Button variant="outline" size="sm" className="bg-muted border-border hover:bg-muted/80 h-8 px-2" onClick={clearFlow}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />Limpar
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-muted border-border hover:bg-muted/80 h-8 px-2">
                <Settings className="mr-1 h-3.5 w-3.5" />Estilo
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border-border text-foreground p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Configurações de Linha Padrão</h3>

                <div className="space-y-2">
                  <Label htmlFor="line-style">Estilo de Linha</Label>
                  <Select value={defaultLineStyle} onValueChange={setDefaultLineStyle}>
                    <SelectTrigger id="line-style" className="bg-background border-border">
                      <SelectValue placeholder="Selecione um estilo" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="solid">Sólida</SelectItem>
                      <SelectItem value="dashed">Tracejada</SelectItem>
                      <SelectItem value="dotted">Pontilhada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="animation-type">Animação</Label>
                  <Select value={defaultAnimation} onValueChange={setDefaultAnimation}>
                    <SelectTrigger id="animation-type" className="bg-background border-border">
                      <SelectValue placeholder="Selecione uma animação" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="dots">Bolinhas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-color">Cor da Linha</Label>
                  <div className="flex gap-2">
                    {["#ffffff", "#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6"].map((c) => (
                      <button key={c} className={cn("w-8 h-8 rounded-full border", defaultLineColor === c && "ring-2 ring-primary")}
                        style={{ backgroundColor: c }} onClick={() => setDefaultLineColor(c)} />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div ref={reactFlowWrapper} className="flex-1 relative min-h-0" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          fitViewOptions={{ padding: 100 }}
          nodesDraggable
          elementsSelectable
          selectNodesOnDrag={false}
          defaultEdgeOptions={{
            animated: defaultAnimation === "dots",
            style: {
              stroke: defaultLineColor,
              strokeWidth: 2,
              ...(defaultLineStyle === "dashed" && { strokeDasharray: "5 5" }),
              ...(defaultLineStyle === "dotted" && { strokeDasharray: "2 2" }),
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: defaultLineColor },
          }}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background color={isBrowser && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#333" : "#ddd"} variant="dots" gap={12} size={1} />

          <div className="absolute bottom-4 right-4 flex flex-col bg-card border border-border rounded">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ZoomIn size={16} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ZoomOut size={16} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Maximize size={16} /></Button>
          </div>

          {showEdgeSettings && (
            <Panel position="top-right" className="bg-card border border-border rounded p-3 mr-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Configurar Linhas</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowEdgeSettings(false)}><X size={14} /></Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Estilo de Linha</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-2 border-border" onClick={() => updateSelectedEdgesStyle("solid")}>
                      <Minus size={14} className="mr-1" />Sólida
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2 border-border" onClick={() => updateSelectedEdgesStyle("dashed")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="5,5" d="M3 12h18"/></svg>
                      Tracejada
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2 border-border" onClick={() => updateSelectedEdgesStyle("dotted")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2,2" d="M3 12h18"/></svg>
                      Pontilhada
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Animação</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-2 border-border" onClick={() => updateSelectedEdgesAnimation("none")}>Nenhuma</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2 border-border" onClick={() => updateSelectedEdgesAnimation("dots")}>
                      <Circle size={14} className="mr-1" />Bolinhas
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Cor</Label>
                  <div className="flex gap-2">
                    {["#ffffff", "#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6"].map((c) => (
                      <button key={c} className="w-8 h-8 rounded-full" style={{ backgroundColor: c }} onClick={() => updateSelectedEdgesColor(c)} />
                    ))}
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

// nav items
function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-2 my-1 mx-2 rounded-md cursor-pointer",
      active ? "bg-muted" : "hover:bg-muted/60")} onClick={onClick}>
      {icon}<span className="text-sm">{label}</span>
    </div>
  )
}
function NavButton({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center py-4" onClick={onClick}>
      <div className={cn("p-2 rounded-md cursor-pointer", active ? "bg-muted" : "hover:bg-muted/60")}>{icon}</div>
      <span className="text-xs mt-1 text-muted-foreground">{label}</span>
    </div>
  )
}
