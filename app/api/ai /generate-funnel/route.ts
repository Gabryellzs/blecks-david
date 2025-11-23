// app/api/ai/generate-funnel/route.ts
import { NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // <-- TEM QUE SER ESSE NOME
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const prompt = body?.prompt as string | undefined

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Descrição do funil é obrigatória." },
        { status: 400 },
      )
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY não encontrada nas variáveis de ambiente")
      return NextResponse.json(
        { error: "Configuração da IA ausente no servidor." },
        { status: 500 },
      )
    }

    const systemPrompt = `
Você é um estrategista de marketing que cria funis de vendas em formato de mapa visual.
Responda SEMPRE em JSON válido, no formato:
{
  "nodes": [
    {
      "id": "string",
      "type": "pageNode" | "marketingIconNode",
      "position": { "x": number, "y": number },
      "data": {
        "label": "string",
        "description": "string opcional",
        "pageType": "landing" | "sales" | "checkout" | "thank-you" | "webinar" | "blog" | "comparison" | "affiliates" | "members" | "faq" | "about" | "contact" | "content-creation" | "marketing-analysis" | "email-marketing" | "marketing-campaign" | "social-media",
        "color": "string opcional",
        "iconId": "string opcional"
      }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "id do nó de origem",
      "target": "id do nó de destino"
    }
  ],
  "name": "Nome curto do funil"
}
NÃO explique nada, apenas retorne o JSON.
`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Descrição do funil: ${prompt}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content || ""

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      console.error("Falha ao fazer parse do JSON retornado pela IA:", err, content)
      return NextResponse.json(
        { error: "Resposta da IA veio em formato inválido." },
        { status: 500 },
      )
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("Erro no endpoint /api/ai/generate-funnel:", error)
    return NextResponse.json(
      { error: "Falha interna ao gerar funil com IA." },
      { status: 500 },
    )
  }
}
