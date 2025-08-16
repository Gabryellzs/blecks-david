import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function generateCopyText(prompt: string, options?: { temperature?: number; maxTokens?: number }) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("API key da OpenAI não configurada")
    }

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt,
      system: "Você é um especialista em copywriting e marketing digital.",
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 800,
    })

    return text
  } catch (error: any) {
    console.error("Erro ao gerar texto:", error)
    throw new Error(`Falha ao gerar texto: ${error.message}`)
  }
}
