import { generateText as aiGenerateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function generateText(
  prompt: string,
  options?: {
    temperature?: number
    maxTokens?: number
    system?: string
  },
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { text: null, error: "API key da OpenAI não configurada" }
    }

    const { text } = await aiGenerateText({
      model: openai("gpt-3.5-turbo"),
      prompt,
      system: options?.system || "Você é um assistente útil e especializado.",
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 800,
    })

    return { text, error: null }
  } catch (error: any) {
    console.error("Erro ao gerar texto:", error)
    return { text: null, error: error.message }
  }
}
