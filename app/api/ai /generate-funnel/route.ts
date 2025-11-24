// app/api/ai/generate-funnel/route.ts

import OpenAI from "openai"
import { NextResponse } from "next/server"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    // 🔐 Garante que a chave está configurada
    if (!process.env.OPENAI_API_KEY) {
      console.error("ERRO: OPENAI_API_KEY não configurada")
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada no servidor" },
        { status: 500 },
      )
    }

    const body = await req.json()

    // 👉 aqui você escolhe o nome do campo que o front vai enviar
    const topic = body.topic || body.text

    if (!topic) {
      return NextResponse.json(
        { error: "Campo 'topic' ou 'text' é obrigatório no body" },
        { status: 400 },
      )
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é uma IA que cria mind maps em formato de texto organizado para o usuário.",
        },
        {
          role: "user",
          content: `Crie um mind map bem organizado sobre este tema: "${topic}". 
- Estruture em tópicos e subtópicos.
- Use esse formato:

TEMA: [tema]

1. [Primeiro pilar]
   1.1 [Subtópico]
   1.2 [Subtópico]

2. [Segundo pilar]
   2.1 [Subtópico]
   2.2 [Subtópico]

E assim por diante.`,
        },
      ],
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content || ""

    return NextResponse.json(
      {
        mindmap: content,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Erro na rota /api/ai/generate-funnel:", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno na IA" },
      { status: 500 },
    )
  }
}
