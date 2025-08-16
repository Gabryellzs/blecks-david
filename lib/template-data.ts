export interface Template {
  id: string
  name: string
  category: string
  description: string
  content: string
  variables: string[]
  tags: string[]
}

export interface CopywritingTemplate {
  id: string
  name: string
  category: "headline" | "email" | "vsl" | "landing-page" | "social-media" | "webinar"
  description: string
  template: string
  variables: string[]
  examples?: string[]
  tips?: string[]
}

// Templates de Headlines
export const headlineTemplates: CopywritingTemplate[] = [
  {
    id: "headline-problem-solution",
    name: "Problema + Solução",
    category: "headline",
    description: "Identifica um problema específico e apresenta a solução",
    template: "Como [PÚBLICO-ALVO] pode [RESULTADO DESEJADO] sem [OBSTÁCULO COMUM]",
    variables: ["PÚBLICO-ALVO", "RESULTADO DESEJADO", "OBSTÁCULO COMUM"],
    examples: [
      "Como empreendedores podem dobrar suas vendas sem gastar mais em publicidade",
      "Como mães ocupadas podem perder peso sem abrir mão do tempo com a família",
    ],
    tips: [
      "Seja específico sobre o público-alvo",
      "Use obstáculos reais que seu público enfrenta",
      "Prometa um resultado tangível",
    ],
  },
  {
    id: "headline-number-benefit",
    name: "Número + Benefício",
    category: "headline",
    description: "Usa números específicos para criar credibilidade",
    template: "[NÚMERO] [ESTRATÉGIAS/FORMAS/SEGREDOS] para [RESULTADO ESPECÍFICO] em [TEMPO]",
    variables: ["NÚMERO", "ESTRATÉGIAS/FORMAS/SEGREDOS", "RESULTADO ESPECÍFICO", "TEMPO"],
    examples: [
      "7 estratégias para triplicar sua lista de e-mails em 30 dias",
      "5 segredos para conseguir mais clientes sem gastar com anúncios",
    ],
    tips: ["Use números ímpares (são mais convincentes)", "Seja específico com o tempo", "Prometa algo alcançável"],
  },
  {
    id: "headline-secret-reveal",
    name: "Revelação de Segredo",
    category: "headline",
    description: "Desperta curiosidade prometendo revelar informações exclusivas",
    template: "O segredo que [GRUPO DE SUCESSO] não quer que você saiba sobre [TÓPICO]",
    variables: ["GRUPO DE SUCESSO", "TÓPICO"],
    examples: [
      "O segredo que grandes empresas não querem que você saiba sobre marketing digital",
      "O método que coaches de sucesso usam para conseguir clientes premium",
    ],
    tips: ['Crie um "nós vs eles"', "Use grupos reconhecidos como autoridade", "Mantenha o mistério"],
  },
]

// Templates de E-mail Marketing
export const emailTemplates: CopywritingTemplate[] = [
  {
    id: "email-welcome-sequence",
    name: "Sequência de Boas-vindas",
    category: "email",
    description: "Primeiro e-mail da sequência de nutrição",
    template: `Assunto: Bem-vindo(a) à [COMUNIDADE/LISTA]! Aqui está seu [PRESENTE]

Olá [NOME],

Que alegria ter você aqui na [COMUNIDADE/LISTA]!

Eu sou [SEU NOME], [SUA CREDENCIAL], e estou muito animado(a) para compartilhar com você [VALOR QUE VOCÊ OFERECE].

Como prometido, aqui está seu [PRESENTE]:
[LINK PARA O PRESENTE]

Nos próximos dias, você vai receber:
• [BENEFÍCIO 1]
• [BENEFÍCIO 2] 
• [BENEFÍCIO 3]

Uma pergunta rápida: qual é seu maior desafio com [TÓPICO PRINCIPAL]?

Responda este e-mail - eu leio todas as respostas pessoalmente!

Um abraço,
[SEU NOME]

P.S.: Adicione meu e-mail ([SEU EMAIL]) aos seus contatos para não perder nenhuma mensagem importante.`,
    variables: [
      "COMUNIDADE/LISTA",
      "PRESENTE",
      "NOME",
      "SEU NOME",
      "SUA CREDENCIAL",
      "VALOR QUE VOCÊ OFERECE",
      "BENEFÍCIO 1",
      "BENEFÍCIO 2",
      "BENEFÍCIO 3",
      "TÓPICO PRINCIPAL",
      "SEU EMAIL",
    ],
    tips: [
      "Entregue o presente prometido imediatamente",
      "Faça uma pergunta para gerar engajamento",
      "Seja pessoal e acessível",
    ],
  },
  {
    id: "email-story-selling",
    name: "Venda através de História",
    category: "email",
    description: "Usa storytelling para vender de forma natural",
    template: `Assunto: A história que mudou tudo para mim...

Oi [NOME],

Deixa eu te contar uma história...

[ANO] foi um ano difícil para mim.

[SITUAÇÃO PROBLEMÁTICA DETALHADA]

Eu me sentia [EMOÇÃO NEGATIVA] e não sabia mais o que fazer.

Foi quando descobri [SOLUÇÃO/MÉTODO].

No começo, eu estava cético(a). Pensei: "Isso é bom demais para ser verdade."

Mas decidi tentar mesmo assim.

E sabe o que aconteceu?

[RESULTADO POSITIVO ESPECÍFICO]

Em [TEMPO], eu consegui [TRANSFORMAÇÃO COMPLETA].

Hoje, [SITUAÇÃO ATUAL POSITIVA].

Por isso criei [SEU PRODUTO/SERVIÇO].

Porque acredito que você também merece [RESULTADO DESEJADO].

Se você quer saber exatamente como fiz isso, clique aqui:
[LINK]

Com carinho,
[SEU NOME]`,
    variables: [
      "NOME",
      "ANO",
      "SITUAÇÃO PROBLEMÁTICA DETALHADA",
      "EMOÇÃO NEGATIVA",
      "SOLUÇÃO/MÉTODO",
      "RESULTADO POSITIVO ESPECÍFICO",
      "TEMPO",
      "TRANSFORMAÇÃO COMPLETA",
      "SITUAÇÃO ATUAL POSITIVA",
      "SEU PRODUTO/SERVIÇO",
      "RESULTADO DESEJADO",
      "LINK",
      "SEU NOME",
    ],
    tips: ["Use uma história real e pessoal", "Mostre a transformação claramente", "Conecte a história com sua oferta"],
  },
]

// Templates de VSL (Video Sales Letter)
export const vslTemplates: CopywritingTemplate[] = [
  {
    id: "vsl-problem-agitation-solution",
    name: "Problema-Agitação-Solução",
    category: "vsl",
    description: "Estrutura clássica de VSL que identifica, agita e resolve problemas",
    template: `ABERTURA (0-30s):
"Se você é [PÚBLICO-ALVO] que está [SITUAÇÃO ATUAL PROBLEMÁTICA], então este vídeo pode mudar sua vida."

IDENTIFICAÇÃO DO PROBLEMA (30s-2min):
"Deixa eu adivinhar... você já tentou [SOLUÇÃO COMUM 1], [SOLUÇÃO COMUM 2] e até [SOLUÇÃO COMUM 3], mas nada funcionou, certo?"

AGITAÇÃO (2-4min):
"E o pior de tudo é que enquanto você continua [CONSEQUÊNCIA NEGATIVA], seus [CONCORRENTES/OUTROS] estão [RESULTADO POSITIVO QUE OUTROS ESTÃO TENDO]."

CREDIBILIDADE (4-6min):
"Meu nome é [SEU NOME] e nos últimos [TEMPO], eu ajudei mais de [NÚMERO] [PÚBLICO-ALVO] a [RESULTADO PRINCIPAL]."

SOLUÇÃO (6-10min):
"Descobri que o verdadeiro segredo não é [CRENÇA FALSA], mas sim [CRENÇA VERDADEIRA]. E hoje vou te mostrar exatamente como aplicar isso."

PROVA SOCIAL (10-12min):
[DEPOIMENTOS E CASOS DE SUCESSO]

OFERTA (12-15min):
"Normalmente, isso custaria [PREÇO ALTO], mas hoje você pode ter acesso por apenas [PREÇO ATUAL]."

URGÊNCIA (15-17min):
"Mas atenção: essa oferta especial termina em [PRAZO] ou quando as [NÚMERO] vagas se esgotarem."

CALL TO ACTION (17-18min):
"Clique no botão abaixo agora e garante sua vaga."`,
    variables: [
      "PÚBLICO-ALVO",
      "SITUAÇÃO ATUAL PROBLEMÁTICA",
      "SOLUÇÃO COMUM 1",
      "SOLUÇÃO COMUM 2",
      "SOLUÇÃO COMUM 3",
      "CONSEQUÊNCIA NEGATIVA",
      "CONCORRENTES/OUTROS",
      "RESULTADO POSITIVO QUE OUTROS ESTÃO TENDO",
      "SEU NOME",
      "TEMPO",
      "NÚMERO",
      "RESULTADO PRINCIPAL",
      "CRENÇA FALSA",
      "CRENÇA VERDADEIRA",
      "PREÇO ALTO",
      "PREÇO ATUAL",
      "PRAZO",
    ],
    tips: ["Mantenha o ritmo dinâmico", "Use pausas estratégicas", "Inclua elementos visuais de apoio"],
  },
]

// Templates de Landing Page
export const landingPageTemplates: CopywritingTemplate[] = [
  {
    id: "landing-lead-magnet",
    name: "Captura de Lead Magnet",
    category: "landing-page",
    description: "Página para capturar e-mails em troca de material gratuito",
    template: `HEADLINE:
[BENEFÍCIO PRINCIPAL] em [TEMPO] - Guia Gratuito

SUBHEADLINE:
Descubra [MÉTODO/ESTRATÉGIA] que [RESULTADO ESPECÍFICO] sem [OBSTÁCULO COMUM]

BULLETS DE BENEFÍCIOS:
✓ [BENEFÍCIO 1 ESPECÍFICO]
✓ [BENEFÍCIO 2 ESPECÍFICO]  
✓ [BENEFÍCIO 3 ESPECÍFICO]
✓ [BENEFÍCIO 4 ESPECÍFICO]

PROVA SOCIAL:
"[DEPOIMENTO]" - [NOME], [CREDENCIAL]

FORMULÁRIO:
Nome:
E-mail:
[BOTÃO: QUERO MEU GUIA GRATUITO]

GARANTIA:
Seus dados estão 100% seguros. Não enviamos spam.

SOBRE O AUTOR:
[SEU NOME] é [SUA CREDENCIAL] e já ajudou [NÚMERO] pessoas a [RESULTADO].`,
    variables: [
      "BENEFÍCIO PRINCIPAL",
      "TEMPO",
      "MÉTODO/ESTRATÉGIA",
      "RESULTADO ESPECÍFICO",
      "OBSTÁCULO COMUM",
      "BENEFÍCIO 1 ESPECÍFICO",
      "BENEFÍCIO 2 ESPECÍFICO",
      "BENEFÍCIO 3 ESPECÍFICO",
      "BENEFÍCIO 4 ESPECÍFICO",
      "DEPOIMENTO",
      "NOME",
      "CREDENCIAL",
      "SEU NOME",
      "SUA CREDENCIAL",
      "NÚMERO",
      "RESULTADO",
    ],
    tips: [
      "Foque em um benefício principal",
      "Use bullets específicos, não genéricos",
      "Inclua prova social relevante",
    ],
  },
]

// Templates de Redes Sociais
export const socialMediaTemplates: CopywritingTemplate[] = [
  {
    id: "social-value-post",
    name: "Post de Valor",
    category: "social-media",
    description: "Post que entrega valor genuíno para o público",
    template: `[GANCHO INICIAL CURIOSO]

Aqui estão [NÚMERO] [DICAS/ESTRATÉGIAS/SEGREDOS] que [RESULTADO]:

1. [DICA 1 ESPECÍFICA]
→ [EXPLICAÇÃO BREVE]

2. [DICA 2 ESPECÍFICA]  
→ [EXPLICAÇÃO BREVE]

3. [DICA 3 ESPECÍFICA]
→ [EXPLICAÇÃO BREVE]

[PERGUNTA PARA ENGAJAMENTO]

Salva este post para não esquecer! 📌

#[HASHTAG1] #[HASHTAG2] #[HASHTAG3]`,
    variables: [
      "GANCHO INICIAL CURIOSO",
      "NÚMERO",
      "DICAS/ESTRATÉGIAS/SEGREDOS",
      "RESULTADO",
      "DICA 1 ESPECÍFICA",
      "EXPLICAÇÃO BREVE",
      "DICA 2 ESPECÍFICA",
      "DICA 3 ESPECÍFICA",
      "PERGUNTA PARA ENGAJAMENTO",
      "HASHTAG1",
      "HASHTAG2",
      "HASHTAG3",
    ],
    tips: ["Comece com um gancho forte", "Seja específico nas dicas", "Termine com call-to-action"],
  },
]

// Templates de Webinar
export const webinarTemplates: CopywritingTemplate[] = [
  {
    id: "webinar-registration",
    name: "Página de Inscrição em Webinar",
    category: "webinar",
    description: "Página para inscrições em webinar gratuito",
    template: `HEADLINE:
Webinar Gratuito: [TÓPICO PRINCIPAL] em [TEMPO]

SUBHEADLINE:
Descubra [MÉTODO/SISTEMA] que [RESULTADO ESPECÍFICO] - mesmo que [OBJEÇÃO COMUM]

DATA E HORÁRIO:
[DIA], [DATA] às [HORÁRIO]

O QUE VOCÊ VAI APRENDER:
✓ [APRENDIZADO 1]
✓ [APRENDIZADO 2]
✓ [APRENDIZADO 3]
✓ [BÔNUS ESPECIAL]

SOBRE O PALESTRANTE:
[SEU NOME] é [SUA CREDENCIAL] e [CONQUISTA RELEVANTE].

FORMULÁRIO DE INSCRIÇÃO:
Nome:
E-mail:
WhatsApp:
[BOTÃO: GARANTIR MINHA VAGA GRATUITA]

AVISO:
Vagas limitadas! Apenas [NÚMERO] pessoas poderão participar ao vivo.`,
    variables: [
      "TÓPICO PRINCIPAL",
      "TEMPO",
      "MÉTODO/SISTEMA",
      "RESULTADO ESPECÍFICO",
      "OBJEÇÃO COMUM",
      "DIA",
      "DATA",
      "HORÁRIO",
      "APRENDIZADO 1",
      "APRENDIZADO 2",
      "APRENDIZADO 3",
      "BÔNUS ESPECIAL",
      "SEU NOME",
      "SUA CREDENCIAL",
      "CONQUISTA RELEVANTE",
      "NÚMERO",
    ],
    tips: ["Prometa aprendizados específicos", "Crie urgência com vagas limitadas", "Destaque que é gratuito"],
  },
]

// Função para buscar templates por categoria
export function getTemplatesByCategory(category: string): CopywritingTemplate[] {
  switch (category) {
    case "headline":
      return headlineTemplates
    case "email":
      return emailTemplates
    case "vsl":
      return vslTemplates
    case "landing-page":
      return landingPageTemplates
    case "social-media":
      return socialMediaTemplates
    case "webinar":
      return webinarTemplates
    default:
      return []
  }
}

// Função para buscar template por ID
export function getTemplateById(id: string): CopywritingTemplate | null {
  const allTemplates = [
    ...headlineTemplates,
    ...emailTemplates,
    ...vslTemplates,
    ...landingPageTemplates,
    ...socialMediaTemplates,
    ...webinarTemplates,
  ]

  return allTemplates.find((template) => template.id === id) || null
}

// Função para buscar templates por palavra-chave
export function searchTemplates(query: string): CopywritingTemplate[] {
  const allTemplates = [
    ...headlineTemplates,
    ...emailTemplates,
    ...vslTemplates,
    ...landingPageTemplates,
    ...socialMediaTemplates,
    ...webinarTemplates,
  ]

  const lowercaseQuery = query.toLowerCase()

  return allTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.template.toLowerCase().includes(lowercaseQuery),
  )
}

// Função para substituir variáveis no template
export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\[${key}\\]`, "g")
    result = result.replace(regex, value)
  })

  return result
}
