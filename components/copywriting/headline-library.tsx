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

  const filteredHeadlines = headlines.filter((headline) => {
    const matchesSearch =
      headline.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      headline.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "todas" || headline.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const copyHeadline = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Headline copiado para a área de transferência",
    })
  }

  // Cores para as categorias (mantém colorido, mas sem neon azul no card)
  const categoryColors: Record<HeadlineCategory, string> = {
    curiosidade: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    benefício: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    urgência: "bg-red-500/10 text-red-300 border-red-500/30",
    problema: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    social: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    "como fazer": "bg-teal-500/10 text-teal-300 border-teal-500/30",
  }

  return (
    <Card className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              Biblioteca de Headlines
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              Modelos prontos para você adaptar em anúncios, páginas e campanhas.
            </CardDescription>
          </div>
          <Badge className="border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            {filteredHeadlines.length} modelos
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-5">
        {/* Filtros */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por palavra-chave, tag ou tipo de headline..."
              className="h-9 rounded-full border-white/10 bg-black/40 pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button
              variant={selectedCategory === "todas" ? "default" : "outline"}
              size="sm"
              className={`h-8 rounded-full border text-xs ${
                selectedCategory === "todas"
                  ? "border-white/40 bg-white text-black shadow-md"
                  : "border-white/10 bg-black/40 hover:border-white/40 hover:bg-white/5"
              }`}
              onClick={() => setSelectedCategory("todas")}
            >
              Todas
            </Button>

            {(Object.keys(categoryColors) as HeadlineCategory[]).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={`h-8 rounded-full border text-xs capitalize ${
                  selectedCategory === category
                    ? "border-white/40 bg-white text-black shadow-md"
                    : "border-white/10 bg-black/40 hover:border-white/40 hover:bg-white/5"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.replace("-", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de headlines */}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {filteredHeadlines.length > 0 ? (
            filteredHeadlines.map((headline, index) => (
              <div
                key={index}
                className="group relative flex h-full flex-col justify-between rounded-xl border border-white/8 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-3.5 text-sm shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-white/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
              >
                <div>
                  <p className="pr-8 text-[13px] font-medium leading-snug text-slate-50">
                    {headline.text}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className={`${categoryColors[headline.category]} rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}
                    >
                      {headline.category}
                    </Badge>

                    {headline.tags.map((tag, tagIndex) => (
                      <Badge
                        key={tagIndex}
                        variant="outline"
                        className="rounded-full border-white/10 bg-black/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyHeadline(headline.text)}
                  className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/40 p-0 text-muted-foreground opacity-70 shadow-sm transition-all hover:border-white/50 hover:bg-white/10 hover:text-white hover:opacity-100 group-hover:opacity-100"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="sr-only">Copiar</span>
                </Button>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 bg-black/40 py-8 text-center text-sm text-muted-foreground">
              Nenhum headline encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
