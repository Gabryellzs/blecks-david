import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    // Verificar se a chave da API está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "API key da OpenAI não configurada no servidor" }, { status: 500 })
    }

    // Extrair os dados do corpo da requisição com tratamento de erro
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: "Formato de requisição inválido" }, { status: 400 })
    }

    const { prompt } = body || {}

    // Validar os dados de entrada
    if (!prompt) {
      return NextResponse.json({ error: "O prompt é obrigatório" }, { status: 400 })
    }

    try {
      // Usar o AI SDK para gerar o texto
      const { text } = await generateText({
        model: openai("gpt-3.5-turbo"),
        prompt: prompt,
        system:
          "Você é um especialista em copywriting e marketing. Seu objetivo é criar textos persuasivos e eficazes que convertam leitores em clientes.",
        temperature: 0.7,
        maxTokens: 800,
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
