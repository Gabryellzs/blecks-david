import type { CopywritingTemplate } from "./template-data"

// Templates específicos para B2B
export const b2bEmailTemplates: CopywritingTemplate[] = [
  {
    id: "b2b-cold-email-problem",
    name: "Cold Email B2B - Problema",
    category: "email",
    description: "E-mail frio focado em identificar e resolver um problema específico",
    template: `Assunto: [EMPRESA] - [PROBLEMA ESPECÍFICO]?

Olá [NOME],

Vi que a [EMPRESA] [CONTEXTO ESPECÍFICO DA EMPRESA].

Tenho trabalhado com empresas similares como [EMPRESA SIMILAR 1] e [EMPRESA SIMILAR 2], e percebi que muitas enfrentam [PROBLEMA ESPECÍFICO].

Isso resulta em:
• [CONSEQUÊNCIA 1]
• [CONSEQUÊNCIA 2]
• [CONSEQUÊNCIA 3]

Desenvolvemos uma solução que [RESULTADO ESPECÍFICO] em [TEMPO].

Por exemplo, ajudamos a [EMPRESA EXEMPLO] a [RESULTADO CONCRETO].

Faz sentido conversarmos 15 minutos sobre isso?

Atenciosamente,
[SEU NOME]
[SEU CARGO]
[SUA EMPRESA]`,
    variables: [
      "EMPRESA",
      "PROBLEMA ESPECÍFICO",
      "NOME",
      "CONTEXTO ESPECÍFICO DA EMPRESA",
      "EMPRESA SIMILAR 1",
      "EMPRESA SIMILAR 2",
      "CONSEQUÊNCIA 1",
      "CONSEQUÊNCIA 2",
      "CONSEQUÊNCIA 3",
      "RESULTADO ESPECÍFICO",
      "TEMPO",
      "EMPRESA EXEMPLO",
      "RESULTADO CONCRETO",
      "SEU NOME",
      "SEU CARGO",
      "SUA EMPRESA",
    ],
    tips: ["Pesquise a empresa antes de enviar", "Seja específico sobre o problema", "Use casos de sucesso relevantes"],
  },
  {
    id: "b2b-linkedin-outreach",
    name: "LinkedIn Outreach B2B",
    category: "social-media",
    description: "Mensagem de conexão no LinkedIn para prospecção B2B",
    template: `Olá [NOME],

Vi seu post sobre [TÓPICO RELEVANTE] e achei muito interessante sua perspectiva sobre [PONTO ESPECÍFICO].

Trabalho com [ÁREA DE ATUAÇÃO] e tenho ajudado empresas como [TIPO DE EMPRESA] a [RESULTADO PRINCIPAL].

Recentemente, ajudamos a [EMPRESA EXEMPLO] a [RESULTADO ESPECÍFICO] em [TEMPO].

Seria interessante trocarmos experiências sobre [TÓPICO COMUM].

Aceita minha conexão?

Abraços,
[SEU NOME]`,
    variables: [
      "NOME",
      "TÓPICO RELEVANTE",
      "PONTO ESPECÍFICO",
      "ÁREA DE ATUAÇÃO",
      "TIPO DE EMPRESA",
      "RESULTADO PRINCIPAL",
      "EMPRESA EXEMPLO",
      "RESULTADO ESPECÍFICO",
      "TEMPO",
      "TÓPICO COMUM",
      "SEU NOME",
    ],
    tips: ["Referencie conteúdo recente da pessoa", "Seja genuíno no interesse", "Ofereça valor, não apenas peça"],
  },
]

export const b2bProposalTemplates: CopywritingTemplate[] = [
  {
    id: "b2b-proposal-consulting",
    name: "Proposta de Consultoria B2B",
    category: "landing-page",
    description: "Estrutura de proposta comercial para serviços de consultoria",
    template: `PROPOSTA COMERCIAL

Para: [EMPRESA CLIENTE]
Contato: [NOME DO CONTATO]
Data: [DATA]

SITUAÇÃO ATUAL
Baseado em nossa conversa, identificamos que a [EMPRESA CLIENTE] enfrenta os seguintes desafios:
• [DESAFIO 1]
• [DESAFIO 2]
• [DESAFIO 3]

OBJETIVOS
Nosso trabalho visa:
• [OBJETIVO 1]
• [OBJETIVO 2]
• [OBJETIVO 3]

SOLUÇÃO PROPOSTA
[DESCRIÇÃO DA SOLUÇÃO]

METODOLOGIA
Fase 1: [FASE 1] - [DURAÇÃO]
• [ATIVIDADE 1]
• [ATIVIDADE 2]

Fase 2: [FASE 2] - [DURAÇÃO]
• [ATIVIDADE 3]
• [ATIVIDADE 4]

Fase 3: [FASE 3] - [DURAÇÃO]
• [ATIVIDADE 5]
• [ATIVIDADE 6]

RESULTADOS ESPERADOS
• [RESULTADO 1]
• [RESULTADO 2]
• [RESULTADO 3]

INVESTIMENTO
Valor total: R$ [VALOR]
Condições: [CONDIÇÕES DE PAGAMENTO]

PRÓXIMOS PASSOS
1. [PASSO 1]
2. [PASSO 2]
3. [PASSO 3]

Atenciosamente,
[SEU NOME]
[SUA EMPRESA]`,
    variables: [
      "EMPRESA CLIENTE",
      "NOME DO CONTATO",
      "DATA",
      "DESAFIO 1",
      "DESAFIO 2",
      "DESAFIO 3",
      "OBJETIVO 1",
      "OBJETIVO 2",
      "OBJETIVO 3",
      "DESCRIÇÃO DA SOLUÇÃO",
      "FASE 1",
      "DURAÇÃO",
      "ATIVIDADE 1",
      "ATIVIDADE 2",
      "FASE 2",
      "ATIVIDADE 3",
      "ATIVIDADE 4",
      "FASE 3",
      "ATIVIDADE 5",
      "ATIVIDADE 6",
      "RESULTADO 1",
      "RESULTADO 2",
      "RESULTADO 3",
      "VALOR",
      "CONDIÇÕES DE PAGAMENTO",
      "PASSO 1",
      "PASSO 2",
      "PASSO 3",
      "SEU NOME",
      "SUA EMPRESA",
    ],
    tips: ["Personalize para cada cliente", "Seja específico nos resultados", "Inclua próximos passos claros"],
  },
]

export const b2bCaseStudyTemplates: CopywritingTemplate[] = [
  {
    id: "b2b-case-study",
    name: "Case Study B2B",
    category: "landing-page",
    description: "Estrutura de case study para demonstrar resultados",
    template: `CASE STUDY: Como a [EMPRESA] [RESULTADO PRINCIPAL]

CLIENTE
Empresa: [NOME DA EMPRESA]
Setor: [SETOR]
Tamanho: [TAMANHO DA EMPRESA]

DESAFIO
A [EMPRESA] enfrentava [PROBLEMA PRINCIPAL]:
• [PROBLEMA ESPECÍFICO 1]
• [PROBLEMA ESPECÍFICO 2]
• [PROBLEMA ESPECÍFICO 3]

Isso resultava em:
• [CONSEQUÊNCIA 1]
• [CONSEQUÊNCIA 2]

SOLUÇÃO
Implementamos [SOLUÇÃO PRINCIPAL]:

1. [ETAPA 1]
   - [AÇÃO 1]
   - [AÇÃO 2]

2. [ETAPA 2]
   - [AÇÃO 3]
   - [AÇÃO 4]

3. [ETAPA 3]
   - [AÇÃO 5]
   - [AÇÃO 6]

RESULTADOS
Em [PERÍODO], a [EMPRESA] alcançou:
• [RESULTADO 1] ([MÉTRICA])
• [RESULTADO 2] ([MÉTRICA])
• [RESULTADO 3] ([MÉTRICA])

DEPOIMENTO
"[DEPOIMENTO DO CLIENTE]"
- [NOME], [CARGO], [EMPRESA]

CONCLUSÃO
[RESUMO DOS APRENDIZADOS E BENEFÍCIOS]`,
    variables: [
      "EMPRESA",
      "RESULTADO PRINCIPAL",
      "NOME DA EMPRESA",
      "SETOR",
      "TAMANHO DA EMPRESA",
      "PROBLEMA PRINCIPAL",
      "PROBLEMA ESPECÍFICO 1",
      "PROBLEMA ESPECÍFICO 2",
      "PROBLEMA ESPECÍFICO 3",
      "CONSEQUÊNCIA 1",
      "CONSEQUÊNCIA 2",
      "SOLUÇÃO PRINCIPAL",
      "ETAPA 1",
      "AÇÃO 1",
      "AÇÃO 2",
      "ETAPA 2",
      "AÇÃO 3",
      "AÇÃO 4",
      "ETAPA 3",
      "AÇÃO 5",
      "AÇÃO 6",
      "PERÍODO",
      "RESULTADO 1",
      "MÉTRICA",
      "RESULTADO 2",
      "RESULTADO 3",
      "DEPOIMENTO DO CLIENTE",
      "NOME",
      "CARGO",
      "RESUMO DOS APRENDIZADOS E BENEFÍCIOS",
    ],
    tips: ["Use dados quantificáveis", "Conte uma história linear", "Inclua depoimento autêntico"],
  },
]

export const b2bWebinarTemplates: CopywritingTemplate[] = [
  {
    id: "b2b-webinar-corporate",
    name: "Webinar Corporativo B2B",
    category: "webinar",
    description: "Estrutura de webinar para audiência corporativa",
    template: `WEBINAR EXECUTIVO: [TÓPICO PRINCIPAL]

PARA QUEM É:
• [CARGO 1] que querem [OBJETIVO 1]
• [CARGO 2] que precisam [OBJETIVO 2]
• [CARGO 3] que buscam [OBJETIVO 3]

AGENDA:
1. [TÓPICO 1] ([TEMPO])
   - [SUBTÓPICO 1]
   - [SUBTÓPICO 2]

2. [TÓPICO 2] ([TEMPO])
   - [SUBTÓPICO 3]
   - [SUBTÓPICO 4]

3. [TÓPICO 3] ([TEMPO])
   - [SUBTÓPICO 5]
   - [SUBTÓPICO 6]

4. Q&A ([TEMPO])

PALESTRANTE:
[SEU NOME]
[SEU CARGO]
[SUA EMPRESA]

[BREVE BIO PROFISSIONAL]

CASES QUE SERÃO APRESENTADOS:
• [CASE 1]: [RESULTADO]
• [CASE 2]: [RESULTADO]
• [CASE 3]: [RESULTADO]

DATA: [DATA]
HORÁRIO: [HORÁRIO]
DURAÇÃO: [DURAÇÃO]

INSCREVA-SE:
[FORMULÁRIO DE INSCRIÇÃO]`,
    variables: [
      "TÓPICO PRINCIPAL",
      "CARGO 1",
      "OBJETIVO 1",
      "CARGO 2",
      "OBJETIVO 2",
      "CARGO 3",
      "OBJETIVO 3",
      "TÓPICO 1",
      "TEMPO",
      "SUBTÓPICO 1",
      "SUBTÓPICO 2",
      "TÓPICO 2",
      "SUBTÓPICO 3",
      "SUBTÓPICO 4",
      "TÓPICO 3",
      "SUBTÓPICO 5",
      "SUBTÓPICO 6",
      "SEU NOME",
      "SEU CARGO",
      "SUA EMPRESA",
      "BREVE BIO PROFISSIONAL",
      "CASE 1",
      "RESULTADO",
      "CASE 2",
      "CASE 3",
      "DATA",
      "HORÁRIO",
      "DURAÇÃO",
    ],
    tips: ["Foque em resultados de negócio", "Use linguagem corporativa", "Inclua cases relevantes"],
  },
]

export const b2bNewsletterTemplates: CopywritingTemplate[] = [
  {
    id: "b2b-newsletter-insights",
    name: "Newsletter B2B - Insights",
    category: "email",
    description: "Newsletter corporativa com insights do setor",
    template: `Assunto: [SETOR] Insights - [TÓPICO PRINCIPAL]

Olá [NOME],

Esta semana no [NOME DA NEWSLETTER]:

📊 NÚMEROS DA SEMANA
• [ESTATÍSTICA 1]
• [ESTATÍSTICA 2]
• [ESTATÍSTICA 3]

🎯 INSIGHT PRINCIPAL
[INSIGHT DETALHADO]

💡 3 AÇÕES PRÁTICAS
1. [AÇÃO 1]
2. [AÇÃO 2]
3. [AÇÃO 3]

📈 CASE DE SUCESSO
[BREVE CASE STUDY]

🔗 LEITURAS RECOMENDADAS
• [ARTIGO 1] - [LINK]
• [ARTIGO 2] - [LINK]
• [ARTIGO 3] - [LINK]

📅 PRÓXIMOS EVENTOS
• [EVENTO 1] - [DATA]
• [EVENTO 2] - [DATA]

Até a próxima semana!

[SEU NOME]
[SUA EMPRESA]

P.S.: [CALL TO ACTION SUTIL]`,
    variables: [
      "SETOR",
      "TÓPICO PRINCIPAL",
      "NOME",
      "NOME DA NEWSLETTER",
      "ESTATÍSTICA 1",
      "ESTATÍSTICA 2",
      "ESTATÍSTICA 3",
      "INSIGHT DETALHADO",
      "AÇÃO 1",
      "AÇÃO 2",
      "AÇÃO 3",
      "BREVE CASE STUDY",
      "ARTIGO 1",
      "LINK",
      "ARTIGO 2",
      "ARTIGO 3",
      "EVENTO 1",
      "DATA",
      "EVENTO 2",
      "SEU NOME",
      "SUA EMPRESA",
      "CALL TO ACTION SUTIL",
    ],
    tips: ["Mantenha formato consistente", "Inclua dados relevantes", "Ofereça valor genuíno"],
  },
]

// Função para buscar todos os templates B2B
export function getAllB2BTemplates(): CopywritingTemplate[] {
  return [
    ...b2bEmailTemplates,
    ...b2bProposalTemplates,
    ...b2bCaseStudyTemplates,
    ...b2bWebinarTemplates,
    ...b2bNewsletterTemplates,
  ]
}

// Função para buscar templates B2B por categoria
export function getB2BTemplatesByCategory(category: string): CopywritingTemplate[] {
  switch (category) {
    case "email":
      return [...b2bEmailTemplates, ...b2bNewsletterTemplates]
    case "landing-page":
      return [...b2bProposalTemplates, ...b2bCaseStudyTemplates]
    case "webinar":
      return b2bWebinarTemplates
    case "social-media":
      return b2bEmailTemplates.filter((t) => t.id === "b2b-linkedin-outreach")
    default:
      return []
  }
}

// Função para buscar template B2B por ID
export function getB2BTemplateById(id: string): CopywritingTemplate | null {
  const allB2BTemplates = getAllB2BTemplates()
  return allB2BTemplates.find((template) => template.id === id) || null
}
