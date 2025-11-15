import { type Node, type Edge, MarkerType } from "reactflow"

// Interface para os dados do template
export interface TemplateData {
  id: string
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
}

// Função para criar um nó de página
const createPageNode = (
  id: string,
  label: string,
  description: string,
  pageType: string,
  position: { x: number; y: number },
): Node => ({
  id,
  type: "pageNode",
  position,
  data: {
    label,
    description,
    pageType,
    hasCallToAction: true,
  },
  draggable: true,
})

// Função para criar um nó de ícone de marketing
const createIconNode = (
  id: string,
  label: string,
  iconId: string,
  color: string,
  position: { x: number; y: number },
): Node => ({
  id,
  type: "marketingIconNode",
  position,
  data: {
    label,
    iconId,
    color,
  },
  draggable: true,
})

// Função para criar uma conexão entre nós
const createEdge = (
  source: string,
  target: string,
  color = "#ffffff",
  animated = false,
  style: "solid" | "dashed" | "dotted" = "solid",
): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
  animated,
  style: {
    stroke: color,
    strokeWidth: 2,
    ...(style === "dashed" && { strokeDasharray: "5 5" }),
    ...(style === "dotted" && { strokeDasharray: "2 2" }),
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color,
  },
})

// Template exato da imagem de referência
export const exactReferenceTemplate: TemplateData = {
  id: "exact-reference",
  name: "Funil de Marketing Completo",
  description: "Funil completo com múltiplos canais, webinar, segmentação e follow-up",
  nodes: [
    // Canais de aquisição (lado esquerdo)
    createIconNode("search", "Pesquisa", "search", "#FF5252", { x: 60, y: 100 }),
    createIconNode("program-affiliates", "Programa de Afiliados", "affiliates", "#2ecc71", { x: 60, y: 200 }),
    createIconNode("facebook-ad", "Facebook Ad", "facebook", "#4267B2", { x: 60, y: 300 }),
    createIconNode("instagram-ad", "Instagram Ad", "instagram", "#E1306C", { x: 60, y: 400 }),
    createIconNode("tiktok", "TikTok", "tiktok", "#000000", { x: 60, y: 500 }),
    createIconNode("youtube-ads", "YouTube Ads", "youtube", "#FF0000", { x: 60, y: 600 }),
    createIconNode("linkedin", "LinkedIn", "linkedin", "#0077B5", { x: 60, y: 700 }),

    // Primeira coluna de páginas
    createPageNode("blog-post", "Blog Post", "Artigo de blog", "blog", { x: 300, y: 180 }),
    createPageNode("webinar-registration", "Webinar Registration", "Registro para webinar", "webinar", {
      x: 300,
      y: 450,
    }),
    createPageNode("survey", "Survey", "Pesquisa com visitantes", "landing", { x: 300, y: 700 }),

    // Nós de lead e email
    createIconNode("lead", "Lead", "lead", "#f39c12", { x: 550, y: 250 }),
    createIconNode("email-follow-ups", "Email Follow Ups", "email", "#3498db", { x: 550, y: 370 }),

    // Nós de segmentação
    createIconNode("segment-2", "Segment #2", "segment", "#e74c3c", { x: 550, y: 650 }),
    createIconNode("segment-3", "Segment #3", "segment", "#e74c3c", { x: 550, y: 750 }),

    // Segunda coluna de páginas
    createPageNode("live-webinar", "Live Webinar", "Webinar ao vivo", "webinar", { x: 550, y: 450 }),

    // Terceira coluna
    createIconNode("retargeting", "Retargeting", "retargeting", "#34495e", { x: 800, y: 200 }),
    createPageNode("sales-page-video", "Sales Page Video", "Página de vendas com vídeo", "sales", { x: 800, y: 300 }),
    createIconNode("front-end-customer", "Front-end Customer", "front-end", "#2ecc71", { x: 800, y: 450 }),
    createIconNode("report", "Report", "report", "#7f8c8d", { x: 800, y: 650 }),

    // Quarta coluna
    createPageNode("upsell-oto", "Upsell OTO", "Oferta única de upsell", "sales", { x: 1050, y: 450 }),
    createIconNode("watch-video", "Watch Video", "video", "#e74c3c", { x: 1050, y: 650 }),

    // Quinta coluna
    createIconNode("email", "Email", "email", "#3498db", { x: 1300, y: 530 }),
    createIconNode("sms", "SMS", "sms", "#9b59b6", { x: 1300, y: 650 }),

    // Sexta coluna
    createPageNode("calendar", "Calendar", "Página de agendamento", "landing", { x: 1550, y: 180 }),
    createIconNode("deal-lost", "Deal Lost", "deal-lost", "#e74c3c", { x: 1550, y: 280 }),
    createIconNode("sales-pipeline", "Sales Pipeline", "pipeline", "#e74c3c", { x: 1300, y: 320 }),
    createIconNode("sales-conversation", "Sales Conversation", "conversation", "#3498db", { x: 1550, y: 380 }),
    createPageNode("order-page", "Order Page", "Página de pedido", "checkout", { x: 1550, y: 650 }),
    createIconNode("back-end-customer", "Back-end Customer", "back-end", "#27ae60", { x: 1550, y: 450 }),
    createIconNode("sales-follow-up", "Sales Follow Up", "follow-up", "#3498db", { x: 1550, y: 530 }),
  ],
  edges: [
    // Conexões para Blog Post
    createEdge("search", "blog-post", "#FF5252", false, "dashed"),
    createEdge("program-affiliates", "blog-post", "#2ecc71", false, "dashed"),
    createEdge("facebook-ad", "blog-post", "#4267B2", false, "dashed"),
    createEdge("instagram-ad", "blog-post", "#4267B2", false, "dashed"),

    // Conexões para Webinar Registration
    createEdge("facebook-ad", "webinar-registration", "#4267B2", false, "dashed"),
    createEdge("instagram-ad", "webinar-registration", "#E1306C", false, "dashed"),
    createEdge("tiktok", "webinar-registration", "#000000", false, "dashed"),
    createEdge("youtube-ads", "webinar-registration", "#FF0000", false, "dashed"),

    // Conexões para Survey
    createEdge("linkedin", "survey", "#0077B5", false, "dashed"),
    createEdge("tiktok", "survey", "#000000", false, "dashed"),

    // Conexões do Blog Post
    createEdge("blog-post", "lead", "#3498db"),

    // Conexões do Lead
    createEdge("lead", "email-follow-ups", "#f39c12"),
    createEdge("lead", "retargeting", "#f39c12", false, "dashed"),

    // Conexões do Webinar Registration
    createEdge("webinar-registration", "live-webinar", "#3498db"),

    // Conexões do Live Webinar
    createEdge("live-webinar", "sales-page-video", "#3498db"),

    // Conexões do Email Follow Ups
    createEdge("email-follow-ups", "live-webinar", "#3498db", true, "dashed"),

    // Conexões do Retargeting
    createEdge("retargeting", "sales-page-video", "#34495e", false, "dashed"),

    // Conexões do Sales Page Video
    createEdge("sales-page-video", "front-end-customer", "#3498db"),

    // Conexões do Front-end Customer
    createEdge("front-end-customer", "upsell-oto", "#2ecc71"),

    // Conexões do Survey
    createEdge("survey", "segment-2", "#3498db"),
    createEdge("survey", "segment-3", "#3498db"),

    // Conexões dos Segments
    createEdge("segment-2", "report", "#e74c3c"),
    createEdge("segment-3", "report", "#e74c3c"),

    // Conexões do Report
    createEdge("report", "watch-video", "#7f8c8d"),

    // Conexões do Upsell OTO
    createEdge("upsell-oto", "back-end-customer", "#3498db"),

    // Conexões do Back-end Customer
    createEdge("back-end-customer", "sales-follow-up", "#27ae60"),

    // Conexões do Sales Follow Up
    createEdge("sales-follow-up", "email", "#3498db"),
    createEdge("sales-follow-up", "sms", "#3498db"),

    // Conexões do Email e SMS
    createEdge("email", "order-page", "#3498db"),
    createEdge("sms", "order-page", "#9b59b6"),

    // Conexões do Calendar
    createEdge("calendar", "deal-lost", "#3498db"),
    createEdge("calendar", "sales-pipeline", "#3498db"),

    // Conexões do Sales Pipeline
    createEdge("sales-pipeline", "sales-conversation", "#e74c3c"),

    // Conexões do Sales Conversation
    createEdge("sales-conversation", "back-end-customer", "#3498db"),
  ],
}

// Template de Funil de Vendas Básico
export const basicSalesFunnelTemplate: TemplateData = {
  id: "funnel-basic",
  name: "Funil de Vendas Básico",
  description: "Um funil de vendas clássico com landing page, página de vendas, checkout e acompanhamento por email",
  nodes: [
    createIconNode("facebook-ad", "Facebook Ad", "facebook", "#4267B2", { x: 100, y: 300 }),
    createIconNode("instagram-ad", "Instagram Ad", "instagram", "#E1306C", { x: 100, y: 450 }),

    createPageNode("landing-page", "Landing Page", "Página de captura de leads", "landing", { x: 350, y: 375 }),
    createIconNode("lead", "Lead", "lead", "#f39c12", { x: 600, y: 375 }),

    createPageNode("sales-page", "Sales Page", "Página de vendas", "sales", { x: 850, y: 375 }),
    createPageNode("checkout", "Checkout", "Página de finalização de compra", "checkout", { x: 1100, y: 375 }),

    createIconNode("front-end-customer", "Front-end Customer", "front-end", "#2ecc71", { x: 1350, y: 375 }),
    createIconNode("email-follow-up", "Email Follow Up", "email", "#3498db", { x: 1350, y: 500 }),
  ],
  edges: [
    createEdge("facebook-ad", "landing-page", "#4267B2", false, "dashed"),
    createEdge("instagram-ad", "landing-page", "#E1306C", false, "dashed"),

    createEdge("landing-page", "lead", "#3498db"),
    createEdge("lead", "sales-page", "#f39c12"),
    createEdge("sales-page", "checkout", "#3498db"),
    createEdge("checkout", "front-end-customer", "#3498db"),
    createEdge("front-end-customer", "email-follow-up", "#2ecc71"),
  ],
}

// Template de Webinar
export const webinarFunnelTemplate: TemplateData = {
  id: "webinar-funnel",
  name: "Funil de Webinar Profissional",
  description: "Funil completo para promoção, inscrição e conversão através de webinar",
  nodes: [
    createIconNode("facebook-ad", "Facebook Ad", "facebook", "#4267B2", { x: 100, y: 300 }),
    createIconNode("instagram-ad", "Instagram Ad", "instagram", "#E1306C", { x: 100, y: 400 }),
    createIconNode("youtube-ads", "YouTube Ads", "youtube", "#FF0000", { x: 100, y: 500 }),

    createPageNode("webinar-registration", "Webinar Registration", "Registro para webinar", "webinar", {
      x: 350,
      y: 400,
    }),
    createIconNode("email-reminders", "Email Reminders", "email", "#3498db", { x: 600, y: 300 }),
    createPageNode("live-webinar", "Live Webinar", "Webinar ao vivo", "webinar", { x: 600, y: 400 }),

    createPageNode("sales-page", "Sales Page Video", "Página de vendas com vídeo", "sales", { x: 850, y: 400 }),
    createIconNode("email-follow-up", "Email Follow Up", "email", "#3498db", { x: 850, y: 550 }),

    createPageNode("checkout", "Checkout", "Página de finalização de compra", "checkout", { x: 1100, y: 400 }),
    createIconNode("customer", "Customer", "front-end", "#2ecc71", { x: 1350, y: 400 }),
  ],
  edges: [
    createEdge("facebook-ad", "webinar-registration", "#4267B2", false, "dashed"),
    createEdge("instagram-ad", "webinar-registration", "#E1306C", false, "dashed"),
    createEdge("youtube-ads", "webinar-registration", "#FF0000", false, "dashed"),

    createEdge("webinar-registration", "email-reminders", "#3498db"),
    createEdge("webinar-registration", "live-webinar", "#3498db"),
    createEdge("email-reminders", "live-webinar", "#3498db", true),

    createEdge("live-webinar", "sales-page", "#3498db"),
    createEdge("live-webinar", "email-follow-up", "#3498db"),
    createEdge("email-follow-up", "sales-page", "#3498db", true, "dashed"),

    createEdge("sales-page", "checkout", "#3498db"),
    createEdge("checkout", "customer", "#3498db"),
  ],
}

// Template de Blog para Lead
export const blogLeadTemplate: TemplateData = {
  id: "blog-lead",
  name: "Blog para Lead",
  description: "Funil que converte visitantes do blog em leads qualificados",
  nodes: [
    createIconNode("search", "Pesquisa", "search", "#FF5252", { x: 100, y: 200 }),
    createIconNode("facebook-ad", "Facebook Ad", "facebook", "#4267B2", { x: 100, y: 350 }),

    createPageNode("blog-post", "Blog Post", "Artigo de blog", "blog", { x: 350, y: 275 }),
    createPageNode("lead-magnet", "Lead Magnet", "Página de captura com material gratuito", "landing", {
      x: 600,
      y: 275,
    }),

    createIconNode("lead", "Lead", "lead", "#f39c12", { x: 850, y: 275 }),
    createIconNode("email-sequence", "Email Sequence", "email", "#3498db", { x: 850, y: 400 }),

    createIconNode("segment-1", "Segment #1", "segment", "#e74c3c", { x: 1100, y: 200 }),
    createIconNode("segment-2", "Segment #2", "segment", "#e74c3c", { x: 1100, y: 325 }),
    createIconNode("segment-3", "Segment #3", "segment", "#e74c3c", { x: 1100, y: 450 }),

    createPageNode("tripwire", "Tripwire Offer", "Produto de baixo valor", "sales", { x: 1350, y: 325 }),
  ],
  edges: [
    createEdge("search", "blog-post", "#FF5252", false, "dashed"),
    createEdge("facebook-ad", "blog-post", "#4267B2", false, "dashed"),

    createEdge("blog-post", "lead-magnet", "#3498db"),
    createEdge("lead-magnet", "lead", "#3498db"),

    createEdge("lead", "email-sequence", "#f39c12"),

    createEdge("email-sequence", "segment-1", "#3498db"),
    createEdge("email-sequence", "segment-2", "#3498db"),
    createEdge("email-sequence", "segment-3", "#3498db"),

    createEdge("segment-1", "tripwire", "#e74c3c", false, "dashed"),
    createEdge("segment-2", "tripwire", "#e74c3c"),
    createEdge("segment-3", "tripwire", "#e74c3c", false, "dashed"),
  ],
}

// Template de Lançamento de Produto
export const productLaunchTemplate: TemplateData = {
  id: "product-launch",
  name: "Lançamento de Produto",
  description: "Funil completo para lançamento de produto com conteúdo, engajamento e vendas",
  nodes: [
    createIconNode("content-creation", "Content Creation", "blog", "#3498db", { x: 100, y: 275 }),

    createPageNode("blog-content", "Blog Content", "Conteúdo para gerar interesse", "blog", { x: 350, y: 275 }),
    createPageNode("opt-in", "Opt-in Page", "Captura de leads interessados", "landing", { x: 600, y: 275 }),

    createIconNode("lead", "Lead", "lead", "#f39c12", { x: 850, y: 275 }),
    createIconNode("email-sequence", "Email Sequence", "email", "#3498db", { x: 850, y: 400 }),

    createPageNode("video-series", "Video Series", "Série de vídeos educativos", "webinar", { x: 1100, y: 275 }),
    createPageNode("launch-event", "Launch Event", "Webinar ou live de lançamento", "webinar", { x: 1100, y: 450 }),

    createPageNode("sales-page", "Sales Page", "Página principal de vendas", "sales", { x: 1350, y: 450 }),
    createIconNode("scarcity-emails", "Scarcity Emails", "email", "#e74c3c", { x: 1600, y: 450 }),

    createPageNode("checkout", "Checkout", "Página de finalização de compra", "checkout", { x: 1350, y: 600 }),
    createIconNode("customer", "Customer", "front-end", "#2ecc71", { x: 1600, y: 600 }),
  ],
  edges: [
    createEdge("content-creation", "blog-content", "#3498db", false, "dashed"),
    createEdge("blog-content", "opt-in", "#3498db"),
    createEdge("opt-in", "lead", "#3498db"),

    createEdge("lead", "email-sequence", "#f39c12"),
    createEdge("lead", "video-series", "#f39c12"),

    createEdge("email-sequence", "video-series", "#3498db", true, "dashed"),
    createEdge("video-series", "launch-event", "#3498db"),

    createEdge("launch-event", "sales-page", "#3498db"),
    createEdge("sales-page", "scarcity-emails", "#3498db"),
    createEdge("scarcity-emails", "sales-page", "#e74c3c", true, "dashed"),

    createEdge("sales-page", "checkout", "#3498db"),
    createEdge("checkout", "customer", "#3498db"),
  ],
}

// Template de Funil de Vendas Avançado
export const advancedSalesFunnelTemplate: TemplateData = {
  id: "funnel-advanced",
  name: "Funil de Vendas Avançado",
  description: "Funil de vendas completo com múltiplos canais, segmentação, upsell e follow-up",
  nodes: [
    // Canais de aquisição
    createIconNode("facebook-ad", "Facebook Ad", "facebook", "#4267B2", { x: 100, y: 150 }),
    createIconNode("instagram-ad", "Instagram Ad", "instagram", "#E1306C", { x: 100, y: 250 }),
    createIconNode("youtube-ads", "YouTube Ads", "youtube", "#FF0000", { x: 100, y: 350 }),
    createIconNode("search", "Google Search", "search", "#FF5252", { x: 100, y: 450 }),
    createIconNode("tiktok", "TikTok", "tiktok", "#000000", { x: 100, y: 550 }),

    // Páginas de entrada
    createPageNode("blog-post", "Blog Post", "Artigo de blog otimizado para SEO", "blog", { x: 350, y: 200 }),
    createPageNode("landing-page", "Landing Page", "Página de captura principal", "landing", { x: 350, y: 400 }),
    createPageNode("quiz-page", "Quiz Page", "Página com quiz interativo", "landing", { x: 350, y: 600 }),

    // Captura de leads
    createIconNode("lead-magnet", "Lead Magnet", "lead", "#f39c12", { x: 600, y: 200 }),
    createIconNode("lead-quiz", "Quiz Lead", "lead", "#f39c12", { x: 600, y: 600 }),

    // Email marketing
    createIconNode("welcome-email", "Welcome Email", "email", "#3498db", { x: 600, y: 300 }),
    createIconNode("nurture-sequence", "Nurture Sequence", "email", "#3498db", { x: 600, y: 400 }),
    createIconNode("quiz-followup", "Quiz Follow-up", "email", "#3498db", { x: 600, y: 500 }),

    // Segmentação
    createIconNode("segment-hot", "Hot Leads", "segment", "#e74c3c", { x: 850, y: 300 }),
    createIconNode("segment-warm", "Warm Leads", "segment", "#e74c3c", { x: 850, y: 400 }),
    createIconNode("segment-cold", "Cold Leads", "segment", "#e74c3c", { x: 850, y: 500 }),

    // Retargeting
    createIconNode("retargeting-ads", "Retargeting Ads", "retargeting", "#34495e", { x: 850, y: 200 }),
    createIconNode("retargeting-email", "Retargeting Email", "email", "#3498db", { x: 850, y: 600 }),

    // Páginas de vendas
    createPageNode("webinar", "Webinar", "Webinar de vendas", "webinar", { x: 1100, y: 200 }),
    createPageNode("sales-page", "Sales Page", "Página de vendas principal", "sales", { x: 1100, y: 400 }),
    createPageNode("case-studies", "Case Studies", "Página de estudos de caso", "blog", { x: 1100, y: 600 }),

    // Checkout e upsell
    createPageNode("checkout", "Checkout", "Página de finalização de compra", "checkout", { x: 1350, y: 400 }),
    createPageNode("upsell-page", "Upsell Page", "Página de oferta adicional", "sales", { x: 1600, y: 300 }),
    createPageNode("downsell-page", "Downsell Page", "Página de oferta alternativa", "sales", { x: 1600, y: 500 }),

    // Pós-venda
    createIconNode("customer", "Customer", "front-end", "#2ecc71", { x: 1850, y: 400 }),
    createIconNode("onboarding", "Onboarding", "email", "#3498db", { x: 1850, y: 300 }),
    createIconNode("satisfaction", "Satisfaction", "email", "#3498db", { x: 1850, y: 500 }),

    // Fidelização
    createPageNode("membership", "Membership", "Área de membros", "members", { x: 2100, y: 300 }),
    createIconNode("referral", "Referral Program", "affiliates", "#2ecc71", { x: 2100, y: 500 }),
  ],
  edges: [
    // Conexões para páginas de entrada
    createEdge("facebook-ad", "landing-page", "#4267B2", false, "dashed"),
    createEdge("instagram-ad", "landing-page", "#E1306C", false, "dashed"),
    createEdge("search", "blog-post", "#FF5252", false, "dashed"),
    createEdge("youtube-ads", "landing-page", "#FF0000", false, "dashed"),
    createEdge("tiktok", "quiz-page", "#000000", false, "dashed"),
    createEdge("facebook-ad", "quiz-page", "#4267B2", false, "dashed"),

    // Conexões para captura de leads
    createEdge("blog-post", "lead-magnet", "#3498db"),
    createEdge("landing-page", "nurture-sequence", "#3498db"),
    createEdge("quiz-page", "lead-quiz", "#3498db"),

    // Conexões de email marketing
    createEdge("lead-magnet", "welcome-email", "#f39c12"),
    createEdge("welcome-email", "nurture-sequence", "#3498db"),
    createEdge("lead-quiz", "quiz-followup", "#f39c12"),

    // Conexões de segmentação
    createEdge("nurture-sequence", "segment-hot", "#3498db"),
    createEdge("nurture-sequence", "segment-warm", "#3498db"),
    createEdge("nurture-sequence", "segment-cold", "#3498db"),
    createEdge("quiz-followup", "segment-hot", "#3498db"),
    createEdge("quiz-followup", "segment-warm", "#3498db"),

    // Conexões de retargeting
    createEdge("segment-warm", "retargeting-ads", "#e74c3c"),
    createEdge("segment-cold", "retargeting-email", "#e74c3c"),

    // Conexões para páginas de vendas
    createEdge("segment-hot", "webinar", "#e74c3c"),
    createEdge("segment-hot", "sales-page", "#e74c3c"),
    createEdge("segment-warm", "case-studies", "#e74c3c"),
    createEdge("retargeting-ads", "sales-page", "#34495e", true),
    createEdge("retargeting-email", "case-studies", "#3498db", true),
    createEdge("webinar", "sales-page", "#3498db"),
    createEdge("case-studies", "sales-page", "#3498db"),

    // Conexões para checkout e upsell
    createEdge("sales-page", "checkout", "#3498db"),
    createEdge("checkout", "upsell-page", "#3498db"),
    createEdge("upsell-page", "downsell-page", "#3498db", false, "dashed"),

    // Conexões para pós-venda
    createEdge("upsell-page", "customer", "#3498db"),
    createEdge("downsell-page", "customer", "#3498db"),
    createEdge("customer", "onboarding", "#2ecc71"),
    createEdge("customer", "satisfaction", "#2ecc71"),

    // Conexões para fidelização
    createEdge("onboarding", "membership", "#3498db"),
    createEdge("satisfaction", "referral", "#3498db"),
  ],
}

// Template de Lançamento de Infoproduto
export const infoProductLaunchTemplate: TemplateData = {
  id: "info-product-launch",
  name: "Lançamento de Infoproduto",
  description: "Estratégia completa de lançamento de infoproduto com conteúdo gratuito, lista VIP e oferta especial",
  nodes: [
    // Fase de Pré-lançamento
    createIconNode("content-creation", "Criação de Conteúdo", "blog", "#3498db", { x: 100, y: 300 }),
    createPageNode("lead-magnet-page", "Lead Magnet", "Página de captura com material gratuito", "landing", {
      x: 350,
      y: 300,
    }),
    createIconNode("initial-list", "Lista Inicial", "lead", "#f39c12", { x: 600, y: 300 }),
    createIconNode("pre-launch-emails", "Emails Pré-lançamento", "email", "#3498db", { x: 850, y: 300 }),

    // Conteúdo gratuito
    createPageNode("free-content-1", "Conteúdo Gratuito 1", "Primeiro conteúdo da série", "blog", { x: 1100, y: 150 }),
    createPageNode("free-content-2", "Conteúdo Gratuito 2", "Segundo conteúdo da série", "blog", { x: 1100, y: 300 }),
    createPageNode("free-content-3", "Conteúdo Gratuito 3", "Terceiro conteúdo da série", "blog", { x: 1100, y: 450 }),

    // Engajamento e segmentação
    createIconNode("engagement-tracking", "Rastreamento de Engajamento", "segment", "#e74c3c", { x: 1350, y: 300 }),
    createIconNode("high-engagement", "Alto Engajamento", "segment", "#e74c3c", { x: 1600, y: 200 }),
    createIconNode("medium-engagement", "Médio Engajamento", "segment", "#e74c3c", { x: 1600, y: 300 }),
    createIconNode("low-engagement", "Baixo Engajamento", "segment", "#e74c3c", { x: 1600, y: 400 }),

    // Lista VIP
    createPageNode("vip-list-page", "Página Lista VIP", "Inscrição para lista VIP", "landing", { x: 1850, y: 200 }),
    createIconNode("vip-list", "Lista VIP", "lead", "#f39c12", { x: 2100, y: 200 }),

    // Lançamento
    createIconNode("launch-emails", "Emails de Lançamento", "email", "#3498db", { x: 1850, y: 400 }),
    createPageNode("sales-page", "Página de Vendas", "Página principal de vendas", "sales", { x: 2100, y: 400 }),

    // Checkout e ofertas
    createPageNode("checkout", "Checkout", "Página de finalização de compra", "checkout", { x: 2350, y: 400 }),
    createPageNode("fast-action-bonus", "Bônus Ação Rápida", "Oferta com tempo limitado", "sales", { x: 2600, y: 300 }),
    createPageNode("standard-offer", "Oferta Padrão", "Oferta regular", "sales", { x: 2600, y: 500 }),

    // Pós-venda
    createIconNode("customer", "Cliente", "front-end", "#2ecc71", { x: 2850, y: 400 }),
    createIconNode("onboarding", "Onboarding", "email", "#3498db", { x: 3100, y: 300 }),
    createIconNode("success-path", "Caminho de Sucesso", "email", "#3498db", { x: 3100, y: 500 }),

    // Comunidade
    createPageNode("community", "Comunidade", "Área de membros e comunidade", "members", { x: 3350, y: 400 }),
  ],
  edges: [
    // Fase de Pré-lançamento
    createEdge("content-creation", "lead-magnet-page", "#3498db", false, "dashed"),
    createEdge("lead-magnet-page", "initial-list", "#3498db"),
    createEdge("initial-list", "pre-launch-emails", "#f39c12"),

    // Conteúdo gratuito
    createEdge("pre-launch-emails", "free-content-1", "#3498db", true),
    createEdge("pre-launch-emails", "free-content-2", "#3498db", true),
    createEdge("pre-launch-emails", "free-content-3", "#3498db", true),

    // Engajamento e segmentação
    createEdge("free-content-1", "engagement-tracking", "#3498db"),
    createEdge("free-content-2", "engagement-tracking", "#3498db"),
    createEdge("free-content-3", "engagement-tracking", "#3498db"),

    createEdge("engagement-tracking", "high-engagement", "#e74c3c"),
    createEdge("engagement-tracking", "medium-engagement", "#e74c3c"),
    createEdge("engagement-tracking", "low-engagement", "#e74c3c"),

    // Lista VIP
    createEdge("high-engagement", "vip-list-page", "#e74c3c"),
    createEdge("medium-engagement", "vip-list-page", "#e74c3c", false, "dashed"),
    createEdge("vip-list-page", "vip-list", "#3498db"),

    // Lançamento
    createEdge("vip-list", "launch-emails", "#f39c12"),
    createEdge("medium-engagement", "launch-emails", "#e74c3c", false, "dashed"),
    createEdge("launch-emails", "sales-page", "#3498db", true),

    // Checkout e ofertas
    createEdge("sales-page", "checkout", "#3498db"),
    createEdge("checkout", "fast-action-bonus", "#3498db", false, "dashed"),
    createEdge("checkout", "standard-offer", "#3498db"),

    // Pós-venda
    createEdge("fast-action-bonus", "customer", "#3498db"),
    createEdge("standard-offer", "customer", "#3498db"),
    createEdge("customer", "onboarding", "#2ecc71"),
    createEdge("customer", "success-path", "#2ecc71"),

    // Comunidade
    createEdge("onboarding", "community", "#3498db"),
    createEdge("success-path", "community", "#3498db"),
  ],
}

// Template de Marketing de Conteúdo
export const contentMarketingTemplate: TemplateData = {
  id: "content-marketing",
  name: "Marketing de Conteúdo",
  description: "Estratégia completa de marketing de conteúdo com blog, SEO, redes sociais e conversão",
  nodes: [
    // Pesquisa e planejamento
    createIconNode("keyword-research", "Pesquisa de Keywords", "search", "#FF5252", { x: 100, y: 200 }),
    createIconNode("competitor-analysis", "Análise de Concorrentes", "search", "#FF5252", { x: 100, y: 350 }),
    createIconNode("content-planning", "Planejamento de Conteúdo", "blog", "#3498db", { x: 100, y: 500 }),

    // Criação de conteúdo
    createPageNode("pillar-content", "Conteúdo Pilar", "Artigo completo e aprofundado", "blog", { x: 350, y: 200 }),
    createPageNode("blog-posts", "Posts de Blog", "Artigos de blog regulares", "blog", { x: 350, y: 350 }),
    createPageNode("guest-posts", "Guest Posts", "Artigos em sites parceiros", "blog", { x: 350, y: 500 }),

    // Distribuição
    createIconNode("seo-optimization", "Otimização SEO", "search", "#FF5252", { x: 600, y: 150 }),
    createIconNode("social-media", "Redes Sociais", "instagram", "#E1306C", { x: 600, y: 300 }),
    createIconNode("email-newsletter", "Newsletter", "email", "#3498db", { x: 600, y: 450 }),
    createIconNode("content-syndication", "Distribuição de Conteúdo", "affiliates", "#2ecc71", { x: 600, y: 600 }),

    // Tráfego
    createIconNode("organic-traffic", "Tráfego Orgânico", "search", "#FF5252", { x: 850, y: 200 }),
    createIconNode("social-traffic", "Tráfego Social", "instagram", "#E1306C", { x: 850, y: 350 }),
    createIconNode("referral-traffic", "Tráfego de Referência", "affiliates", "#2ecc71", { x: 850, y: 500 }),

    // Conversão
    createPageNode("content-upgrade", "Content Upgrade", "Oferta relacionada ao conteúdo", "landing", {
      x: 1100,
      y: 200,
    }),
    createPageNode("resource-library", "Biblioteca de Recursos", "Coleção de materiais gratuitos", "landing", {
      x: 1100,
      y: 350,
    }),
    createPageNode("webinar-registration", "Registro de Webinar", "Inscrição para webinar gratuito", "webinar", {
      x: 1100,
      y: 500,
    }),

    // Captura de leads
    createIconNode("lead-content", "Leads de Conteúdo", "lead", "#f39c12", { x: 1350, y: 275 }),
    createIconNode("lead-webinar", "Leads de Webinar", "lead", "#f39c12", { x: 1350, y: 425 }),

    // Nutrição de leads
    createIconNode("content-sequence", "Sequência de Conteúdo", "email", "#3498db", { x: 1600, y: 275 }),
    createIconNode("webinar-sequence", "Sequência de Webinar", "email", "#3498db", { x: 1600, y: 425 }),

    // Segmentação
    createIconNode("segment-interest", "Segmentação por Interesse", "segment", "#e74c3c", { x: 1850, y: 275 }),
    createIconNode("segment-engagement", "Segmentação por Engajamento", "segment", "#e74c3c", { x: 1850, y: 425 }),

    // Conversão final
    createPageNode("product-page", "Página de Produto", "Página de vendas do produto", "sales", { x: 2100, y: 350 }),
    createPageNode("checkout", "Checkout", "Página de finalização de compra", "checkout", { x: 2350, y: 350 }),

    // Cliente
    createIconNode("customer", "Cliente", "front-end", "#2ecc71", { x: 2600, y: 350 }),

    // Retenção e fidelização
    createIconNode("customer-content", "Conteúdo Exclusivo", "blog", "#3498db", { x: 2850, y: 250 }),
    createIconNode("customer-community", "Comunidade", "users", "#2ecc71", { x: 2850, y: 450 }),

    // Análise e otimização
    createIconNode("content-analytics", "Análise de Conteúdo", "marketingAnalysisNode", "#f39c12", {
      x: 3100,
      y: 350,
    }),
  ],
  edges: [
    // Pesquisa e planejamento para criação
    createEdge("keyword-research", "pillar-content", "#FF5252", false, "dashed"),
    createEdge("keyword-research", "blog-posts", "#FF5252", false, "dashed"),
    createEdge("competitor-analysis", "content-planning", "#FF5252"),
    createEdge("content-planning", "pillar-content", "#3498db"),
    createEdge("content-planning", "blog-posts", "#3498db"),
    createEdge("content-planning", "guest-posts", "#3498db"),

    // Criação para distribuição
    createEdge("pillar-content", "seo-optimization", "#3498db"),
    createEdge("blog-posts", "seo-optimization", "#3498db"),
    createEdge("blog-posts", "social-media", "#3498db"),
    createEdge("blog-posts", "email-newsletter", "#3498db"),
    createEdge("guest-posts", "content-syndication", "#3498db"),

    // Distribuição para tráfego
    createEdge("seo-optimization", "organic-traffic", "#FF5252"),
    createEdge("social-media", "social-traffic", "#E1306C"),
    createEdge("content-syndication", "referral-traffic", "#2ecc71"),
    createEdge("email-newsletter", "referral-traffic", "#3498db", false, "dashed"),

    // Tráfego para conversão
    createEdge("organic-traffic", "content-upgrade", "#FF5252"),
    createEdge("organic-traffic", "resource-library", "#FF5252"),
    createEdge("social-traffic", "content-upgrade", "#E1306C"),
    createEdge("social-traffic", "webinar-registration", "#E1306C"),
    createEdge("referral-traffic", "resource-library", "#2ecc71"),

    // Conversão para captura de leads
    createEdge("content-upgrade", "lead-content", "#3498db"),
    createEdge("resource-library", "lead-content", "#3498db"),
    createEdge("webinar-registration", "lead-webinar", "#3498db"),

    // Captura para nutrição
    createEdge("lead-content", "content-sequence", "#f39c12"),
    createEdge("lead-webinar", "webinar-sequence", "#f39c12"),

    // Nutrição para segmentação
    createEdge("content-sequence", "segment-interest", "#3498db"),
    createEdge("webinar-sequence", "segment-engagement", "#3498db"),

    // Segmentação para conversão final
    createEdge("segment-interest", "product-page", "#e74c3c"),
    createEdge("segment-engagement", "product-page", "#e74c3c"),

    // Conversão final para cliente
    createEdge("product-page", "checkout", "#3498db"),
    createEdge("checkout", "customer", "#3498db"),

    // Cliente para retenção
    createEdge("customer", "customer-content", "#2ecc71"),
    createEdge("customer", "customer-community", "#2ecc71"),

    // Análise e otimização
    createEdge("customer-content", "content-analytics", "#3498db", false, "dashed"),
    createEdge("customer-community", "content-analytics", "#2ecc71", false, "dashed"),
    createEdge("content-analytics", "content-planning", "#f39c12", true, "dashed"),
  ],
}

// Template de Funil de Afiliados
export const affiliateMarketingTemplate: TemplateData = {
  id: "affiliate-marketing",
  name: "Funil de Marketing de Afiliados",
  description: "Estratégia completa para promover produtos como afiliado e maximizar comissões",
  nodes: [
    // Pesquisa e seleção
    createIconNode("market-research", "Pesquisa de Mercado", "search", "#FF5252", { x: 100, y: 200 }),
    createIconNode("product-selection", "Seleção de Produtos", "search", "#FF5252", { x: 100, y: 400 }),
    createIconNode("affiliate-signup", "Cadastro de Afiliado", "affiliates", "#2ecc71", { x: 100, y: 600 }),

    // Criação de conteúdo
    createPageNode("review-content", "Reviews de Produtos", "Análises detalhadas", "blog", { x: 350, y: 150 }),
    createPageNode("comparison-content", "Comparativos", "Comparação entre produtos", "comparison", {
      x: 350,
      y: 350,
    }),
    createPageNode("tutorial-content", "Tutoriais", "Como usar os produtos", "blog", { x: 350, y: 550 }),

    // Distribuição
    createIconNode("seo-optimization", "Otimização SEO", "search", "#FF5252", { x: 600, y: 150 }),
    createIconNode("social-promotion", "Promoção Social", "instagram", "#E1306C", { x: 600, y: 350 }),
    createIconNode("email-promotion", "Promoção por Email", "email", "#3498db", { x: 600, y: 550 }),

    // Tráfego
    createIconNode("organic-traffic", "Tráfego Orgânico", "search", "#FF5252", { x: 850, y: 200 }),
    createIconNode("social-traffic", "Tráfego Social", "instagram", "#E1306C", { x: 850, y: 400 }),
    createIconNode("email-traffic", "Tráfego de Email", "email", "#3498db", { x: 850, y: 600 }),

    // Páginas de pré-venda
    createPageNode("bridge-page", "Página Ponte", "Pré-venda personalizada", "landing", { x: 1100, y: 200 }),
    createPageNode("bonus-page", "Página de Bônus", "Oferta de bônus exclusivos", "landing", { x: 1100, y: 400 }),
    createPageNode("resource-page", "Página de Recursos", "Recursos complementares", "landing", { x: 1100, y: 600 }),

    // Redirecionamento para vendas
    createIconNode("affiliate-link-1", "Link de Afiliado 1", "affiliates", "#2ecc71", { x: 1350, y: 200 }),
    createIconNode("affiliate-link-2", "Link de Afiliado 2", "affiliates", "#2ecc71", { x: 1350, y: 400 }),
    createIconNode("affiliate-link-3", "Link de Afiliado 3", "affiliates", "#2ecc71", { x: 1350, y: 600 }),

    // Páginas de vendas (do produto)
    createPageNode("vendor-sales-page-1", "Página de Vendas 1", "Página do vendedor", "sales", { x: 1600, y: 200 }),
    createPageNode("vendor-sales-page-2", "Página de Vendas 2", "Página do vendedor", "sales", { x: 1600, y: 400 }),
    createPageNode("vendor-sales-page-3", "Página de Vendas 3", "Página do vendedor", "sales", { x: 1600, y: 600 }),

    // Checkout (do produto)
    createPageNode("vendor-checkout-1", "Checkout 1", "Checkout do vendedor", "checkout", { x: 1850, y: 200 }),
    createPageNode("vendor-checkout-2", "Checkout 2", "Checkout do vendedor", "checkout", { x: 1850, y: 400 }),
    createPageNode("vendor-checkout-3", "Checkout 3", "Checkout do vendedor", "checkout", { x: 1850, y: 600 }),

    // Comissões
    createIconNode("commission-1", "Comissão 1", "front-end", "#2ecc71", { x: 2100, y: 200 }),
    createIconNode("commission-2", "Comissão 2", "front-end", "#2ecc71", { x: 2100, y: 400 }),
    createIconNode("commission-3", "Comissão 3", "front-end", "#2ecc71", { x: 2100, y: 600 }),

    // Acompanhamento
    createIconNode("follow-up-email", "Email de Acompanhamento", "email", "#3498db", { x: 2350, y: 400 }),

    // Retenção e recorrência
    createIconNode("recurring-commission", "Comissão Recorrente", "back-end", "#27ae60", { x: 2600, y: 400 }),

    // Análise
    createIconNode("performance-tracking", "Análise de Performance", "marketingAnalysisNode", "#f39c12", {
      x: 2850,
      y: 400,
    }),
  ],
  edges: [
    // Pesquisa e seleção para criação
    createEdge("market-research", "product-selection", "#FF5252"),
    createEdge("product-selection", "affiliate-signup", "#FF5252"),
    createEdge("product-selection", "review-content", "#FF5252", false, "dashed"),
    createEdge("product-selection", "comparison-content", "#FF5252", false, "dashed"),
    createEdge("product-selection", "tutorial-content", "#FF5252", false, "dashed"),

    // Criação para distribuição
    createEdge("review-content", "seo-optimization", "#3498db"),
    createEdge("comparison-content", "seo-optimization", "#3498db"),
    createEdge("tutorial-content", "seo-optimization", "#3498db"),
    createEdge("review-content", "social-promotion", "#3498db", false, "dashed"),
    createEdge("comparison-content", "social-promotion", "#3498db", false, "dashed"),
    createEdge("tutorial-content", "email-promotion", "#3498db"),

    // Distribuição para tráfego
    createEdge("seo-optimization", "organic-traffic", "#FF5252"),
    createEdge("social-promotion", "social-traffic", "#E1306C"),
    createEdge("email-promotion", "email-traffic", "#3498db"),

    // Tráfego para pré-venda
    createEdge("organic-traffic", "bridge-page", "#FF5252"),
    createEdge("organic-traffic", "bonus-page", "#FF5252", false, "dashed"),
    createEdge("social-traffic", "bridge-page", "#E1306C", false, "dashed"),
    createEdge("social-traffic", "bonus-page", "#E1306C"),
    createEdge("email-traffic", "bonus-page", "#3498db", false, "dashed"),
    createEdge("email-traffic", "resource-page", "#3498db"),

    // Pré-venda para links de afiliado
    createEdge("bridge-page", "affiliate-link-1", "#3498db"),
    createEdge("bonus-page", "affiliate-link-2", "#3498db"),
    createEdge("resource-page", "affiliate-link-3", "#3498db"),

    // Links para páginas de vendas
    createEdge("affiliate-link-1", "vendor-sales-page-1", "#2ecc71"),
    createEdge("affiliate-link-2", "vendor-sales-page-2", "#2ecc71"),
    createEdge("affiliate-link-3", "vendor-sales-page-3", "#2ecc71"),

    // Páginas de vendas para checkout
    createEdge("vendor-sales-page-1", "vendor-checkout-1", "#3498db"),
    createEdge("vendor-sales-page-2", "vendor-checkout-2", "#3498db"),
    createEdge("vendor-sales-page-3", "vendor-checkout-3", "#3498db"),

    // Checkout para comissões
    createEdge("vendor-checkout-1", "commission-1", "#3498db"),
    createEdge("vendor-checkout-2", "commission-2", "#3498db"),
    createEdge("vendor-checkout-3", "commission-3", "#3498db"),

    // Comissões para acompanhamento
    createEdge("commission-1", "follow-up-email", "#2ecc71", false, "dashed"),
    createEdge("commission-2", "follow-up-email", "#2ecc71"),
    createEdge("commission-3", "follow-up-email", "#2ecc71", false, "dashed"),

    // Acompanhamento para recorrência
    createEdge("follow-up-email", "recurring-commission", "#3498db"),

    // Análise e otimização
    createEdge("commission-1", "performance-tracking", "#2ecc71", false, "dashed"),
    createEdge("commission-2", "performance-tracking", "#2ecc71", false, "dashed"),
    createEdge("commission-3", "performance-tracking", "#2ecc71", false, "dashed"),
    createEdge("recurring-commission", "performance-tracking", "#27ae60"),
    createEdge("performance-tracking", "product-selection", "#f39c12", true, "dashed"),
  ],
}

// Template de Funil de Vendas B2B
export const b2bSalesFunnelTemplate: TemplateData = {
  id: "b2b-sales-funnel",
  name: "Funil de Vendas B2B",
  description: "Estratégia completa para geração de leads e vendas no mercado B2B",
  nodes: [
    // Canais de aquisição
    createIconNode("linkedin-ads", "LinkedIn Ads", "linkedin", "#0077B5", { x: 100, y: 150 }),
    createIconNode("google-ads", "Google Ads", "search", "#FF5252", { x: 100, y: 300 }),
    createIconNode("content-marketing", "Marketing de Conteúdo", "blog", "#3498db", { x: 100, y: 450 }),
    createIconNode("events", "Eventos", "calendar", "#3498db", { x: 100, y: 600 }),

    // Conteúdo para atração
    createPageNode("whitepaper", "Whitepaper", "Documento técnico", "blog", { x: 350, y: 150 }),
    createPageNode("case-studies", "Estudos de Caso", "Casos de sucesso", "blog", { x: 350, y: 300 }),
    createPageNode("industry-report", "Relatório do Setor", "Análise de mercado", "blog", { x: 350, y: 450 }),
    createPageNode("webinar-page", "Webinar", "Apresentação online", "webinar", { x: 350, y: 600 }),

    // Captura de leads
    createIconNode("lead-whitepaper", "Leads Whitepaper", "lead", "#f39c12", { x: 600, y: 150 }),
    createIconNode("lead-case-studies", "Leads Estudos de Caso", "lead", "#f39c12", { x: 600, y: 300 }),
    createIconNode("lead-report", "Leads Relatório", "lead", "#f39c12", { x: 600, y: 450 }),
    createIconNode("lead-webinar", "Leads Webinar", "lead", "#f39c12", { x: 600, y: 600 }),

    // Qualificação de leads
    createIconNode("lead-scoring", "Pontuação de Leads", "segment", "#e74c3c", { x: 850, y: 375 }),
    createIconNode("mql", "MQL", "segment", "#e74c3c", { x: 1100, y: 250 }),
    createIconNode("sql", "SQL", "segment", "#e74c3c", { x: 1100, y: 500 }),

    // Nutrição de leads
    createIconNode("nurture-email-1", "Email de Nutrição 1", "email", "#3498db", { x: 850, y: 150 }),
    createIconNode("nurture-email-2", "Email de Nutrição 2", "email", "#3498db", { x: 850, y: 600 }),

    // Demonstração e proposta
    createPageNode("demo-page", "Página de Demonstração", "Agendamento de demo", "landing", { x: 1350, y: 250 }),
    createIconNode("sales-call", "Ligação de Vendas", "conversation", "#3498db", { x: 1600, y: 250 }),
    createIconNode("proposal", "Proposta", "report", "#7f8c8d", { x: 1850, y: 250 }),

    // Negociação
    createIconNode("negotiation", "Negociação", "conversation", "#3498db", { x: 1350, y: 500 }),
    createIconNode("contract", "Contrato", "report", "#7f8c8d", { x: 1600, y: 500 }),

    // Fechamento
    createPageNode("checkout", "Checkout", "Finalização da compra", "checkout", { x: 1850, y: 500 }),
    createIconNode("customer", "Cliente", "front-end", "#2ecc71", { x: 2100, y: 375 }),

    // Onboarding e sucesso do cliente
    createIconNode("onboarding", "Onboarding", "email", "#3498db", { x: 2350, y: 250 }),
    createIconNode("customer-success", "Sucesso do Cliente", "conversation", "#3498db", { x: 2350, y: 500 }),

    // Expansão e renovação
    createIconNode("upsell", "Upsell", "upsell", "#e74c3c", { x: 2600, y: 250 }),
    createIconNode("renewal", "Renovação", "back-end", "#27ae60", { x: 2600, y: 500 }),

    // Referências e casos de sucesso
    createIconNode("testimonial", "Depoimento", "report", "#7f8c8d", { x: 2850, y: 375 }),
  ],
  edges: [
    // Canais para conteúdo
    createEdge("linkedin-ads", "whitepaper", "#0077B5", false, "dashed"),
    createEdge("linkedin-ads", "case-studies", "#0077B5", false, "dashed"),
    createEdge("google-ads", "whitepaper", "#FF5252", false, "dashed"),
    createEdge("google-ads", "industry-report", "#FF5252", false, "dashed"),
    createEdge("content-marketing", "case-studies", "#3498db", false, "dashed"),
    createEdge("content-marketing", "industry-report", "#3498db", false, "dashed"),
    createEdge("events", "webinar-page", "#3498db", false, "dashed"),

    // Conteúdo para captura
    createEdge("whitepaper", "lead-whitepaper", "#3498db"),
    createEdge("case-studies", "lead-case-studies", "#3498db"),
    createEdge("industry-report", "lead-report", "#3498db"),
    createEdge("webinar-page", "lead-webinar", "#3498db"),

    // Captura para qualificação
    createEdge("lead-whitepaper", "lead-scoring", "#f39c12"),
    createEdge("lead-case-studies", "lead-scoring", "#f39c12"),
    createEdge("lead-report", "lead-scoring", "#f39c12"),
    createEdge("lead-webinar", "lead-scoring", "#f39c12"),

    // Qualificação para MQL/SQL
    createEdge("lead-scoring", "mql", "#e74c3c"),
    createEdge("lead-scoring", "sql", "#e74c3c"),

    // Nutrição de leads
    createEdge("mql", "nurture-email-1", "#e74c3c"),
    createEdge("nurture-email-1", "lead-scoring", "#3498db", true),
    createEdge("sql", "nurture-email-2", "#e74c3c", false, "dashed"),
    createEdge("nurture-email-2", "lead-scoring", "#3498db", true, "dashed"),

    // MQL para demonstração
    createEdge("mql", "demo-page", "#e74c3c"),
    createEdge("demo-page", "sales-call", "#3498db"),
    createEdge("sales-call", "proposal", "#3498db"),

    // SQL para negociação
    createEdge("sql", "negotiation", "#e74c3c"),
    createEdge("negotiation", "contract", "#3498db"),

    // Proposta e contrato para fechamento
    createEdge("proposal", "checkout", "#7f8c8d"),
    createEdge("contract", "checkout", "#7f8c8d"),

    // Fechamento para cliente
    createEdge("checkout", "customer", "#3498db"),

    // Cliente para onboarding e sucesso
    createEdge("customer", "onboarding", "#2ecc71"),
    createEdge("customer", "customer-success", "#2ecc71"),

    // Onboarding e sucesso para expansão e renovação
    createEdge("onboarding", "upsell", "#3498db"),
    createEdge("customer-success", "renewal", "#3498db"),

    // Expansão e renovação para depoimento
    createEdge("upsell", "testimonial", "#e74c3c"),
    createEdge("renewal", "testimonial", "#27ae60"),

    // Depoimento voltando para estudos de caso (ciclo de prova social)
    createEdge("testimonial", "case-studies", "#7f8c8d", true, "dashed"),
  ],
}

// ===== LISTA DE TEMPLATES =====

export const allTemplates: TemplateData[] = [
  exactReferenceTemplate,
  basicSalesFunnelTemplate,
  webinarFunnelTemplate,
  blogLeadTemplate,
  productLaunchTemplate,
  advancedSalesFunnelTemplate,
  infoProductLaunchTemplate,
  contentMarketingTemplate,
  affiliateMarketingTemplate,
  b2bSalesFunnelTemplate,
]

// Buscar template por ID
export const getTemplateById = (id: string): TemplateData | undefined => {
  return allTemplates.find((template) => template.id === id)
}
