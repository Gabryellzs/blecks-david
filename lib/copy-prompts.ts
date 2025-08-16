// Prompts otimizados para geração de copywriting de alta qualidade
export const getEnhancedPrompt = (
  copyType: string,
  tone: string,
  productInfo: string,
  targetAudience: string,
  length: string,
) => {
  return `
### INSTRUÇÕES PARA COPYWRITING DE ALTA CONVERSÃO ###

Você é um copywriter especialista com mais de 15 anos de experiência, responsável por campanhas que geraram milhões em vendas. 
Sua missão é criar um texto que não apenas informa, mas CONVERTE leitores em compradores.

## DETALHES DO PROJETO ##
- Tipo de conteúdo: ${copyType}
- Tom de voz: ${tone}
- Produto/Serviço: ${productInfo}
- Público-alvo: ${targetAudience}
- Comprimento: ${length === "short" ? "curto e impactante (até 150 palavras)" : length === "medium" ? "médio e persuasivo (150-400 palavras)" : "longo e detalhado (400+ palavras)"}

## FÓRMULAS DE CONVERSÃO OBRIGATÓRIAS ##

### Para ${copyType.toUpperCase()}:
${getConversionFormula(copyType)}

## GATILHOS PSICOLÓGICOS AVANÇADOS ##
1. **ESCASSEZ REAL**: Use números específicos, prazos exatos
2. **PROVA SOCIAL DETALHADA**: Mencione resultados específicos de clientes
3. **AUTORIDADE**: Posicione como especialista no assunto
4. **RECIPROCIDADE**: Ofereça valor antes de pedir algo
5. **COMPROMISSO**: Faça o leitor se comprometer mentalmente
6. **CONTRASTE**: Mostre antes vs depois, com vs sem
7. **URGÊNCIA EMOCIONAL**: Crie senso de perda iminente
8. **ESPECIFICIDADE**: Use números exatos, não aproximações

## TÉCNICAS NEUROLÓGICAS DE PERSUASÃO ##
- **Palavras de poder**: Descobrir, Segredo, Garantido, Comprovado, Exclusivo
- **Verbos de ação**: Transforme, Domine, Conquiste, Multiplique, Acelere
- **Conectores emocionais**: Imagine, Visualize, Sinta, Experimente
- **Quebra de objeções**: Antecipe e destrua resistências mentais

## ESTRUTURA NEURAL DE CONVERSÃO ##
1. **GANCHO MAGNÉTICO** (primeiros 3 segundos decisivos)
2. **IDENTIFICAÇÃO EMOCIONAL** (dor/desejo do público)
3. **AGITAÇÃO CONTROLADA** (intensificar o problema)
4. **SOLUÇÃO ÚNICA** (seu produto como única saída)
5. **PROVA IRREFUTÁVEL** (evidências que não podem ser negadas)
6. **OFERTA IRRESISTÍVEL** (valor percebido > preço)
7. **ESCASSEZ GENUÍNA** (limitação real de tempo/quantidade)
8. **CALL-TO-ACTION HIPNÓTICO** (comando direto e específico)

## DIRETRIZES NEUROLÓGICAS ##
- Use "VOCÊ" constantemente para criar conexão direta
- Escreva como se fosse uma conversa íntima entre amigos
- Cada frase deve gerar curiosidade para a próxima
- Quebre objeções ANTES que elas surjam na mente
- Use storytelling para contornar resistências lógicas
- Crie loops abertos que só se fecham com a compra
- Aplique o princípio da reciprocidade em cada parágrafo
- Termine SEMPRE com urgência + facilidade de ação

## FÓRMULAS ESPECÍFICAS POR PÚBLICO ##
${getAudienceSpecificTactics(targetAudience)}

## CHECKLIST FINAL DE CONVERSÃO ##
✓ Gancho irresistível nos primeiros 10 palavras?
✓ Problema claramente identificado e agitado?
✓ Solução apresentada como única alternativa?
✓ Prova social específica e verificável?
✓ Oferta com valor percebido alto?
✓ Escassez real e verificável?
✓ CTA específico e com urgência?
✓ Linguagem emocional + lógica de apoio?

IMPORTANTE: Escreva o texto FINAL, pronto para uso, sem explicações ou marcadores. 
O texto deve fluir naturalmente e converter na primeira leitura.
`
}

// Fórmulas específicas por tipo de copy
const getConversionFormula = (copyType: string) => {
  const formulas = {
    anúncio: `
**FÓRMULA PAS AVANÇADA:**
- **PROBLEMA**: Identifique a dor específica em 1 frase
- **AGITAÇÃO**: Intensifique as consequências (3-4 frases)  
- **SOLUÇÃO**: Apresente como única saída (2-3 frases)
- **AÇÃO**: Comando direto com urgência`,

    "email marketing": `
**FÓRMULA AIDA EMOCIONAL:**
- **ATENÇÃO**: Subject + primeira linha magnética
- **INTERESSE**: História pessoal ou caso de sucesso
- **DESEJO**: Benefícios transformacionais específicos
- **AÇÃO**: CTA com escassez temporal`,

    "post para redes sociais": `
**FÓRMULA VIRAL:**
- **GANCHO**: Primeira linha que para o scroll
- **VALOR**: Insight ou dica valiosa
- **PROVA**: Resultado ou exemplo real
- **ENGAJAMENTO**: Pergunta que gera comentários`,

    "landing page": `
**FÓRMULA LONGA DE CONVERSÃO:**
- **HEADLINE**: Promessa específica + benefício único
- **SUBHEADLINE**: Explicação da promessa
- **BULLETS**: 3-5 benefícios transformacionais
- **PROVA SOCIAL**: Depoimentos específicos
- **OFERTA**: Valor + bônus + garantia
- **ESCASSEZ**: Limitação real
- **CTA MÚLTIPLOS**: 3-5 botões estratégicos`,

    "descrição de produto": `
**FÓRMULA SENSORIAL:**
- **EXPERIÊNCIA**: Como será usar o produto
- **TRANSFORMAÇÃO**: Vida antes vs depois
- **ESPECIFICAÇÕES**: Detalhes técnicos como benefícios
- **URGÊNCIA**: Razão para comprar agora`,
  }

  return formulas[copyType as keyof typeof formulas] || formulas["anúncio"]
}

// Táticas específicas por público
const getAudienceSpecificTactics = (audience: string) => {
  if (audience.toLowerCase().includes("empresário") || audience.toLowerCase().includes("empreendedor")) {
    return `
**TÁTICAS PARA EMPREENDEDORES:**
- Foque em ROI e resultados mensuráveis
- Use linguagem de negócios e métricas
- Enfatize economia de tempo e eficiência
- Mencione escalabilidade e crescimento`
  }

  if (audience.toLowerCase().includes("jovem") || audience.toLowerCase().includes("millennials")) {
    return `
**TÁTICAS PARA JOVENS:**
- Use linguagem descontraída e atual
- Foque em experiências e lifestyle
- Enfatize praticidade e conveniência
- Mencione tendências e inovação`
  }

  return `
**TÁTICAS UNIVERSAIS:**
- Identifique a principal dor do público
- Use linguagem que eles usariam
- Foque nos benefícios mais desejados
- Crie senso de comunidade e pertencimento`
}

// Prompts específicos para diferentes tipos de copy
export const getSpecializedPrompt = (copyType: string) => {
  const specializedPrompts = {
    anúncio: `
**DIRETRIZES PARA ANÚNCIOS DE ALTA CONVERSÃO:**
- Primeira frase deve parar o leitor instantaneamente
- Use números específicos e estatísticas impactantes  
- Inclua pelo menos 2 elementos de prova social
- Termine com CTA que cria FOMO (Fear of Missing Out)
- Máximo 3 frases por parágrafo para facilitar leitura
- Use palavras de poder: "Descoberto", "Revelado", "Finalmente"`,

    "email marketing": `
**DIRETRIZES PARA EMAILS QUE VENDEM:**
- Subject line com curiosidade + benefício específico
- Primeira linha continua a curiosidade do subject
- Use storytelling pessoal para criar conexão
- Inclua PS com oferta especial ou urgência adicional
- Evite palavras que ativam filtros de spam
- Crie senso de exclusividade para o leitor`,

    "post para redes sociais": `
**DIRETRIZES PARA POSTS VIRAIS:**
- Primeira linha deve funcionar como "pattern interrupt"
- Use emojis estratégicos para quebrar texto
- Inclua pergunta no final para gerar engajamento
- Máximo 2200 caracteres para otimizar alcance
- Use hashtags relevantes mas não exagere
- Crie call-to-action para comentar ou compartilhar`,

    "landing page": `
**DIRETRIZES PARA LANDING PAGES QUE CONVERTEM:**
- Headline com promessa específica e prazo
- Use bullets com benefícios emocionais + lógicos
- Inclua seção de objeções com respostas
- Múltiplos CTAs ao longo da página
- Depoimentos com foto, nome e resultado específico
- Garantia forte que remove risco da compra
- Seção de FAQ antecipando dúvidas comuns`,

    "descrição de produto": `
**DIRETRIZES PARA DESCRIÇÕES QUE VENDEM:**
- Comece com o principal benefício emocional
- Use linguagem sensorial (toque, visão, som)
- Inclua especificações técnicas como vantagens
- Mencione para quem NÃO é recomendado (exclusividade)
- Use bullets para facilitar escaneamento
- Termine com urgência ou escassez genuína`,
  }

  return specializedPrompts[copyType as keyof typeof specializedPrompts] || specializedPrompts["anúncio"]
}
