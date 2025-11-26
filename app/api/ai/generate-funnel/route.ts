import { NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const userPrompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : ""

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY não configurada" },
        { status: 500 },
      )
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    // PROMPT MAIS FORTE E VARIADO
    const systemPrompt = `
Você é um especialista em funis, copywriting e vendas.

REGRAS IMPORTANTES:
- Responda SEMPRE em português.
- NUNCA devolva JSON, código ou colchetes. Apenas texto simples.
- Estruture SEMPRE em três blocos, exatamente nestas palavras:
  TOPO DO FUNIL:
  MEIO DO FUNIL:
  FUNDO DO FUNIL:
- Em cada bloco, gere de 3 a 6 bullets (•) descrevendo etapas/ações do funil.
- Cada etapa deve dizer qual página/canal/ação/oferta é usada.
- Use o contexto do usuário para criar um funil novo a cada chamada.
- Mesmo que o pedido seja parecido com outro, mude canais, ângulos, nomes e sequência.
    `.trim()

    const finalUserPrompt = userPrompt
      ? `
Contexto do funil do usuário:
${userPrompt}

Agora crie UM funil de vendas COMPLETO seguindo as regras acima.
      `.trim()
      : `
Crie um funil de vendas genérico para um infoproduto de ticket médio,
seguindo as regras acima.
      `.trim()

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // mesmo modelo que já funcionava
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: finalUserPrompt },
      ],
      temperature: 1,      // mais variação
      max_tokens: 1500,
    })

    const content =
      completion?.choices?.[0]?.message?.content ?? ""

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Resposta vazia da IA" },
        { status: 500 },
      )
    }

    // O front espera { result: string }
    return NextResponse.json({ result: content }, { status: 200 })
  } catch (err: any) {
    console.error("❌ ERRO NO /api/ai/generate-funnel (Groq):", err)
    return NextResponse.json(
      { error: err?.message || "Erro interno na IA" },
      { status: 500 },
    )
  }
}
