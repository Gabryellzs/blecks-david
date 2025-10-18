import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getEnhancedPrompt, getSpecializedPrompt } from "@/lib/copy-prompts"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    // Verificar se a chave da API está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "API key da OpenAI não configurada no servidor" }, { status: 500 })
    }

    // Extrair os dados do corpo da requisição
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: "Formato de requisição inválido" }, { status: 400 })
    }

    const { copyType, tone, productInfo, targetAudience, length } = body || {}

    // Validar os dados de entrada
    if (!copyType || !tone || !productInfo || !targetAudience || !length) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Obter o prompt principal e especializado
    const mainPrompt = getEnhancedPrompt(copyType, tone, productInfo, targetAudience, length)
    const specializedPrompt = getSpecializedPrompt(copyType)

    // Combinar os prompts
    const fullPrompt = `${mainPrompt}

DIRETRIZES ADICIONAIS ESPECÍFICAS:
${specializedPrompt}

PRODUTO/SERVIÇO DETALHADO: ${productInfo}
PÚBLICO-ALVO ESPECÍFICO: ${targetAudience}

Agora crie o texto final seguindo TODAS as diretrizes acima. O texto deve ser persuasivo, específico e pronto para converter.`

    // Configurar tokens com base no comprimento
    const maxTokens = length === "short" ? 600 : length === "medium" ? 1200 : 2000

    try {
      // Usar o AI SDK para gerar o texto
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: fullPrompt,
        system: `Você é David Ogilvy reencarnado - o maior copywriter da história. Você criou campanhas que venderam bilhões. 
        
        Suas características:
        - Escreve com precisão cirúrgica
        - Cada palavra tem propósito de venda
        - Combina psicologia + persuasão + dados
        - Nunca usa clichês ou frases vazias
        - Foca obsessivamente em resultados
        - Escreve em português brasileiro fluente
        
        Sua missão: Criar copy que VENDE, não apenas informa.`,
        temperature: 0.8,
        maxTokens: maxTokens,
      })

      // Retornar o resultado
      return NextResponse.json({ text: text || "Não foi possível gerar o texto." })
    } catch (aiError: any) {
      console.error("Erro na geração de texto:", aiError)
      return NextResponse.json({ error: `Erro ao gerar texto: ${aiError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Erro ao processar a requisição:", error)
    return NextResponse.json({ error: `Erro ao processar a requisição: ${error.message}` }, { status: 500 })
  }
}
