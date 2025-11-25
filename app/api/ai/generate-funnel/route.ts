import { NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const userPrompt =
      body?.prompt ||
      "Gere um funil de vendas simples em formato de tópicos (Topo, Meio e Fundo de Funil)."

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY não configurada" },
        { status: 500 }
      )
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const systemPrompt = `
Você é um especialista em funis, copywriting e vendas.
Responda SEMPRE em português, de forma bem organizada:
- Dividir em TOPO, MEIO e FUNDO de funil
- Usar tópicos claros
- Ser direto e prático
    `.trim()

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    // 🔥 AQUI ESTÁ A PARTE QUE RESOLVE O TEU ERRO
    const result =
      completion?.choices?.[0]?.message?.content ??
      "Não foi possível gerar o funil no momento."

    return NextResponse.json({ result }, { status: 200 })
  } catch (err: any) {
    console.error("❌ ERRO NO /api/ai/generate-funnel (Groq):", err)
    return NextResponse.json(
      { error: err?.message || "Erro interno" },
      { status: 500 }
    )
  }
}
