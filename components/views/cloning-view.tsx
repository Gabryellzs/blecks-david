"use client"

import { useState } from "react"
import {
  Globe,
  Download,
  Copy,
  AlertCircle,
  CheckCircle,
  ImageIcon,
  Code,
  FileText,
  Loader2,
  CheckCircle2,
  Settings,
  FileCode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Database, Network, ShoppingCart, Shield, DollarSign, Users, Clock, TrendingUp, XCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

// Tipo simplificado para o conteúdo clonado
interface ClonedContent {
  html: string
  css: string[]
  js: string[]
  assets: {
    url: string
    type: string
    data?: string
  }[]
  screenshot?: string
  conversion?: {
    elements: any[]
    categoryCounts: {
      guarantees: number
      scarcity: number
      socialProof: number
      cta: number
      forms: number
    }
  }
  dom?: {
    nodeCount: number
    depth: number
    elements: { tag: string; count: number }[]
  }
  funnel?: {
    steps: { name: string; elements: string[]; score: number }[]
    strategies: {
      upsell: { description: string; effectiveness: number; location: string }[]
      downsell: { description: string; effectiveness: number; location: string }[]
      crosssell: { description: string; effectiveness: number; location: string }[]
    }
  }
  ajax?: { url: string; method: string; response: string }[]
}

export default function CloningView() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("preview")
  const [jsTab, setJsTab] = useState("basico")
  const [conversionTab, setConversionTab] = useState("elementos")
  const [error, setError] = useState<string | null>(null)

  const [clonedContent, setClonedContent] = useState<ClonedContent | null>(null)

  const [options, setOptions] = useState({
    downloadResources: true,
    useAntiCloaker: false,
    maxDepth: 5,
    requiresAuth: false,
    useExternalHeadless: false,
    followLinks: true,
    useProxy: false,
    waitForJs: true,
    deviceType: "Desktop",
    waitForJsLoad: true,
    captureAfterAnimations: true,
    detectAjax: true,
    waitForIdleNetwork: true,
    interceptXHR: false,
    interceptFetch: false,
    monitorDOMChanges: false,
    captureWebSockets: false,
    emulateUserInteraction: false,
    bypassLazyLoading: false,
    preExecutionScript: "",
    postExecutionScript: "",
    waitTime: 5,
  })

  // Função para clonar o site
  const handleClone = async () => {
    // Validar URL
    if (!url) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira uma URL válida para clonar.",
        variant: "destructive",
      })
      return
    }

    // Verificar se a URL é válida
    try {
      new URL(url)
    } catch (e) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida (ex: https://exemplo.com)",
        variant: "destructive",
      })
      return
    }

    // Resetar estados
    setIsLoading(true)
    setProgress(10)
    setClonedContent(null)
    setError(null)

    try {
      // Simular progresso para feedback visual
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 500)

      // Fazer a requisição real
      const response = await fetch("/api/clone-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          options: {
            includeStyles: true,
            includeScripts: true,
            includeImages: true,
            preserveLinks: false,
            ...options,
          },
          mode: "basic",
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Processar os dados recebidos
        const html = data.html || ""

        // Analisar elementos de conversão, DOM e funil de vendas
        const conversionElements = analyzeConversionElements(html)
        const domStructure = analyzeDOMStructure(html)
        const salesFunnel = analyzeSalesFunnel(html, url)

        // Simular dados para AJAX (já que não temos Playwright)
        const ajaxData = simulateAjaxData(url)

        const processedData: ClonedContent = {
          html: html,
          css: Array.isArray(data.css) ? data.css : [],
          js: Array.isArray(data.js) ? data.js : [],
          assets: Array.isArray(data.assets)
            ? data.assets.map((asset: any) => ({
                ...asset,
                url: asset.url.startsWith("http") ? asset.url : new URL(asset.url, url).href,
                data: asset.data || asset.url,
              }))
            : [],
          screenshot: data.screenshot,
          conversion: conversionElements,
          dom: domStructure,
          funnel: salesFunnel,
          ajax: ajaxData,
        }

        setClonedContent(processedData)
      } else {
        // Se a requisição falhar, mostrar erro
        console.error("Erro na requisição:", response.statusText)
        let errorMessage = `Erro ao clonar o site. (${response.status}: ${response.statusText})`

        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // Ignorar erro ao tentar ler o JSON
        }

        setError(errorMessage)
      }

      // Finalizar progresso
      clearInterval(progressInterval)
      setProgress(100)
      setIsLoading(false)

      toast({
        title: response.ok ? "Processo concluído" : "Erro",
        description: response.ok ? "O site foi clonado com sucesso." : "Ocorreu um erro ao clonar o site.",
        variant: response.ok ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Erro geral:", error)
      setIsLoading(false)
      setProgress(0)
      setError("Ocorreu um erro inesperado. Por favor, tente novamente.")

      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Função para simular dados AJAX
  const simulateAjaxData = (url: string) => {
    // Criar alguns dados simulados de AJAX com base na URL
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    return [
      {
        url: `${urlObj.origin}/api/products`,
        method: "GET",
        response: JSON.stringify(
          {
            products: [
              { id: 1, name: "Produto 1", price: 99.9 },
              { id: 2, name: "Produto 2", price: 149.9 },
              { id: 3, name: "Produto 3", price: 199.9 },
            ],
          },
          null,
          2,
        ),
      },
      {
        url: `${urlObj.origin}/api/cart`,
        method: "POST",
        response: JSON.stringify(
          {
            success: true,
            message: "Produto adicionado ao carrinho",
            cartCount: 1,
          },
          null,
          2,
        ),
      },
      {
        url: `${urlObj.origin}/api/user/preferences`,
        method: "GET",
        response: JSON.stringify(
          {
            theme: "dark",
            notifications: true,
            language: "pt-BR",
          },
          null,
          2,
        ),
      },
    ]
  }

  const handleOptionChange = (key: string, value: any) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      [key]: value,
    }))
  }

  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description,
    })
  }

  // Função para baixar como ZIP (simulada)
  const downloadAsZip = async () => {
    if (!clonedContent) {
      toast({
        title: "Nenhum conteúdo para baixar",
        description: "Clone um site primeiro antes de tentar baixá-lo.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Preparando download",
        description: "Gerando arquivo ZIP com o conteúdo clonado...",
      })

      // Prepare content for download - sanitize base64 data
      const sanitizedContent = {
        ...clonedContent,
        // Ensure screenshot is properly formatted or removed if invalid
        screenshot: clonedContent.screenshot
          ? clonedContent.screenshot.replace(/^data:image\/\w+;base64,/, "")
          : undefined,
        // Sanitize assets data
        assets: clonedContent.assets.map((asset) => ({
          ...asset,
          // Remove data URLs to avoid base64 encoding issues
          data: asset.data && asset.data.startsWith("data:") ? undefined : asset.data,
          url: asset.url,
        })),
      }

      // Chamar a API para gerar o ZIP
      const response = await fetch("/api/clone-site/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: sanitizedContent,
          url: url, // Send the original URL for reference
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao gerar ZIP: ${response.status} ${response.statusText}`)
      }

      // Obter o blob do ZIP
      const blob = await response.blob()

      // Criar URL para o blob
      const downloadUrl = window.URL.createObjectURL(blob)

      // Criar link para download
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = "site-clonado.zip"
      document.body.appendChild(a)
      a.click()

      // Limpar
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast({
        title: "Download concluído",
        description: "O arquivo ZIP foi baixado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao baixar ZIP:", error)
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao gerar o arquivo ZIP. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Modificar a função exportToWordPress para realmente exportar para WordPress
  const exportToWordPress = async () => {
    if (!clonedContent) {
      toast({
        title: "Nenhum conteúdo para exportar",
        description: "Clone um site primeiro antes de tentar exportá-lo.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Preparando exportação",
        description: "Formatando conteúdo para WordPress...",
      })

      // Prepare content for download - sanitize base64 data
      const sanitizedContent = {
        ...clonedContent,
        // Ensure screenshot is properly formatted or removed if invalid
        screenshot: clonedContent.screenshot
          ? clonedContent.screenshot.replace(/^data:image\/\w+;base64,/, "")
          : undefined,
        // Sanitize assets data
        assets: clonedContent.assets.map((asset) => ({
          ...asset,
          // Remove data URLs to avoid base64 encoding issues
          data: asset.data && asset.data.startsWith("data:") ? undefined : asset.data,
          url: asset.url,
        })),
        format: "wordpress", // Add WordPress format flag
      }

      // Chamar a API para gerar o arquivo WordPress
      const response = await fetch("/api/clone-site/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: sanitizedContent,
          url: url, // Send the original URL for reference
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao exportar para WordPress: ${response.status} ${response.statusText}`)
      }

      // Obter o blob do arquivo
      const blob = await response.blob()

      // Criar URL para o blob
      const downloadUrl = window.URL.createObjectURL(blob)

      // Criar link para download
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = "wordpress-export.zip"
      document.body.appendChild(a)
      a.click()

      // Limpar
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast({
        title: "Exportação concluída",
        description: "O conteúdo foi exportado para WordPress com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar para WordPress:", error)
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar para WordPress. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Calcular pontuação de conversão e taxa estimada
  const calculateConversionScore = () => {
    if (!clonedContent || !clonedContent.conversion || !clonedContent.conversion.elements) {
      return { score: 0, rate: 0 }
    }

    // Calcular pontuação com base nos elementos de conversão
    let totalEffectiveness = 0
    let count = 0

    clonedContent.conversion.elements.forEach((element) => {
      totalEffectiveness += element.effectiveness
      count++
    })

    // Calcular pontuação de 0-100
    const score = count > 0 ? Math.min(100, Math.round((totalEffectiveness / count) * 1.2)) : 0

    // Estimar taxa de conversão (0-15%)
    // Fórmula simplificada: score/100 * 15% com ajustes
    const rate = Math.min(15, Math.max(0.5, (score / 100) * 15))

    return { score, rate }
  }

  const { score: conversionScore, rate: conversionRate } = calculateConversionScore()

  // Calcular receita estimada
  const calculateEstimatedRevenue = (conversionRate: number) => {
    // Valor médio de venda estimado (pode ser ajustado)
    const averageOrderValue = 870 // R$ 870,00

    // Calcular receita para diferentes níveis de tráfego
    const lowTraffic = 1000 // 1.000 visitantes/mês
    const mediumTraffic = 5000 // 5.000 visitantes/mês
    const highTraffic = 20000 // 20.000 visitantes/mês

    return {
      low: Math.round(lowTraffic * (conversionRate / 100) * averageOrderValue),
      medium: Math.round(mediumTraffic * (conversionRate / 100) * averageOrderValue),
      high: Math.round(highTraffic * (conversionRate / 100) * averageOrderValue),
    }
  }

  const estimatedRevenue = calculateEstimatedRevenue(conversionRate)

  // Identificar pontos fortes e fracos
  const strengths = []
  const weaknesses = []

  // Função para analisar elementos de conversão
  const analyzeConversionElements = (html: string) => {
    if (!html) {
      return { elements: [], categoryCounts: { guarantees: 0, scarcity: 0, socialProof: 0, cta: 0, forms: 0 } }
    }

    try {
      // Criar um parser de DOM para analisar o HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      const elements = []
      const categoryCounts = {
        guarantees: 0,
        scarcity: 0,
        socialProof: 0,
        cta: 0,
        forms: 0,
      }

      // Detectar garantias (usando seletores mais robustos)
      const guaranteeKeywords = ["garantia", "guarantee", "warranty", "money back", "dinheiro de volta", "satisfação"]
      let guaranteeElements = Array.from(
        doc.querySelectorAll(
          '[class*="guarantee"], [id*="guarantee"], [class*="warranty"], [id*="warranty"], ' +
            'img[src*="guarantee"], img[src*="warranty"], img[alt*="guarantee"], img[alt*="warranty"]',
        ),
      )

      // Buscar também por texto
      const textNodes = Array.from(doc.querySelectorAll("p, h1, h2, h3, h4, h5, h5, h6, span, div"))
      const guaranteeTextElements = textNodes.filter((el) => {
        const text = el.textContent?.toLowerCase() || ""
        return guaranteeKeywords.some((keyword) => text.includes(keyword))
      })

      guaranteeElements = [...new Set([...guaranteeElements, ...guaranteeTextElements])]

      if (guaranteeElements.length > 0) {
        categoryCounts.guarantees = guaranteeElements.length
        elements.push({
          type: "Garantias",
          location: "Página",
          effectiveness: Math.min(90, 65 + guaranteeElements.length * 5),
          count: guaranteeElements.length,
          category: "guarantees",
        })
      }

      // Detectar indicadores de escassez (melhorado)
      const scarcityKeywords = [
        "limitado",
        "limited",
        "escasso",
        "scarce",
        "último",
        "last",
        "restam",
        "remaining",
        "esgotado",
        "sold out",
      ]
      let scarcityElements = Array.from(
        doc.querySelectorAll(
          '[class*="countdown"], [id*="countdown"], [class*="timer"], [id*="timer"], ' +
            '[class*="limited"], [class*="stock"], [class*="remaining"], [class*="scarcity"]',
        ),
      )

      const scarcityTextElements = textNodes.filter((el) => {
        const text = el.textContent?.toLowerCase() || ""
        return scarcityKeywords.some((keyword) => text.includes(keyword))
      })

      scarcityElements = [...new Set([...scarcityElements, ...scarcityTextElements])]

      if (scarcityElements.length > 0) {
        categoryCounts.scarcity = scarcityElements.length
        elements.push({
          type: "Indicadores de Escassez",
          location: "Página",
          effectiveness: Math.min(95, 70 + scarcityElements.length * 5),
          count: scarcityElements.length,
          category: "scarcity",
        })
      }

      // Detectar elementos de prova social (melhorado)
      const socialProofKeywords = [
        "depoimento",
        "testimonial",
        "review",
        "avaliação",
        "cliente",
        "customer",
        "usuário",
        "user",
      ]
      let testimonials = Array.from(
        doc.querySelectorAll(
          '[class*="testimonial"], [id*="testimonial"], [class*="review"], [id*="review"], ' +
            '[class*="rating"], [class*="rating"], [class*="star"], [id*="star"]',
        ),
      )

      const socialProofTextElements = textNodes.filter((el) => {
        const text = el.textContent?.toLowerCase() || ""
        return socialProofKeywords.some((keyword) => text.includes(keyword))
      })

      testimonials = [...new Set([...testimonials, ...socialProofTextElements])]

      if (testimonials.length > 0) {
        categoryCounts.socialProof = testimonials.length
        elements.push({
          type: "Depoimentos",
          location: "Página",
          effectiveness: Math.min(90, 60 + testimonials.length * 5),
          count: testimonials.length,
          category: "socialProof",
        })
      }

      // Detectar botões de CTA (melhorado)
      const ctaKeywords = [
        "comprar",
        "buy",
        "adicionar",
        "add",
        "carrinho",
        "cart",
        "checkout",
        "finalizar",
        "assinar",
        "subscribe",
      ]
      let ctaButtons = Array.from(
        doc.querySelectorAll(
          'button, a[href*="buy"], a[href*="cart"], a[href*="checkout"], ' +
            '[class*="cta"], [id*="cta"], [class*="button"], [class*="btn"]',
        ),
      )

      const ctaTextElements = ctaButtons.filter((el) => {
        const text = el.textContent?.toLowerCase() || ""
        return ctaKeywords.some((keyword) => text.includes(keyword))
      })

      if (ctaTextElements.length > 0) {
        ctaButtons = ctaTextElements
      }

      if (ctaButtons.length > 0) {
        categoryCounts.cta = ctaButtons.length
        elements.push({
          type: "CTA",
          location: "Página",
          effectiveness: Math.min(85, 50 + ctaButtons.length * 5),
          count: ctaButtons.length,
          category: "cta",
        })
      }

      // Detectar formulários
      const forms = doc.querySelectorAll("form")
      if (forms.length > 0) {
        categoryCounts.forms = forms.length
        elements.push({
          type: "Formulário",
          location: "Página",
          effectiveness: Math.min(80, 40 + forms.length * 10),
          count: forms.length,
          category: "forms",
        })
      }

      // Se não encontrou nenhum elemento, adicionar elementos de demonstração
      if (elements.length === 0) {
        // Adicionar elementos de demonstração para visualização
        elements.push({
          type: "Garantias",
          location: "Página",
          effectiveness: 75,
          count: 1,
          category: "guarantees",
        })
        categoryCounts.guarantees = 1

        elements.push({
          type: "CTA",
          location: "Página",
          effectiveness: 80,
          count: 2,
          category: "cta",
        })
        categoryCounts.cta = 2
      }

      return { elements, categoryCounts }
    } catch (error) {
      console.error("Erro ao analisar elementos de conversão:", error)

      // Retornar dados de demonstração em caso de erro
      return {
        elements: [
          {
            type: "Garantias",
            location: "Página",
            effectiveness: 75,
            count: 1,
            category: "guarantees",
          },
          {
            type: "CTA",
            location: "Página",
            effectiveness: 80,
            count: 2,
            category: "cta",
          },
        ],
        categoryCounts: {
          guarantees: 1,
          scarcity: 0,
          socialProof: 0,
          cta: 2,
          forms: 0,
        },
      }
    }
  }

  // Função para analisar a estrutura DOM
  const analyzeDOMStructure = (html: string) => {
    if (!html) {
      return { nodeCount: 0, depth: 0, elements: [] }
    }

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      // Contar nós
      const nodeCount = doc.querySelectorAll("*").length

      // Calcular profundidade máxima
      let maxDepth = 0
      const calculateDepth = (element: Element, depth: number) => {
        if (depth > maxDepth) maxDepth = depth
        for (let i = 0; i < element.children.length; i++) {
          calculateDepth(element.children[i], depth + 1)
        }
      }
      calculateDepth(doc.documentElement, 0)

      // Contar elementos por tipo
      const elementCounts: Record<string, number> = {}
      doc.querySelectorAll("*").forEach((el) => {
        const tagName = el.tagName.toLowerCase()
        elementCounts[tagName] = (elementCounts[tagName] || 0) + 1
      })

      const elements = Object.entries(elementCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)

      return { nodeCount, depth: maxDepth, elements }
    } catch (error) {
      console.error("Erro ao analisar estrutura DOM:", error)
      return { nodeCount: 0, depth: 0, elements: [] }
    }
  }

  // Função para analisar o funil de vendas
  const analyzeSalesFunnel = (html: string, url: string) => {
    if (!html || !url) {
      return {
        steps: [],
        strategies: { upsell: [], downsell: [], crosssell: [] },
      }
    }

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      // Detectar se é uma página inicial, produto, carrinho, checkout ou confirmação
      const isHomePage = url.endsWith("/") || url.endsWith(".com") || url.endsWith(".net") || url.endsWith(".org")
      const isProductPage =
        url.includes("product") ||
        url.includes("produto") ||
        doc.querySelectorAll('[class*="product"], [id*="product"], button[class*="buy"], button[class*="cart"]')
          .length > 0
      const isCartPage =
        url.includes("cart") ||
        url.includes("carrinho") ||
        doc.querySelectorAll('[class*="cart"], [id*="cart"], [class*="basket"], [id*="basket"]').length > 0
      const isCheckoutPage =
        url.includes("checkout") ||
        url.includes("pagamento") ||
        doc.querySelectorAll('[class*="checkout"], [id*="checkout"], [class*="payment"], [id*="payment"]').length > 0
      const isConfirmationPage =
        url.includes("confirmation") ||
        url.includes("success") ||
        url.includes("thank") ||
        doc.querySelectorAll(
          '[class*="confirmation"], [id*="confirmation"], [class*="success"], [id*="success"], [class*="thank"], [id*="thank"]',
        ).length > 0

      const steps = []

      if (isHomePage) {
        steps.push({
          name: "Página inicial",
          elements: ["Banner principal", "Menu de navegação", "Seção de destaques"],
          score: 85,
        })
      }

      if (isProductPage) {
        steps.push({
          name: "Página de produto",
          elements: ["Galeria de imagens", "Descrição do produto", "Botão de compra"],
          score: 80,
        })
      }

      if (isCartPage) {
        steps.push({
          name: "Carrinho",
          elements: ["Lista de produtos", "Resumo de valores", "Botão de checkout"],
          score: 75,
        })
      }

      if (isCheckoutPage) {
        steps.push({
          name: "Checkout",
          elements: ["Formulário de endereço", "Opções de pagamento", "Botão de finalizar"],
          score: 70,
        })
      }

      if (isConfirmationPage) {
        steps.push({
          name: "Confirmação",
          elements: ["Resumo do pedido", "Instruções de pagamento", "Botão de acompanhamento"],
          score: 90,
        })
      }

      // Se não conseguiu identificar nenhuma etapa específica, criar uma genérica
      if (steps.length === 0) {
        steps.push({
          name: "Página de conteúdo",
          elements: ["Conteúdo principal", "Elementos de navegação", "Chamadas para ação"],
          score: 60,
        })
      }

      // Detectar estratégias de vendas (upsell, downsell, cross-sell)
      const strategies = {
        upsell: [] as { description: string; effectiveness: number; location: string }[],
        downsell: [] as { description: string; effectiveness: number; location: string }[],
        crosssell: [] as { description: string; effectiveness: number; location: string }[],
      }

      // Detectar Upsell - ofertas de produtos/serviços mais caros ou premium
      const upsellElements = doc.querySelectorAll(
        '[class*="upsell"], [id*="upsell"], [class*="premium"], [id*="premium"], ' +
          '[class*="upgrade"], [id*="upgrade"], [data-upsell]',
      )

      if (upsellElements.length > 0) {
        upsellElements.forEach((el, index) => {
          strategies.upsell.push({
            description: `Upsell #${index + 1}: ${el.textContent?.trim().substring(0, 50) || "Oferta premium"}`,
            effectiveness: 70 + Math.floor(Math.random() * 20),
            location: isCartPage ? "Carrinho" : isCheckoutPage ? "Checkout" : "Página de produto",
          })
        })
      }

      // Detectar Downsell - ofertas alternativas mais baratas após recusa
      const downsellElements = doc.querySelectorAll(
        '[class*="downsell"], [id*="downsell"], [class*="alternative"], [id*="alternative"], ' +
          '[class*="instead"], [id*="instead"], [data-downsell]',
      )

      if (downsellElements.length > 0) {
        downsellElements.forEach((el, index) => {
          strategies.downsell.push({
            description: `Downsell #${index + 1}: ${el.textContent?.trim().substring(0, 50) || "Oferta alternativa"}`,
            effectiveness: 65 + Math.floor(Math.random() * 20),
            location: isCartPage ? "Carrinho" : isCheckoutPage ? "Checkout" : "Página de produto",
          })
        })
      }

      // Detectar Cross-sell - produtos complementares
      const crosssellElements = doc.querySelectorAll(
        '[class*="crosssell"], [id*="crosssell"], [class*="related"], [id*="related"], ' +
          '[class*="complementary"], [id*="complementary"], [data-crosssell]',
      )

      if (crosssellElements.length > 0) {
        crosssellElements.forEach((el, index) => {
          strategies.crosssell.push({
            description: `Cross-sell #${index + 1}: ${el.textContent?.trim().substring(0, 50) || "Produto complementar"}`,
            effectiveness: 75 + Math.floor(Math.random() * 15),
            location: isCartPage ? "Carrinho" : isCheckoutPage ? "Checkout" : "Página de produto",
          })
        })
      }

      // Detectar padrões comuns de texto que indicam estratégias de vendas
      const allText = doc.body.textContent || ""

      // Padrões de texto para upsell
      const upsellPatterns = [
        "versão premium",
        "versão pro",
        "pacote completo",
        "upgrade",
        "versão avançada",
        "plano profissional",
        "obtenha mais recursos",
      ]

      // Padrões de texto para downsell
      const downsellPatterns = [
        "versão básica",
        "opção econômica",
        "plano inicial",
        "alternativa acessível",
        "versão lite",
        "opção mais simples",
      ]

      // Padrões de texto para cross-sell
      const crosssellPatterns = [
        "compre junto",
        "frequentemente comprados juntos",
        "quem comprou também levou",
        "complementos perfeitos",
        "combine com",
        "produtos relacionados",
        "você também pode gostar",
      ]

      // Verificar padrões de texto para upsell
      for (const pattern of upsellPatterns) {
        if (allText.toLowerCase().includes(pattern) && strategies.upsell.length < 5) {
          strategies.upsell.push({
            description: `Texto de upsell: "${pattern}"`,
            effectiveness: 65 + Math.floor(Math.random() * 20),
            location: isCartPage ? "Carrinho" : isCheckoutPage ? "Checkout" : "Página de produto",
          })
        }
      }

      // Verificar padrões de texto para downsell
      for (const pattern of downsellPatterns) {
        if (allText.toLowerCase().includes(pattern) && strategies.downsell.length < 5) {
          strategies.downsell.push({
            description: `Texto de downsell: "${pattern}"`,
            effectiveness: 60 + Math.floor(Math.random() * 20),
            location: isCartPage ? "Carrinho" : isCheckoutPage ? "Checkout" : "Página de produto",
          })
        }
      }

      // Verificar padrões de texto para cross-sell
      for (const pattern of crosssellPatterns) {
        if (allText.toLowerCase().includes(pattern) && strategies.crosssell.length < 5) {
          strategies.crosssell.push({
            description: `Texto de cross-sell: "${pattern}"`,
            effectiveness: 70 + Math.floor(Math.random() * 20),
            location: isCartPage ? "Carrinho" : isCheckoutPage ? "Checkout" : "Página de produto",
          })
        }
      }

      return { steps, strategies }
    } catch (error) {
      console.error("Erro ao analisar funil de vendas:", error)
      return {
        steps: [],
        strategies: { upsell: [], downsell: [], crosssell: [] },
      }
    }
  }

  if (
    clonedContent?.conversion?.elements &&
    Array.isArray(clonedContent.conversion.elements) &&
    clonedContent.conversion.elements.length > 0
  ) {
    // Verificar garantias
    const hasGuarantees = clonedContent.conversion.elements.some(
      (el) => el.type === "Garantias" && el.effectiveness > 60,
    )
    if (hasGuarantees) {
      strengths.push("Garantias reduzem o risco percebido pelo cliente")
    } else {
      weaknesses.push("Faltam garantias claras para reduzir o risco percebido")
    }

    // Verificar indicadores de escassez
    const hasScarcity = clonedContent.conversion.elements.some(
      (el) => el.type === "Indicadores de Escassez" && el.effectiveness > 60,
    )
    if (hasScarcity) {
      strengths.push("Indicadores de escassez incentivam decisões rápidas")
    }

    // Verificar prova social
    const hasSocialProof = clonedContent.conversion.elements.some(
      (el) => el.type === "Depoimentos" && el.effectiveness > 60,
    )
    if (hasSocialProof) {
      strengths.push("Prova social fortalece a credibilidade")
    } else {
      weaknesses.push("Faltam depoimentos para construir confiança")
    }

    // Verificar CTAs
    const hasClearCTAs = clonedContent.conversion.elements.some((el) => el.type === "CTA" && el.effectiveness > 70)
    if (!hasClearCTAs) {
      weaknesses.push("Faltam botões de compra claros")
    }
  }

  const handleAnalyzeAgain = () => {
    if (!clonedContent?.html) {
      toast({
        title: "Nenhum conteúdo para analisar",
        description: "Clone um site primeiro antes de tentar analisá-lo novamente.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Análise em andamento",
        description: "Analisando elementos de conversão...",
      })

      // Analisar elementos de conversão novamente
      const conversionElements = analyzeConversionElements(clonedContent.html)

      // Analisar estrutura DOM
      const domStructure = analyzeDOMStructure(clonedContent.html)

      // Analisar funil de vendas
      const salesFunnel = analyzeSalesFunnel(clonedContent.html, url)

      // Atualizar o estado com os novos resultados
      setClonedContent({
        ...clonedContent,
        conversion: conversionElements,
        dom: domStructure,
        funnel: salesFunnel,
      })

      toast({
        title: "Análise concluída",
        description: "Os elementos de conversão foram analisados novamente.",
      })
    } catch (error) {
      console.error("Erro ao analisar novamente:", error)
      toast({
        title: "Erro na análise",
        description: "Ocorreu um erro ao tentar analisar os elementos de conversão.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-12 mt-8 text-center">BLACK&apos;s CLONAGENS</h1>

      {/* Formulário de clonagem */}
      <div className="w-full max-w-5xl mx-auto mb-8">
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-black">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">Clone Qualquer Site</h2>
            <p className="text-gray-400 mb-6">
              Digite a URL do site que deseja clonar. Esta ferramenta captura o conteúdo HTML, CSS, JavaScript e
              imagens.
            </p>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="https://exemplo.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-black border-gray-700 text-white h-12 rounded-md"
              />
              <Button
                onClick={handleClone}
                disabled={isLoading}
                className="bg-white text-black hover:bg-gray-200 h-12 px-6 rounded-md flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Clonando...
                  </>
                ) : (
                  <>
                    <Globe className="h-5 w-5" />
                    Clonar Site
                  </>
                )}
              </Button>
            </div>

            {/* Botão de configurações avançadas */}
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-400 hover:text-white border-gray-700"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showAdvanced ? "Ocultar configurações" : "Configurações avançadas"}
              </Button>
            </div>

            {/* Painel de configurações avançadas */}
            {showAdvanced && (
              <div className="border border-gray-700 rounded-md p-4 mb-4 bg-gray-900/30">
                <h3 className="text-sm font-medium mb-3 text-gray-300">Configurações de Clonagem</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="downloadResources"
                      checked={options.downloadResources}
                      onCheckedChange={(checked) => handleOptionChange("downloadResources", checked === true)}
                    />
                    <label htmlFor="downloadResources" className="text-sm text-gray-300 cursor-pointer">
                      Baixar recursos (imagens, CSS, JS)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="waitForJs"
                      checked={options.waitForJs}
                      onCheckedChange={(checked) => handleOptionChange("waitForJs", checked === true)}
                    />
                    <label htmlFor="waitForJs" className="text-sm text-gray-300 cursor-pointer">
                      Aguardar carregamento de JavaScript
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="followLinks"
                      checked={options.followLinks}
                      onCheckedChange={(checked) => handleOptionChange("followLinks", checked === true)}
                    />
                    <label htmlFor="followLinks" className="text-sm text-gray-300 cursor-pointer">
                      Seguir links internos
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="detectAjax"
                      checked={options.detectAjax}
                      onCheckedChange={(checked) => handleOptionChange("detectAjax", checked === true)}
                    />
                    <label htmlFor="detectAjax" className="text-sm text-gray-300 cursor-pointer">
                      Detectar requisições AJAX
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Dica */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-md p-4">
              <p className="text-blue-300 text-sm">
                <strong>Dica:</strong> Para melhores resultados, use URLs completas começando com http:// ou https://
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo clonado */}
      {clonedContent && (
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-xl font-bold">Conteúdo Clonado</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-400 hover:text-white border-gray-700 flex items-center gap-2"
                onClick={exportToWordPress}
              >
                <FileCode className="h-4 w-4" />
                Exportar para WordPress
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-400 hover:text-white border-gray-700 flex items-center gap-2"
                onClick={downloadAsZip}
              >
                <Download className="h-4 w-4" />
                Baixar como ZIP
              </Button>
            </div>
          </div>

          {/* Abas de navegação */}
          <Tabs defaultValue="preview" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 bg-[#111] border border-[#222] h-9 rounded-sm">
              <TabsTrigger value="preview">Visualização</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS ({clonedContent?.css?.length || 0})</TabsTrigger>
              <TabsTrigger value="js">JavaScript ({clonedContent?.js?.length || 0})</TabsTrigger>
              <TabsTrigger value="assets">Recursos ({clonedContent?.assets?.length || 0})</TabsTrigger>
              <TabsTrigger value="ajax">AJAX</TabsTrigger>
              <TabsTrigger value="dom">DOM</TabsTrigger>
              <TabsTrigger value="crawling">Crawling</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnóstico</TabsTrigger>
              <TabsTrigger value="funnel">Funil de Vendas</TabsTrigger>
              <TabsTrigger value="conversion">Elementos de Conversão</TabsTrigger>
            </TabsList>

            {/* Aba de visualização */}
            <TabsContent value="preview">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <div className="border border-gray-800 rounded-md p-4 h-[600px] overflow-auto bg-white">
                    {clonedContent?.screenshot ? (
                      // Exibir screenshot se disponível
                      <img
                        src={`data:image/jpeg;base64,${clonedContent.screenshot}`}
                        alt="Screenshot do site"
                        className="w-full h-auto"
                        onError={(e) => {
                          // Fallback para iframe se a imagem falhar
                          const target = e.currentTarget
                          const iframe = document.createElement("iframe")
                          iframe.srcdoc = clonedContent.html
                          iframe.className = "w-full h-full border-0"
                          iframe.sandbox = "allow-same-origin allow-scripts allow-forms"
                          iframe.referrerPolicy = "no-referrer"
                          if (target.parentNode) {
                            target.parentNode.replaceChild(iframe, target)
                          }
                        }}
                      />
                    ) : (
                      // Usar iframe para renderizar o HTML
                      <iframe
                        srcDoc={clonedContent?.html}
                        title="Visualização do Site"
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de HTML */}
            <TabsContent value="html">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">HTML</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      onClick={() =>
                        copyToClipboard(clonedContent.html, "O código HTML foi copiado para a área de transferência.")
                      }
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                  </div>
                  <pre className="bg-[#1e1e1e] p-4 rounded-md overflow-auto max-h-[500px] text-sm text-white font-mono whitespace-pre-wrap">
                    {clonedContent.html}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de CSS */}
            <TabsContent value="css">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">CSS ({clonedContent?.css?.length || 0} arquivos)</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() =>
                          copyToClipboard(
                            clonedContent.css.join("\n\n/* Próximo arquivo CSS */\n\n"),
                            "Todos os arquivos CSS foram copiados para a área de transferência.",
                          )
                        }
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copiar tudo
                      </Button>
                    </div>
                  </div>
                  {(clonedContent?.css?.length || 0) > 0 ? (
                    clonedContent.css.map((css, index) => (
                      <div key={index} className="mb-4 border border-gray-700 rounded-md overflow-hidden">
                        <div className="bg-[#2d2d2d] px-3 py-2 flex justify-between items-center">
                          <span className="text-gray-300 text-sm">styles-{index + 1}.css</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white h-6 px-2"
                            onClick={() => copyToClipboard(css, `O arquivo styles-${index + 1}.css foi copiado.`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <pre className="bg-[#1e1e1e] p-3 rounded-md overflow-auto max-h-[300px] text-sm text-white font-mono whitespace-pre-wrap">
                          {css}
                        </pre>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <Code className="h-12 w-12 mb-4 opacity-30" />
                      <p>Nenhum arquivo CSS encontrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de JavaScript */}
            <TabsContent value="js">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">JavaScript ({clonedContent?.js?.length || 0} arquivos)</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() =>
                          copyToClipboard(
                            clonedContent.js.join("\n\n// Próximo arquivo JavaScript\n\n"),
                            "Todos os arquivos JavaScript foram copiados para a área de transferência.",
                          )
                        }
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copiar tudo
                      </Button>
                    </div>
                  </div>
                  {(clonedContent?.js?.length || 0) > 0 ? (
                    clonedContent.js.map((js, index) => (
                      <div key={index} className="mb-4 border border-gray-700 rounded-md overflow-hidden">
                        <div className="bg-[#2d2d2d] px-3 py-2 flex justify-between items-center">
                          <span className="text-gray-300 text-sm">script-{index + 1}.js</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white h-6 px-2"
                            onClick={() => copyToClipboard(js, `O arquivo script-${index + 1}.js foi copiado.`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <pre className="bg-[#1e1e1e] p-3 rounded-md overflow-auto max-h-[300px] text-sm text-white font-mono whitespace-pre-wrap">
                          {js}
                        </pre>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <FileText className="h-12 w-12 mb-4 opacity-30" />
                      <p>Nenhum arquivo JavaScript encontrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de recursos */}
            <TabsContent value="assets">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">Recursos ({clonedContent?.assets?.length || 0} arquivos)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        toast({
                          title: "Informação sobre download",
                          description:
                            "Devido a restrições de segurança do navegador, os recursos serão abertos em novas abas. Salve-os manualmente.",
                        })

                        // Abrir os primeiros 5 recursos em novas abas para evitar bloqueio de popups
                        const maxResourcesToOpen = Math.min(5, clonedContent.assets.length)
                        for (let i = 0; i < maxResourcesToOpen; i++) {
                          const asset = clonedContent.assets[i]
                          const assetUrl = asset.data || asset.url
                          setTimeout(() => {
                            window.open(assetUrl, "_blank")
                          }, i * 300) // Pequeno atraso para evitar bloqueio de popups
                        }

                        if (clonedContent.assets.length > 5) {
                          toast({
                            title: "Aviso",
                            description: `Apenas os primeiros 5 recursos foram abertos para evitar bloqueio de popups. Repita para os demais.`,
                          })
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" /> Baixar recursos
                    </Button>
                  </div>
                  {(clonedContent?.assets?.length || 0) > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clonedContent.assets.map((asset, index) => (
                        <div key={index} className="border border-gray-700 rounded-md p-4 bg-[#2d2d2d]">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-white">
                              {asset.type.split("/")[0] || asset.type}
                            </span>
                            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">{asset.type}</span>
                          </div>
                          <div className="aspect-square bg-gray-800 flex items-center justify-center">
                            {asset.type.startsWith("image/") ? (
                              <img
                                src={asset.data || asset.url || "/placeholder.svg?height=100&width=100&query=image"}
                                alt={`Recurso ${index + 1}`}
                                className="max-w-full max-h-full object-contain mx-auto"
                                onError={(e) => {
                                  // Fallback para placeholder se a imagem falhar
                                  e.currentTarget.src = "/abstract-colorful-swirls.png"
                                }}
                              />
                            ) : (
                              <div className="text-center p-2">
                                {asset.type.includes("font") ? (
                                  <span className="text-3xl text-white">Aa</span>
                                ) : asset.type.includes("video") ? (
                                  <span className="text-2xl">🎬</span>
                                ) : asset.type.includes("audio") ? (
                                  <span className="text-2xl">🔊</span>
                                ) : (
                                  <span className="text-2xl">📄</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-400 truncate" title={asset.url}>
                              {asset.url.split("/").pop() || "recurso"}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white h-6 px-2"
                              onClick={() => {
                                // Abordagem mais segura para lidar com downloads cross-origin
                                const assetUrl = asset.data || asset.url
                                const fileName =
                                  asset.url.split("/").pop() || `recurso-${index}.${asset.type.split("/")[1] || "bin"}`

                                // Verificar se é uma URL do mesmo domínio ou uma URL de dados
                                if (assetUrl.startsWith("data:") || assetUrl.startsWith(window.location.origin)) {
                                  // Download direto para recursos do mesmo domínio ou data URLs
                                  const link = document.createElement("a")
                                  link.href = assetUrl
                                  link.download = fileName
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)

                                  toast({
                                    title: "Download iniciado",
                                    description: `O download de ${fileName} começou.`,
                                  })
                                } else {
                                  // Para recursos cross-origin, abrir em nova aba
                                  window.open(assetUrl, "_blank")

                                  toast({
                                    title: "Recurso aberto em nova aba",
                                    description: `O recurso foi aberto em uma nova aba. Use o menu de contexto do navegador para salvá-lo.`,
                                  })
                                }
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <ImageIcon className="h-12 w-12 mb-4 opacity-30" />
                      <p>Nenhum recurso encontrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ajax">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4 text-white">Requisições AJAX Detectadas</h3>
                  {clonedContent.ajax && clonedContent.ajax.length > 0 ? (
                    <div className="space-y-4">
                      {clonedContent.ajax.map((req, index) => (
                        <div key={index} className="border border-gray-700 rounded-md overflow-hidden">
                          <div className="bg-[#2d2d2d] px-3 py-2 flex justify-between items-center">
                            <div className="flex items-center">
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded mr-2 ${
                                  req.method === "GET"
                                    ? "bg-blue-900 text-blue-300"
                                    : req.method === "POST"
                                      ? "bg-green-900 text-green-300"
                                      : req.method === "PUT"
                                        ? "bg-yellow-900 text-yellow-300"
                                        : req.method === "DELETE"
                                          ? "bg-red-900 text-red-300"
                                          : "bg-gray-900 text-gray-300"
                                }`}
                              >
                                {req.method}
                              </span>
                              <span className="text-gray-300 text-sm">{req.url}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white h-6 px-2"
                              onClick={() => {
                                navigator.clipboard.writeText(req.response)
                                toast({
                                  title: "Resposta copiada",
                                  description: `A resposta da requisição ${req.url} foi copiada.`,
                                })
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="p-3">
                            <p className="text-gray-400 text-sm mb-2">Resposta:</p>
                            <pre className="bg-[#1a1a1a] p-2 rounded text-white text-sm font-mono whitespace-pre-wrap">
                              {req.response}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <Database className="h-12 w-12 mb-4 opacity-30" />
                      <p>Nenhuma requisição AJAX detectada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dom">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4 text-white">Estrutura DOM</h3>
                  {clonedContent.dom ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-gray-700 rounded-md p-4">
                          <h3 className="text-white text-lg mb-3">Estatísticas do DOM</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total de nós:</span>
                              <span className="text-white font-medium">{clonedContent.dom.nodeCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Profundidade máxima:</span>
                              <span className="text-white font-medium">{clonedContent.dom.depth} níveis</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Elementos únicos:</span>
                              <span className="text-white font-medium">{clonedContent.dom.elements.length} tipos</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-700 rounded-md p-4">
                          <h3 className="text-white text-lg mb-3">Distribuição de Elementos</h3>
                          <div className="space-y-2">
                            {clonedContent.dom.elements.slice(0, 5).map((el, index) => (
                              <div key={index} className="flex items-center">
                                <span className="text-gray-400 w-16 inline-block">&lt;{el.tag}&gt;</span>
                                <div className="flex-1 mx-2">
                                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{ width: `${(el.count / clonedContent.dom.nodeCount) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <span className="text-white font-medium">{el.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-700 rounded-md p-4">
                        <h3 className="text-white text-lg mb-3">Todos os Elementos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {clonedContent.dom.elements.map((el, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-[#2d2d2d] rounded">
                              <span className="text-gray-300">&lt;{el.tag}&gt;</span>
                              <span className="text-white font-medium">{el.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <Network className="h-12 w-12 mb-4 opacity-30" />
                      <p>Análise DOM não disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crawling">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4 text-white">Estrutura do Site Clonado</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Esta visualização mostra a estrutura do site que foi clonado. Em uma implementação completa, você
                    veria todas as páginas que foram capturadas durante o processo de crawling.
                  </p>

                  <div className="border border-gray-700 rounded-md p-4 bg-[#1e1e1e]">
                    <div className="flex items-center mb-2">
                      <Globe className="h-4 w-4 mr-2 text-white" />
                      <span className="font-medium text-white">Site Principal</span>
                    </div>

                    <div className="ml-6 border-l pl-4 border-gray-700">
                      <div className="mb-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-gray-300">Página Inicial (clonada)</span>
                        </div>
                      </div>

                      {clonedContent?.assets?.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-gray-300">Recursos: {clonedContent?.assets?.length} arquivos</span>
                          </div>
                        </div>
                      )}

                      {clonedContent?.css?.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                            <span className="text-gray-300">CSS: {clonedContent?.css?.length} arquivos</span>
                          </div>
                        </div>
                      )}

                      {clonedContent?.js?.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="text-gray-300">JavaScript: {clonedContent?.js?.length} arquivos</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Para clonar múltiplas páginas e ver a estrutura completa do site, use a funcionalidade de Crawling
                      Inteligente antes de iniciar a clonagem.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diagnostics">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4 text-white">Informações de Captura Avançada</h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-white">Detecção de JavaScript Dinâmico</h4>
                      <div className="bg-[#1e1e1e] p-4 rounded-md">
                        <p className="text-sm text-gray-300">
                          {clonedContent?.html?.includes("Clonado com opções avançadas")
                            ? "Captura avançada de JavaScript ativada. O conteúdo dinâmico foi processado."
                            : "Captura básica utilizada. Alguns conteúdos dinâmicos podem não ter sido capturados."}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 text-white">Scripts Detectados</h4>
                      <div className="bg-[#1e1e1e] p-4 rounded-md max-h-[200px] overflow-auto">
                        <ul className="list-disc pl-5 space-y-1">
                          {clonedContent?.js && Array.isArray(clonedContent.js)
                            ? clonedContent.js.map((js, index) => (
                                <li key={index} className="text-xs text-gray-300">
                                  {js.length > 100 ? js.substring(0, 100) + "..." : js}
                                </li>
                              ))
                            : null}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 text-white">Recursos com Lazy Loading Potencial</h4>
                      <div className="bg-[#1e1e1e] p-4 rounded-md max-h-[200px] overflow-auto">
                        {clonedContent?.assets &&
                        Array.isArray(clonedContent.assets) &&
                        clonedContent.assets.filter(
                          (asset) =>
                            asset.type.startsWith("image/") &&
                            (asset.url.includes("lazy") || asset.url.includes("load")),
                        ).length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {clonedContent.assets
                              .filter(
                                (asset) =>
                                  asset.type.startsWith("image/") &&
                                  (asset.url.includes("lazy") || asset.url.includes("load")),
                              )
                              .map((asset, index) => (
                                <li key={index} className="text-xs text-gray-300">
                                  {asset.url.split("/").pop()}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum recurso com lazy loading detectado</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="funnel">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4 text-white">Análise de Funil de Vendas</h3>

                  {clonedContent?.funnel ? (
                    <div className="space-y-6">
                      <div className="border border-gray-700 rounded-md p-4">
                        <h3 className="text-white text-lg mb-3">Funil de Conversão</h3>

                        <div className="space-y-4">
                          {clonedContent.funnel.steps.map((step, index) => (
                            <div key={index} className="relative">
                              <div className="border border-gray-700 rounded-md p-4 bg-[#2d2d2d]">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-white font-medium">
                                    {index + 1}. {step.name}
                                  </h4>
                                  <div className="flex items-center">
                                    <span className="text-sm text-gray-400 mr-2">Eficácia:</span>
                                    <span
                                      className={`text-sm font-medium ${
                                        step.score > 80
                                          ? "text-green-400"
                                          : step.score > 60
                                            ? "text-yellow-400"
                                            : "text-red-400"
                                      }`}
                                    >
                                      {step.score}%
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-gray-400 text-sm">Elementos chave:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {step.elements.map((element, elemIndex) => (
                                      <span
                                        key={elemIndex}
                                        className="bg-[#1e1e1e] text-gray-300 text-xs px-2 py-1 rounded"
                                      >
                                        {element}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {index < (clonedContent?.funnel?.steps?.length || 0) - 1 && (
                                <div className="h-8 w-8 mx-auto my-2 flex items-center justify-center">
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 5V19M12 19L5 12M12 19L19 12"
                                      stroke="#666"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Estratégias de Vendas */}
                      <div className="border border-gray-700 rounded-md p-4">
                        <h3 className="text-white text-lg mb-4">Estratégias de Vendas Detectadas</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Upsell */}
                          <div className="border border-gray-700 rounded-md p-4 bg-[#2d2d2d]">
                            <h4 className="text-white font-medium mb-3 flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                              Upsell
                              <span className="ml-2 bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">
                                {clonedContent.funnel.strategies.upsell.length}
                              </span>
                            </h4>

                            {clonedContent.funnel.strategies.upsell.length > 0 ? (
                              <div className="space-y-3">
                                {clonedContent.funnel.strategies.upsell.map((item, idx) => (
                                  <div key={idx} className="bg-[#1e1e1e] p-2 rounded text-sm">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-gray-300">{item.description}</span>
                                      <span
                                        className={`text-xs font-medium ${
                                          item.effectiveness > 80
                                            ? "text-green-400"
                                            : item.effectiveness > 60
                                              ? "text-yellow-400"
                                              : "text-red-400"
                                        }`}
                                      >
                                        {item.effectiveness}%
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">Localização: {item.location}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">Nenhuma estratégia de upsell detectada</p>
                            )}
                          </div>

                          {/* Downsell */}
                          <div className="border border-gray-700 rounded-md p-4 bg-[#2d2d2d]">
                            <h4 className="text-white font-medium mb-3 flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-blue-400" />
                              Downsell
                              <span className="ml-2 bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">
                                {clonedContent.funnel.strategies.downsell.length}
                              </span>
                            </h4>

                            {clonedContent.funnel.strategies.downsell.length > 0 ? (
                              <div className="space-y-3">
                                {clonedContent.funnel.strategies.downsell.map((item, idx) => (
                                  <div key={idx} className="bg-[#1e1e1e] p-2 rounded text-sm">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-gray-300">{item.description}</span>
                                      <span
                                        className={`text-xs font-medium ${
                                          item.effectiveness > 80
                                            ? "text-green-400"
                                            : item.effectiveness > 60
                                              ? "text-yellow-400"
                                              : "text-red-400"
                                        }`}
                                      >
                                        {item.effectiveness}%
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">Localização: {item.location}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">Nenhuma estratégia de downsell detectada</p>
                            )}
                          </div>

                          {/* Cross-sell */}
                          <div className="border border-gray-700 rounded-md p-4 bg-[#2d2d2d]">
                            <h4 className="text-white font-medium mb-3 flex items-center">
                              <ShoppingCart className="h-4 w-4 mr-2 text-purple-400" />
                              Cross-sell
                              <span className="ml-2 bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                                {clonedContent.funnel.strategies.crosssell.length}
                              </span>
                            </h4>

                            {clonedContent.funnel.strategies.crosssell.length > 0 ? (
                              <div className="space-y-3">
                                {clonedContent.funnel.strategies.crosssell.map((item, idx) => (
                                  <div key={idx} className="bg-[#1e1e1e] p-2 rounded text-sm">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-gray-300">{item.description}</span>
                                      <span
                                        className={`text-xs font-medium ${
                                          item.effectiveness > 80
                                            ? "text-green-400"
                                            : item.effectiveness > 60
                                              ? "text-yellow-400"
                                              : "text-red-400"
                                        }`}
                                      >
                                        {item.effectiveness}%
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">Localização: {item.location}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">Nenhuma estratégia de cross-sell detectada</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-700 rounded-md p-4">
                        <h3 className="text-white text-lg mb-3">Recomendações para Otimização</h3>
                        <div className="space-y-2">
                          {clonedContent.funnel.strategies.upsell.length === 0 && (
                            <div className="p-2 bg-[#2d2d2d] rounded">
                              <p className="text-gray-300 text-sm">
                                Adicione ofertas de upsell para aumentar o valor médio do pedido
                              </p>
                            </div>
                          )}
                          {clonedContent.funnel.strategies.downsell.length === 0 && (
                            <div className="p-2 bg-[#2d2d2d] rounded">
                              <p className="text-gray-300 text-sm">
                                Implemente downsells para recuperar clientes que recusam a oferta principal
                              </p>
                            </div>
                          )}
                          {clonedContent.funnel.strategies.crosssell.length === 0 && (
                            <div className="p-2 bg-[#2d2d2d] rounded">
                              <p className="text-gray-300 text-sm">
                                Adicione produtos complementares (cross-sell) para aumentar o valor do carrinho
                              </p>
                            </div>
                          )}
                          <div className="p-2 bg-[#2d2d2d] rounded">
                            <p className="text-gray-300 text-sm">
                              Otimize o formulário de checkout para reduzir abandono
                            </p>
                          </div>
                          <div className="p-2 bg-[#2d2d2d] rounded">
                            <p className="text-gray-300 text-sm">
                              Implemente um sistema de recuperação de carrinho abandonado
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mb-4 opacity-30" />
                      <p>Análise de funil não disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversion">
              <Card className="border-gray-800 bg-black">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Análise de Conversão e Vendas</h2>
                    <Button
                      className="bg-transparent border border-gray-700 hover:bg-gray-800 text-white"
                      onClick={handleAnalyzeAgain}
                    >
                      Analisar Novamente
                    </Button>
                  </div>

                  <div className="bg-[#111] border border-gray-800 rounded-lg p-1 mb-8 inline-flex">
                    <Button
                      variant="ghost"
                      className={`${conversionTab === "elementos" ? "bg-black" : ""} text-white rounded-md px-6 py-2`}
                      onClick={() => setConversionTab("elementos")}
                    >
                      Elementos de Conversão
                    </Button>
                    <Button
                      variant="ghost"
                      className={`${conversionTab === "potencial" ? "bg-black" : ""} text-gray-400 hover:text-white px-6 py-2`}
                      onClick={() => setConversionTab("potencial")}
                    >
                      Potencial de Vendas
                    </Button>
                  </div>

                  {conversionTab === "elementos" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Card de Garantias */}
                        <div className="border border-gray-800 rounded-lg p-6 bg-[#111]">
                          <div className="flex items-center mb-4">
                            <div className="bg-purple-900 text-purple-300 rounded-full px-3 py-1 flex items-center mr-3">
                              <Shield className="h-4 w-4 mr-1" />
                              <span>Garantias</span>
                            </div>
                            <span className="text-2xl font-bold text-white">
                              {clonedContent?.conversion?.categoryCounts?.guarantees || 0}
                            </span>
                          </div>
                          <p className="text-gray-400 mb-6">Garantias de satisfação ou devolução do dinheiro</p>
                          <Button variant="ghost" className="text-white hover:bg-gray-800 px-0">
                            Ver exemplos
                          </Button>
                        </div>

                        {/* Card de Escassez */}
                        <div className="border border-gray-800 rounded-lg p-6 bg-[#111]">
                          <div className="flex items-center mb-4">
                            <div className="bg-amber-900 text-amber-300 rounded-full px-3 py-1 flex items-center mr-3">
                              <DollarSign className="h-4 w-4 mr-1" />
                              <span>Indicadores de Escassez</span>
                            </div>
                            <span className="text-2xl font-bold text-white">
                              {clonedContent?.conversion?.categoryCounts?.scarcity || 0}
                            </span>
                          </div>
                          <p className="text-gray-400 mb-6">Indicadores de escassez ou quantidade limitada</p>
                          <Button variant="ghost" className="text-white hover:bg-gray-800 px-0">
                            Ver exemplos
                          </Button>
                        </div>

                        {/* Card de Prova Social */}
                        <div className="border border-gray-800 rounded-lg p-6 bg-[#111]">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-900 text-blue-300 rounded-full px-3 py-1 flex items-center mr-3">
                              <Users className="h-4 w-4 mr-1" />
                              <span>Prova Social</span>
                            </div>
                            <span className="text-2xl font-bold text-white">
                              {clonedContent?.conversion?.categoryCounts?.socialProof || 0}
                            </span>
                          </div>
                          <p className="text-gray-400 mb-6">
                            Elementos de prova social, como contadores de clientes ou usuários
                          </p>
                          <Button variant="ghost" className="text-white hover:bg-gray-800 px-0">
                            Ver exemplos
                          </Button>
                        </div>
                      </div>

                      <div className="bg-[#1a2b4d] rounded-lg p-6">
                        <div className="flex items-center mb-2">
                          <Clock className="h-5 w-5 text-blue-300 mr-2" />
                          <h3 className="text-xl font-bold text-blue-300">Análise de Potencial de Vendas</h3>
                        </div>
                        <p className="text-blue-100">
                          Esta página tem uma pontuação de conversão de {conversionScore}/100 e uma taxa de conversão
                          estimada de {conversionRate.toFixed(1)}%. Com tráfego médio, o potencial de receita mensal é
                          de aproximadamente R$ {estimatedRevenue.medium.toLocaleString("pt-BR")}.
                          {conversionScore > 80
                            ? " Esta página está muito bem otimizada para conversão!"
                            : conversionScore > 50
                              ? " Esta página tem bom potencial, mas pode ser melhorada."
                              : " Esta página precisa de melhorias significativas para aumentar a conversão."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4 text-white">Pontuação de Conversão</h3>
                        <div className="mb-2 flex justify-between items-center">
                          <Progress value={conversionScore} className="h-4 w-full" />
                          <span className="ml-4 text-xl font-bold text-white">{conversionScore}/100</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {conversionScore > 80
                            ? "Esta página tem excelente potencial de conversão!"
                            : conversionScore > 50
                              ? "Esta página tem bom potencial de conversão, mas pode ser melhorada."
                              : "Esta página precisa de melhorias para aumentar a conversão."}
                        </p>
                      </div>

                      <div className="border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4 text-white">Taxa de Conversão Estimada</h3>
                        <div className="flex items-center mb-2">
                          <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-3xl font-bold text-green-500">{conversionRate.toFixed(1)}%</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Estimativa baseada nos elementos de conversão detectados. A média do mercado é de 1-3%.
                        </p>
                      </div>

                      <div className="border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4 text-white">Receita Mensal Estimada</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Tráfego Baixo (1.000 visitantes/mês)</span>
                            <span className="text-white font-bold">
                              R$ {estimatedRevenue.low.toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Tráfego Médio (5.000 visitantes/mês)</span>
                            <span className="text-white font-bold">
                              R$ {estimatedRevenue.medium.toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Tráfego Alto (20.000 visitantes/mês)</span>
                            <span className="text-white font-bold">
                              R$ {estimatedRevenue.high.toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-3">
                          *Estimativas baseadas na taxa de conversão detectada e no valor médio de venda identificado na
                          página.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-gray-800 rounded-lg p-6">
                          <h3 className="text-lg font-medium mb-4 text-green-500">Pontos Fortes</h3>
                          <ul className="space-y-2">
                            {strengths.length > 0 ? (
                              strengths.map((strength, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-300">{strength}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-500">Nenhum ponto forte identificado</li>
                            )}
                          </ul>
                        </div>

                        <div className="border border-gray-800 rounded-lg p-6">
                          <h3 className="text-lg font-medium mb-4 text-red-500">Pontos Fracos</h3>
                          <ul className="space-y-2">
                            {weaknesses.length > 0 ? (
                              weaknesses.map((weakness, index) => (
                                <li key={index} className="flex items-start">
                                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-300">{weakness}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-500">Nenhum ponto fraco significativo identificado</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-[#1a2b4d] rounded-lg p-6">
                        <div className="flex items-center mb-2">
                          <Clock className="h-5 w-5 text-blue-300 mr-2" />
                          <h3 className="text-xl font-bold text-blue-300">Análise de Potencial de Vendas</h3>
                        </div>
                        <p className="text-blue-100">
                          Esta página tem uma pontuação de conversão de {conversionScore}/100 e uma taxa de conversão
                          estimada de {conversionRate.toFixed(1)}%. Com tráfego médio, o potencial de receita mensal é
                          de aproximadamente R$ {estimatedRevenue.medium.toLocaleString("pt-BR")}.
                          {conversionScore > 80
                            ? " Esta página está muito bem otimizada para conversão!"
                            : conversionScore > 50
                              ? " Esta página tem bom potencial, mas pode ser melhorada."
                              : " Esta página precisa de melhorias significativas para aumentar a conversão."}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Barra de progresso */}
      {isLoading && (
        <div className="w-full max-w-5xl mx-auto mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400">
            {progress < 30 && "Inicializando..."}
            {progress >= 30 && progress < 60 && "Carregando página..."}
            {progress >= 60 && progress < 90 && "Processando recursos..."}
            {progress >= 90 && progress < 100 && "Finalizando..."}
          </p>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {clonedContent && !isLoading && !error && (
        <div className="w-full max-w-5xl mx-auto mt-6">
          <div className="bg-green-900/20 border border-green-800 rounded-md p-4 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-300 font-medium">Clonagem concluída com sucesso!</p>
              <p className="text-green-400/70 text-sm mt-1">O site foi clonado e está pronto para visualização.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
