"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Categorias de headlines
type HeadlineCategory = "curiosidade" | "benefício" | "urgência" | "problema" | "social" | "como fazer"

// Interface para os headlines
interface Headline {
  text: string
  category: HeadlineCategory
  tags: string[]
}

// Biblioteca de headlines comprovadamente eficazes
const headlines: Headline[] = [
  {
    text: "Como [Fazer Algo] em [Período de Tempo] Sem [Algo Negativo]",
    category: "como fazer",
    tags: ["tutorial", "rápido", "solução"],
  },
  {
    text: "7 Maneiras Comprovadas de [Alcançar Resultado Desejado]",
    category: "como fazer",
    tags: ["lista", "comprovado", "resultados"],
  },
  {
    text: "O Segredo para [Benefício] que [Autoridade/Grupo] Não Quer que Você Saiba",
    category: "curiosidade",
    tags: ["segredo", "exclusivo", "revelação"],
  },
  {
    text: "Por Que [Algo Comum] Está Destruindo Suas Chances de [Objetivo Desejado]",
    category: "problema",
    tags: ["alerta", "problema", "obstáculo"],
  },
  {
    text: "Descubra Como [Pessoa Comum] Conseguiu [Resultado Impressionante] em [Período Curto]",
    category: "social",
    tags: ["história", "inspiração", "resultado"],
  },
  {
    text: "A Verdade Chocante Sobre [Tópico]: O Que Ninguém Está Falando",
    category: "curiosidade",
    tags: ["revelação", "chocante", "exclusivo"],
  },
  {
    text: "Transforme Seu [Área da Vida] com Estas 5 Estratégias Simples",
    category: "benefício",
    tags: ["transformação", "estratégias", "simples"],
  },
  {
    text: "Última Chance: [Oferta] Termina [Prazo]",
    category: "urgência",
    tags: ["oferta", "limitado", "prazo"],
  },
  {
    text: "Pare de [Problema] de Uma Vez Por Todas Com [Solução]",
    category: "problema",
    tags: ["solução", "definitivo", "problema"],
  },
  {
    text: "O Que [Pessoa/Grupo Admirado] Pode Ensinar Sobre [Tópico]",
    category: "social",
    tags: ["autoridade", "aprendizado", "exemplo"],
  },
  {
    text: "[Número]% das Pessoas Cometem Este Erro ao [Fazer Algo]",
    category: "problema",
    tags: ["erro", "estatística", "alerta"],
  },
  {
    text: "Como Eu [Resultado Positivo] Depois de [Ação/Mudança]",
    category: "social",
    tags: ["testemunho", "resultado", "história"],
  },
  {
    text: "Finalmente Revelado: O Método [Nome] para [Benefício Desejado]",
    category: "curiosidade",
    tags: ["método", "revelação", "exclusivo"],
  },
  {
    text: "[Faça Algo] Como um Profissional: [Número] Dicas dos Especialistas",
    category: "como fazer",
    tags: ["profissional", "dicas", "especialista"],
  },
  {
    text: "Atenção [Público-Alvo]: [Benefício] Está ao Seu Alcance",
    category: "benefício",
    tags: ["atenção", "específico", "alcançável"],
  },
  {
    text: "Apenas [Prazo Curto] Restantes: Garanta Seu [Produto/Serviço] Antes que Acabe",
    category: "urgência",
    tags: ["escassez", "tempo", "ação"],
  },
  {
    text: "O Guia Definitivo para [Alcançar Objetivo] em [Ano/Temporada]",
    category: "como fazer",
    tags: ["guia", "definitivo", "atual"],
  },
  {
    text: "[Número] Sinais de que Você Está [Problema/Situação Negativa]",
    category: "problema",
    tags: ["sinais", "diagnóstico", "alerta"],
  },
  {
    text: "Como [Produto/Método] Ajudou [Número] Pessoas a [Resultado Positivo]",
    category: "social",
    tags: ["prova social", "resultado", "números"],
  },
  {
    text: "Revolucione Seu [Área] com [Produto/Método] em Apenas [Tempo Curto]",
    category: "benefício",
    tags: ["revolução", "rápido", "transformação"],
  },
  {
    text: "Você Está Cometendo Estes [Número] Erros em [Atividade]?",
    category: "problema",
    tags: ["erros", "alerta", "pergunta"],
  },
  {
    text: "O Método [Nome] que Está Transformando [Indústria/Área]",
    category: "curiosidade",
    tags: ["método", "transformação", "inovação"],
  },
  {
    text: "Economize [Recurso] Enquanto [Alcança Objetivo] com [Método/Produto]",
    category: "benefício",
    tags: ["economia", "eficiência", "resultado"],
  },
  {
    text: "Apenas Hoje: [Oferta Especial] para os Primeiros [Número] Clientes",
    category: "urgência",
    tags: ["oferta", "limitado", "exclusivo"],
  },
  {
    text: "De [Situação Negativa] a [Situação Positiva] em [Período]: Minha Jornada",
    category: "social",
    tags: ["jornada", "transformação", "história"],
  },
  {
    text: "A Fórmula Secreta para [Resultado Desejado] Sem [Sacrifício Comum]",
    category: "benefício",
    tags: ["fórmula", "segredo", "sem sacrifício"],
  },
  {
    text: "Por Que [Método Tradicional] Não Funciona e O Que Fazer Em Vez Disso",
    category: "problema",
    tags: ["solução", "alternativa", "ineficácia"],
  },
  {
    text: "Confira o Que [Autoridade/Celebridade] Disse Sobre [Produto/Serviço]",
    category: "social",
    tags: ["autoridade", "opinião", "credibilidade"],
  },
  {
    text: "O Único [Produto/Método] Que Realmente [Benefício Específico]",
    category: "benefício",
    tags: ["único", "específico", "exclusivo"],
  },
  {
    text: "Alerta: [Problema] Pode Estar Afetando Seu [Área da Vida] Sem Você Perceber",
    category: "problema",
    tags: ["alerta", "desconhecido", "impacto"],
  },
]

export default function HeadlineLibrary() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<HeadlineCategory | "todas">("todas")
  const { toast } = useToast()

  // Filtrar headlines com base na pesquisa e categoria
  const filteredHeadlines = headlines.filter((headline) => {
    const matchesSearch =
      headline.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      headline.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "todas" || headline.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Função para copiar headline
  const copyHeadline = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Headline copiado para a área de transferência",
    })
  }

  // Cores para as categorias
  const categoryColors: Record<HeadlineCategory, string> = {
    curiosidade: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    benefício: "bg-green-100 text-green-800 hover:bg-green-200",
    urgência: "bg-red-100 text-red-800 hover:bg-red-200",
    problema: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    social: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    "como fazer": "bg-teal-100 text-teal-800 hover:bg-teal-200",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biblioteca de Headlines</CardTitle>
        <CardDescription>Headlines comprovadamente eficazes para aumentar suas taxas de conversão</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar headlines..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "todas" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("todas")}
            >
              Todas
            </Button>
            {(Object.keys(categoryColors) as HeadlineCategory[]).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {filteredHeadlines.length > 0 ? (
            filteredHeadlines.map((headline, index) => (
              <div key={index} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{headline.text}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge className={`${categoryColors[headline.category]} border-none`} variant="outline">
                        {headline.category}
                      </Badge>
                      {headline.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="bg-background">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyHeadline(headline.text)} className="h-8 w-8 p-0">
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar</span>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum headline encontrado com os filtros atuais.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
