import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getEnhancedPrompt, getSpecializedPrompt } from "@/lib/copy-prompts"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response("API key da OpenAI não configurada", { status: 500 })
    }

    const body = await request.json()
    const { copyType, tone, productInfo, targetAudience, length } = body

    if (!copyType || !tone || !productInfo || !targetAudience || !length) {
      return new Response("Todos os campos são obrigatórios", { status: 400 })
    }

    const mainPrompt = getEnhancedPrompt(copyType, tone, productInfo, targetAudience, length)
    const specializedPrompt = getSpecializedPrompt(copyType)

    const fullPrompt = `${mainPrompt}

DIRETRIZES ADICIONAIS ESPECÍFICAS:
${specializedPrompt}

PRODUTO/SERVIÇO DETALHADO: ${productInfo}
PÚBLICO-ALVO ESPECÍFICO: ${targetAudience}

Agora crie o texto final seguindo TODAS as diretrizes acima. O texto deve ser persuasivo, específico e pronto para converter.`

    const maxTokens = length === "short" ? 600 : length === "medium" ? 1200 : 2000

    const result = await streamText({
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

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error("Erro no streaming:", error)
    return new Response(`Erro no streaming: ${error.message}`, { status: 500 })
  }
}
