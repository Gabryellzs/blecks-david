"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PenLine, Copy, Save, Sparkles, AlertCircle, RefreshCw, Lightbulb, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ChatView from "./chat-view"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import HeadlineLibrary from "../copywriting/headline-library"
import CopyComparator from "../copywriting/copy-comparator"

type CopyItem = {
  id: string
  copyType: string
  tone: string
  productInfo: string
  targetAudience: string
  length: string
  generatedText: string
  createdAt: Date
}

const copyTemplates = {
  anúncio: {
    formal:
      "Apresentamos [Produto/Serviço], a solução definitiva para [problema]. Desenvolvido especialmente para [público-alvo], nosso produto oferece [benefícios principais]. Entre em contato hoje mesmo para mais informações.",
    casual:
      "Ei, você já conhece o [Produto/Serviço]? É exatamente o que você precisa para resolver [problema]! Feito pensando em pessoas como você, [público-alvo]. Confira agora e veja como podemos ajudar!",
    persuasivo:
      "Imagine resolver [problema] de uma vez por todas. Com [Produto/Serviço], isso é possível! Junte-se a milhares de [público-alvo] satisfeitos que transformaram suas vidas. Não perca mais tempo - clique agora e garanta o seu!",
    amigável:
      "Olá! Temos uma novidade incrível para compartilhar com você: [Produto/Serviço]! Criamos isso pensando em ajudar [público-alvo] como você a superar [problema]. Vamos conversar sobre como podemos ajudar você?",
    profissional:
      "Apresentamos [Produto/Serviço]: a solução premium para [problema]. Projetado com os mais altos padrões de qualidade para atender às necessidades específicas de [público-alvo]. Solicite uma demonstração e descubra o diferencial.",
    humorístico:
      "Cansado de [problema]? A gente também! Por isso criamos [Produto/Serviço] - porque a vida é curta demais para problemas chatos! Perfeito para [público-alvo] que querem mais diversão e menos dor de cabeça. Experimente e depois nos agradeça (de preferência com chocolate)!",
  },
  "email marketing": {
    formal:
      "Prezado(a) cliente,\n\nÉ com grande satisfação que apresentamos [Produto/Serviço], desenvolvido especificamente para atender às necessidades de [público-alvo].\n\nNosso produto oferece [benefícios principais], proporcionando uma solução eficaz para [problema].\n\nFicaremos honrados em fornecer mais informações. Entre em contato conosco.\n\nAtenciosamente,\nEquipe [Sua Empresa]",
    casual:
      "Oi!\n\nTemos uma novidade incrível para você: [Produto/Serviço]!\n\nSabemos como [problema] pode ser chato para [público-alvo] como você, por isso criamos algo especial.\n\nDá uma olhada no que preparamos e conta pra gente o que achou, ok?\n\nAté mais!\nEquipe [Sua Empresa]",
    persuasivo:
      "GRANDE NOVIDADE: [Produto/Serviço] acaba de chegar!\n\nVocê, como parte do seleto grupo de [público-alvo], merece conhecer em primeira mão a solução definitiva para [problema].\n\nMilhares já estão aproveitando benefícios como [benefícios principais]. Vai ficar de fora?\n\nOFERTA ESPECIAL: Responda este email nas próximas 24 horas e ganhe um desconto exclusivo!\n\nNão perca tempo,\nEquipe [Sua Empresa]",
    amigável:
      "Olá, amigo(a)!\n\nComo vai? Esperamos que esteja tudo bem por aí!\n\nQueriamos compartilhar algo legal com você: acabamos de lançar [Produto/Serviço], pensando especialmente em [público-alvo] como você.\n\nSabemos como [problema] pode ser desafiador, e estamos aqui para ajudar.\n\nQualquer dúvida, é só responder este email - adoraríamos bater um papo!\n\nCom carinho,\nEquipe [Sua Empresa]",
    profissional:
      "Prezado(a),\n\nTemos o prazer de anunciar o lançamento de [Produto/Serviço], uma solução premium desenvolvida para atender às exigências de [público-alvo].\n\nNossa equipe de especialistas trabalhou incansavelmente para criar um produto que oferece [benefícios principais], estabelecendo um novo padrão no mercado.\n\nConvidamos você a agendar uma demonstração personalizada para conhecer todos os recursos disponíveis.\n\nCordialmente,\nEquipe [Sua Empresa]",
    humorístico:
      'E aí, tudo certo?\n\nAdivinha só: acabamos de criar algo TÃO BOM que estamos quase explodindo de empolgação! 🎉\n\nApresentamos [Produto/Serviço] - ou como gostamos de chamar: "A Salvação para [problema]"!\n\nFeito especialmente para [público-alvo] que, como você, já estão cansados de soluções meia-boca.\n\nExperimente! Se não gostar... bem, vamos fingir que essa conversa nunca aconteceu, ok? 😉\n\nCom muito humor e café,\nEquipe [Sua Empresa] (aquela que não leva a vida TÃO a sério)',
  },
  "post para redes sociais": {
    formal:
      "Apresentamos [Produto/Serviço]: a solução ideal para [público-alvo] que enfrentam [problema]. Desenvolvido com os mais altos padrões de qualidade, nosso produto oferece [benefícios principais]. Saiba mais através do link na bio. #NovoProduto #Qualidade",
    casual:
      "Chegou o que vocês estavam esperando! 🙌 [Produto/Serviço] já está disponível para todos que estão cansados de [problema]! Perfeito para [público-alvo]! Vem conferir no link da bio! #Novidade #VocêMerece",
    persuasivo:
      "ATENÇÃO [público-alvo]! 🚨 Você ainda perde tempo com [problema]? Apresentamos a solução definitiva: [Produto/Serviço]! ✨ Benefícios INCRÍVEIS como [benefícios principais] esperam por você! OFERTA DE LANÇAMENTO por tempo LIMITADO! Corre pro link na bio! #OportunidadeÚnica #NãoPerca",
    amigável:
      "Oi, pessoal! 💙 Temos uma novidade super especial para compartilhar com vocês! Acabamos de lançar [Produto/Serviço] pensando em ajudar [público-alvo] como você a superar [problema] de um jeito muito mais fácil! Conta pra gente o que achou, ok? Link na bio! #NovidadesFresquinhas #PensandoEmVocê",
    profissional:
      "Lançamento oficial: [Produto/Serviço] - Desenvolvido para atender às necessidades específicas de [público-alvo], nossa nova solução resolve eficientemente [problema]. Resultados comprovados incluem [benefícios principais]. Para informações detalhadas, acesse o link na biografia. #Inovação #Excelência",
    humorístico:
      "Alerta de DRAMA! 🎭 [público-alvo] de todo o mundo estão ABANDONANDO [problema]! O motivo? Descobriram [Produto/Serviço]! 😱 Sim, é TÃO bom que estamos até com medo de ficar sem estoque! 🏃‍♂️💨 Corre pro link na bio antes que a gente comece a chorar! #SemDramaComNossoProduto #OuTalvezUmPouquinho",
  },
  "landing page": {
    formal:
      "# [Produto/Serviço]: A Solução Definitiva\n\n## Desenvolvido para [público-alvo]\n\nBem-vindo à próxima geração de soluções para [problema]. Nossa equipe de especialistas desenvolveu [Produto/Serviço] com o objetivo de proporcionar [benefícios principais].\n\n## Benefícios\n\n- Benefício 1\n- Benefício 2\n- Benefício 3\n\n## Entre em contato\n\nPreencha o formulário abaixo para mais informações sobre como [Produto/Serviço] pode transformar sua experiência.",
    casual:
      "# Diga adeus para [problema]!\n\n## Ei, [público-alvo]! Isso é para você!\n\nA gente sabe como é difícil lidar com [problema] no dia a dia. Por isso criamos [Produto/Serviço] - para tornar sua vida muito mais fácil!\n\n## O que você vai amar:\n\n- Característica legal 1\n- Característica legal 2\n- Característica legal 3\n\n## Vamos conversar?\n\nDeixa seu contato aí embaixo que a gente te conta tudo sobre como [Produto/Serviço] vai mudar sua vida!",
    persuasivo:
      "# REVOLUÇÃO EM [PROBLEMA]: [PRODUTO/SERVIÇO] CHEGOU!\n\n## Atenção, [público-alvo]! Sua busca acabou!\n\nMilhares de pessoas já transformaram completamente sua experiência com [problema]. O segredo? [Produto/Serviço]!\n\n## RESULTADOS GARANTIDOS:\n\n- Benefício impressionante 1\n- Benefício impressionante 2\n- Benefício impressionante 3\n\n## OFERTA POR TEMPO LIMITADO!\n\nApenas os próximos 50 clientes receberão [oferta especial]. Não perca esta oportunidade única! CADASTRE-SE AGORA!",
    amigável:
      "# Olá! Que bom te ver por aqui! 👋\n\n## Criamos algo especial para [público-alvo] como você\n\nSabemos que [problema] pode ser um verdadeiro desafio. É por isso que desenvolvemos [Produto/Serviço] com muito carinho e atenção aos detalhes.\n\n## O que preparamos para você:\n\n- Benefício amigável 1\n- Benefício amigável 2\n- Benefício amigável 3\n\n## Vamos conversar?\n\nAdoraríamos conhecer você melhor e entender como podemos ajudar. Deixe seu contato abaixo para iniciarmos uma conversa especial!",
    profissional:
      "# [Produto/Serviço]: Excelência em Soluções\n\n## Desenvolvido para profissionais exigentes\n\nApresentamos uma solução premium para [problema], meticulosamente projetada para atender às necessidades específicas de [público-alvo] que buscam resultados superiores.\n\n## Diferenciais estratégicos:\n\n- Diferencial exclusivo 1\n- Diferencial exclusivo 2\n- Diferencial exclusivo 3\n\n## Solicite uma demonstração personalizada\n\nNossa equipe de especialistas está pronta para apresentar como [Produto/Serviço] pode otimizar seus resultados. Preencha o formulário para agendar uma sessão exclusiva.",
    humorístico:
      "# Finalmente! Alguém resolveu [problema]! 🎉\n\n## Ei, [público-alvo]! Preparamos algo que vai fazer você pular de alegria!\n\nCansado de soluções que prometem mundos e fundos mas entregam... bem, nada? Nós também! Por isso criamos [Produto/Serviço] - porque a vida é curta demais para produtos chatos!\n\n## Coisas INCRÍVEIS que você vai conseguir fazer:\n\n- Coisa divertida 1\n- Coisa divertida 2\n- Coisa MUITO divertida 3\n\n## Vamos ser amigos?\n\nDeixa seu contato aí embaixo! Prometemos não enviar memes ruins (só os bons mesmo)!",
  },
  "descrição de produto": {
    formal:
      "[Produto/Serviço] é uma solução premium desenvolvida especificamente para atender às necessidades de [público-alvo]. Projetado para resolver [problema] com eficiência e precisão, nosso produto oferece [benefícios principais]. Fabricado com materiais de alta qualidade e submetido a rigorosos testes de controle, [Produto/Serviço] estabelece um novo padrão de excelência no mercado. Ideal para uso em [contexto de uso], proporciona resultados consistentes e duradouros.",
    casual:
      "Conheça [Produto/Serviço], a solução perfeita para [público-alvo] que estão cansados de [problema]! Criamos algo super prático e eficiente, que vai fazer você se perguntar como viveu tanto tempo sem isso. Com [benefícios principais], nosso produto torna tudo mais fácil e divertido. É perfeito para usar quando [contexto de uso] e vai transformar completamente sua experiência. Dá uma chance pra gente te surpreender!",
    persuasivo:
      "Revolucione sua experiência com [problema] através do extraordinário [Produto/Serviço]! Desenvolvido exclusivamente para [público-alvo] exigentes como você, este produto inovador oferece benefícios INCOMPARÁVEIS: [benefícios principais]. Enquanto produtos comuns decepcionam, [Produto/Serviço] supera todas as expectativas, proporcionando resultados que você pode VER e SENTIR imediatamente. Milhares de clientes satisfeitos já transformaram suas vidas. Não se contente com menos - escolha a excelência, escolha [Produto/Serviço]!",
    amigável:
      "Olá! Deixa a gente apresentar o [Produto/Serviço], criado especialmente para amigos como você, que fazem parte do grupo de [público-alvo]! Sabemos como [problema] pode ser chato no dia a dia, por isso desenvolvemos algo que realmente faz a diferença. Com [benefícios principais], nosso produto torna tudo mais simples e agradável. É perfeito para usar quando [contexto de uso] e foi feito com muito carinho pensando em você. Estamos aqui para qualquer dúvida, viu?",
    profissional:
      "[Produto/Serviço] representa o estado da arte em soluções para [problema], atendendo às demandas específicas de [público-alvo]. Desenvolvido com tecnologia proprietária e materiais premium, este produto oferece desempenho superior através de [benefícios principais]. A arquitetura otimizada garante eficiência máxima em [contexto de uso], enquanto mantém conformidade com os mais rigorosos padrões da indústria. Estudos independentes confirmam a superioridade de [Produto/Serviço] em métricas-chave de desempenho, estabelecendo um novo benchmark no setor.",
    humorístico:
      'Apresentamos [Produto/Serviço] - ou como gostamos de chamar: "O Salvador de [público-alvo] Desesperados"! 🦸‍♂️ Cansado de [problema] te perseguindo como aquele parente distante que aparece quando você ganha na loteria? Nós também! Por isso criamos algo TÃO BOM que até nossa concorrência está comprando (shh, não conta pra ninguém)! Com [benefícios principais] tão incríveis, você vai se perguntar se não tem magia envolvida. Perfeito para [contexto de uso] ou para impressionar aquela pessoa que disse que você nunca seria ninguém na vida. Garantia de satisfação ou devolvemos seu dinheiro (mas você não vai querer devolver, confia!).',
  },
}

const copywritingTips = {
  anúncio: [
    "Use números específicos em vez de generalizações",
    "Inclua uma oferta por tempo limitado para criar urgência",
    "Destaque o problema antes de apresentar a solução",
    "Use verbos de ação no imperativo",
    "Inclua pelo menos um elemento de prova social",
  ],
  "email marketing": [
    "Crie um assunto irresistível com menos de 50 caracteres",
    "Personalize o início do email com o nome do destinatário",
    "Mantenha parágrafos curtos (máximo 3 linhas)",
    "Inclua apenas uma chamada para ação principal",
    "Use P.S. para reforçar a oferta ou criar urgência",
  ],
  "post para redes sociais": [
    "Comece com uma pergunta ou afirmação impactante",
    "Use emojis estrategicamente para destacar pontos importantes",
    "Inclua hashtags relevantes e pesquisadas",
    "Termine com uma pergunta para engajamento",
    "Mantenha o texto conciso e direto ao ponto",
  ],
  "landing page": [
    "Use títulos que destacam o benefício principal",
    "Inclua depoimentos reais de clientes",
    "Adicione garantias para reduzir o risco percebido",
    "Use bullets para destacar benefícios",
    "Inclua múltiplas chamadas para ação ao longo da página",
  ],
  "descrição de produto": [
    "Comece com o benefício principal, não com características",
    "Use linguagem sensorial (veja, sinta, experimente)",
    "Inclua especificações técnicas em uma seção separada",
    "Antecipe e responda objeções comuns",
    "Compare sutilmente com alternativas inferiores",
  ],
}

const fieldExamples = {
  productInfo: {
    title: "Exemplos de Descrições de Produto",
    examples: [
      "Aplicativo de produtividade que automatiza tarefas repetitivas e economiza até 5 horas por semana para profissionais ocupados",
      "Curso online de 8 semanas que ensina marketing digital do zero, com suporte personalizado e garantia de resultados",
      "Suplemento natural à base de plantas que melhora o sono em 87% dos usuários na primeira semana de uso",
    ],
  },
  targetAudience: {
    title: "Exemplos de Descrições de Público-Alvo",
    examples: [
      "Empreendedores de 30-45 anos que trabalham mais de 60 horas por semana e buscam equilíbrio entre vida pessoal e profissional",
      "Mães de primeira viagem, 25-35 anos, preocupadas com desenvolvimento infantil e que valorizam produtos orgânicos",
      "Profissionais de TI em início de carreira que desejam se especializar em inteligência artificial e aumentar seu valor no mercado",
    ],
  },
}

export default function CopywritingView() {
  const [copyType, setCopyType] = useState<string>("")
  const [tone, setTone] = useState<string>("")
  const [productInfo, setProductInfo] = useState<string>("")
  const [targetAudience, setTargetAudience] = useState<string>("")
  const [length, setLength] = useState<string>("")

  const [generatedText, setGeneratedText] = useState<string>("")
  const [history, setHistory] = useState<CopyItem[]>([])

  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showTips, setShowTips] = useState<boolean>(false)

  const { toast } = useToast()

  useEffect(() => {
    const savedHistory = localStorage.getItem("copywritingHistory")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Erro ao carregar histórico:", e)
      }
    }
  }, [])

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("copywritingHistory", JSON.stringify(history))
    }
  }, [history])

  const generateWithTemplate = useCallback(() => {
    if (!copyType || !tone || !productInfo || !targetAudience) return ""

    const template =
      copyTemplates[copyType as keyof typeof copyTemplates]?.[tone as keyof (typeof copyTemplates)["anúncio"]] || ""

    let text = template
      .replace(/\[Produto\/Serviço\]/g, productInfo)
      .replace(/\[público-alvo\]/g, targetAudience)
      .replace(/\[problema\]/g, "problemas comuns enfrentados")
      .replace(/\[benefícios principais\]/g, "diversos benefícios e funcionalidades")
      .replace(/\[contexto de uso\]/g, "diversas situações")
      .replace(/\[Sua Empresa\]/g, "Nossa Empresa")
      .replace(/\[oferta especial\]/g, "um desconto especial")

    if (length === "short" && text.length > 300) {
      text = text.substring(0, 300) + "..."
    } else if (length === "medium" && text.length > 800) {
      text = text.substring(0, 800) + "..."
    }

    return text
  }, [copyType, tone, productInfo, targetAudience, length])

  const generateCopy = async () => {
    if (!copyType || !tone || !productInfo || !targetAudience || !length) {
      setError("Todos os campos são obrigatórios")
      toast({ title: "Erro", description: "Por favor, preencha todos os campos", variant: "destructive" })
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({ copyType, tone, productInfo, targetAudience, length }),
      })

      if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`)

      const data = await response.json()
      if (!data || !data.text) throw new Error("Nenhum texto foi gerado.")

      setGeneratedText(data.text)
    } catch (err: any) {
      const fallback = generateWithTemplate()
      if (fallback) {
        setGeneratedText(fallback)
        toast({ title: "Gerado com template", description: "Usei um modelo local como fallback." })
      } else {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
        setError(errorMessage)
        toast({ title: "Erro", description: errorMessage, variant: "destructive" })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" })
  }

  const saveToHistory = () => {
    if (!generatedText) return
    const newItem: CopyItem = {
      id: Date.now().toString(),
      copyType,
      tone,
      productInfo,
      targetAudience,
      length,
      generatedText,
      createdAt: new Date(),
    }
    setHistory([newItem, ...history])
    toast({ title: "Salvo!", description: "Texto salvo no histórico local" })
  }

  const clearForm = () => {
    setCopyType("")
    setTone("")
    setProductInfo("")
    setTargetAudience("")
    setLength("")
    setGeneratedText("")
  }

  const renderTips = () => {
    if (!copyType) return null
    const tips = copywritingTips[copyType as keyof typeof copywritingTips] || []
    return (
      <div className="bg-muted/60 border border-white/10 p-4 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          <h3 className="font-medium">Dicas para {copyType}</h3>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          {tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-3 py-0 sm:py-0 space-y-0 sm:space-y-2">
      {/* TOPO LIMPO, SEM TÍTULO E DESCRIÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1" />
      </div>

      <div className="overflow-x-auto pb-2">
        <Tabs defaultValue="create" className="space-y-4">
          <TabsList className="flex flex-wrap gap-2 bg-transparent p-0 justify-start mt-2">
            <TabsTrigger
              value="create"
              className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              Criar Copy
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              Chat IA
            </TabsTrigger>
            <TabsTrigger
              value="tips"
              className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              Dicas Avançadas
            </TabsTrigger>
            <TabsTrigger
              value="headlines"
              className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              Headlines
            </TabsTrigger>
            <TabsTrigger
              value="comparator"
              className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              Comparador
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 sm:space-y-6">
            <Card className="border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl shadow-xl">
              <CardHeader className="pb-4 sm:pb-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Gerador de Copywriting
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Configure os parâmetros para gerar seu texto persuasivo
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm border border-destructive/30">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="copy-type" className="text-xs sm:text-sm">
                      Tipo de Copy
                    </Label>
                    <Select
                      value={copyType}
                      onValueChange={(value) => {
                        setCopyType(value)
                        setShowTips(true)
                      }}
                    >
                      <SelectTrigger id="copy-type" className="bg-black/40 border-white/15">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anúncio">Anúncio</SelectItem>
                        <SelectItem value="email marketing">Email Marketing</SelectItem>
                        <SelectItem value="post para redes sociais">Post para Redes Sociais</SelectItem>
                        <SelectItem value="landing page">Landing Page</SelectItem>
                        <SelectItem value="descrição de produto">Descrição de Produto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone" className="text-xs sm:text-sm">
                      Tom de Voz
                    </Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger id="tone" className="bg-black/40 border-white/15">
                        <SelectValue placeholder="Selecione o tom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="persuasivo">Persuasivo</SelectItem>
                        <SelectItem value="amigável">Amigável</SelectItem>
                        <SelectItem value="profissional">Profissional</SelectItem>
                        <SelectItem value="humorístico">Humorístico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="product-info" className="text-xs sm:text-sm">
                      Informações do Produto/Serviço
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full hover:bg-white/10 text-muted-foreground"
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Exemplos</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 text-xs">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{fieldExamples.productInfo.title}</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {fieldExamples.productInfo.examples.map((example, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="flex-1">{example}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 ml-1 px-1"
                                  onClick={() => setProductInfo(example)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Textarea
                    id="product-info"
                    placeholder="Descreva seu produto ou serviço em detalhes..."
                    className="min-h-[100px] bg-black/40 border-white/15"
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="target-audience" className="text-xs sm:text-sm">
                      Público-Alvo
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full hover:bg-white/10 text-muted-foreground"
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Exemplos</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 text-xs">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{fieldExamples.targetAudience.title}</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {fieldExamples.targetAudience.examples.map((example, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="flex-1">{example}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 ml-1 px-1"
                                  onClick={() => setTargetAudience(example)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    id="target-audience"
                    placeholder="Descreva seu público-alvo (idade, interesses, etc.)"
                    className="bg-black/40 border-white/15"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length" className="text-xs sm:text-sm">
                    Comprimento
                  </Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger id="length" className="bg-black/40 border-white/15">
                      <SelectValue placeholder="Selecione o comprimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Curto (até 100 palavras)</SelectItem>
                      <SelectItem value="medium">Médio (100-300 palavras)</SelectItem>
                      <SelectItem value="long">Longo (300+ palavras)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showTips && copyType && (
                  <Collapsible defaultOpen={true} className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center justify-between w-full hover:bg-white/5"
                      >
                        <span className="flex items-center text-xs sm:text-sm">
                          <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />
                          Dicas para {copyType}
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">{renderTips()}</CollapsibleContent>
                  </Collapsible>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    className="flex-1 shadow-lg shadow-primary/30"
                    onClick={generateCopy}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar Copy
                      </>
                    )}
                  </Button>

                  {!isGenerating && (
                    <Button variant="outline" onClick={clearForm} className="border-white/20">
                      Limpar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 backdrop-blur-xl shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Resultado</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Seu texto gerado aparecerá aqui. Edite, copie ou salve para usar depois.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="O texto gerado aparecerá aqui..."
                  className="min-h-[220px] bg-black/40 border-white/15 text-sm"
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  readOnly={!isEditing}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedText)}
                    disabled={!generatedText}
                    className="border-white/30"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={!generatedText}
                    className="border-white/30"
                  >
                    <PenLine className="mr-2 h-4 w-4" />
                    {isEditing ? "Concluir Edição" : "Editar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveToHistory}
                    disabled={!generatedText}
                    className="border-white/30"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <ChatView />
          </TabsContent>

          <TabsContent value="tips">
            <Card className="border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle>Dicas Avançadas de Copywriting</CardTitle>
                <CardDescription>Aprenda técnicas profissionais para melhorar seus textos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Fórmulas de Copywriting Comprovadas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "AIDA",
                        description: "Atenção, Interesse, Desejo, Ação",
                        example:
                          "Cansado de perder tempo? (A) Nosso app economiza 5h por semana (I) para que você tenha mais tempo com sua família (D). Baixe agora gratuitamente! (A)",
                      },
                      {
                        title: "PAS",
                        description: "Problema, Agitação, Solução",
                        example:
                          "Seu site não converte? (P) Isso significa menos vendas, menos receita e mais frustração (A). Nossa consultoria já aumentou conversões em 300% para mais de 50 clientes (S).",
                      },
                      {
                        title: "BAB",
                        description: "Before, After, Bridge",
                        example:
                          "Antes você lutava para criar textos persuasivos (B). Imagine criar copies que vendem em minutos (A). Nosso gerador de copy é a ponte para essa realidade (B).",
                      },
                      {
                        title: "4 Ps",
                        description: "Promise, Picture, Proof, Push",
                        example:
                          "Dobre suas vendas em 30 dias (P). Imagine sua empresa crescendo enquanto você dorme (P). Mais de 200 clientes já conseguiram (P). Comece hoje com 50% de desconto (P).",
                      },
                    ].map((formula, index) => (
                      <Card key={index} className="overflow-hidden border-white/10 bg-black/40 backdrop-blur-md">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">{formula.title}</CardTitle>
                          <CardDescription>{formula.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground">{formula.example}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Gatilhos Mentais Poderosos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      {
                        title: "Escassez",
                        description: "Limite a disponibilidade para aumentar o desejo",
                        example: "Apenas 5 vagas restantes! Oferta válida só hoje!",
                      },
                      {
                        title: "Urgência",
                        description: "Crie um senso de tempo limitado",
                        example: "Promoção termina em 24 horas! Decida rápido!",
                      },
                      {
                        title: "Prova Social",
                        description: "Mostre que outros já aprovaram",
                        example: "Mais de 10.000 clientes satisfeitos! Veja os depoimentos!",
                      },
                      {
                        title: "Reciprocidade",
                        description: "Ofereça algo de valor antes de pedir algo",
                        example: "Baixe nosso e-book gratuito e descubra como triplicar suas vendas",
                      },
                      {
                        title: "Autoridade",
                        description: "Demonstre expertise e credibilidade",
                        example: "Desenvolvido por especialistas com 20+ anos de experiência",
                      },
                      {
                        title: "Curiosidade",
                        description: "Crie uma lacuna de informação que precisa ser preenchida",
                        example: "Descubra o segredo que 90% dos empreendedores desconhecem...",
                      },
                    ].map((trigger, index) => (
                      <Card key={index} className="overflow-hidden border-white/10 bg-black/40 backdrop-blur-md">
                        <CardHeader className="p-3">
                          <CardTitle className="text-base">{trigger.title}</CardTitle>
                          <CardDescription className="text-xs">{trigger.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-xs text-muted-foreground italic">"{trigger.example}"</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Como Maximizar os Resultados do Gerador de Copy</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>Seja específico na descrição do produto - quanto mais detalhes, melhores os resultados</li>
                    <li>Descreva seu público-alvo com características demográficas e psicográficas</li>
                    <li>Edite e refine o texto gerado para adicionar seu toque pessoal</li>
                    <li>Teste diferentes tons de voz para encontrar o que melhor ressoa com seu público</li>
                    <li>Use o texto gerado como ponto de partida e adicione exemplos específicos do seu negócio</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headlines">
            <HeadlineLibrary />
          </TabsContent>

          <TabsContent value="comparator">
            <CopyComparator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
