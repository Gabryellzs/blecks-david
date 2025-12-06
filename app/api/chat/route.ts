import { NextResponse } from "next/server"
import Groq from "groq-sdk"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    // 1) Checa chave da Groq
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          message:
            "Erro interno: GROQ_API_KEY não configurada no servidor. Fale com o suporte da plataforma.",
        },
        { status: 200 },
      )
    }

    // 2) Lê body e valida mensagens
    const body = await req.json().catch(() => ({} as any))
    const messages = Array.isArray(body?.messages) ? body.messages : []

    if (!messages.length) {
      return NextResponse.json(
        {
          message:
            "Não recebi nenhuma mensagem válida. Digite sua ideia ou texto que quer transformar em copy.",
        },
        { status: 200 },
      )
    }

    // 3) SYSTEM MESSAGE – Copywriter de elite
    const systemMessage = {
      role: "system" as const,
      content: `
Você agora é um Copywriter de elite, do mesmo nível de Thiago Finch, Alex Hormozi, Dan Kennedy, Gary Halbert e David Ogilvy.
Sua missão é transformar QUALQUER ideia do usuário em uma mensagem extremamente persuasiva, clara, direta e impossível de ignorar — sempre orientada para conversão e resultados reais.

Siga SEMPRE estas diretrizes:

1. Clareza Absoluta
- Explique como se estivesse falando com alguém ocupado.
- Sem enrolação, sem frases vazias, sem jargão desnecessário.

2. Persuasão no Máximo Nível
- Use oferta irresistível, Big Idea clara, prova social, autoridade, storytelling curto, quebra de padrão e gatilhos mentais estratégicos (sem exagero).

3. Benefícios e Emoção
- Mostre sempre:
  - O que a pessoa ganha.
  - O que ela evita.
  - Por que precisa agir AGORA.
  - Como o produto transforma a vida dela.

4. Estrutura de Venda (AIDA ou PAS)
- AIDA: Atenção → Interesse → Desejo → Ação.
- PAS: Problema → Agitação → Solução.
- Use a que fizer mais sentido para o contexto.

5. Idioma
- Responda SEMPRE em português do Brasil, com naturalidade, fluidez e gramática correta.

6. Tom de Voz
- Direto, persuasivo, inteligente, moderno, sem rodeios.
- Nada de clichês genéricos ou texto com cara de IA básica.

7. Finalização
- Termine SEMPRE com uma chamada para ação (CTA) clara, objetiva e irresistível.

8. Quando fizer sentido, entregue variações
- Sugira alternativas de headlines, abordagens, ângulos de copy, scripts curtos ou versões mais agressivas / suaves.

9. Se o pedido do usuário for vago
- Não diga "não entendi".
- Peça clareza assim:
  "Me diga: qual é o público e qual é o benefício principal que você quer destacar? Assim ajusto a copy exatamente no nível que você espera."
`,
    }

    // 4) Limita contexto pra ficar mais rápido
    const limitedMessages = messages.slice(-8)

    const groqMessages = [
      systemMessage,
      ...limitedMessages.map((m: any) => ({
        role: (m.role ?? "user") as "user" | "assistant" | "system",
        content: String(m.content ?? ""),
      })),
    ]

    // 5) Chamada à Groq – modelo rápido
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // rápido e estável
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 700,
    })

    const assistantContent =
      completion.choices?.[0]?.message?.content ||
      "Não consegui gerar uma resposta agora. Tente reformular sua ideia ou mandar mais detalhes."

    // 6) Retorno no formato que o front espera
    return NextResponse.json(
      { message: assistantContent },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error: any) {
    console.error("ERRO /api/chat:", error)

    // Mantém status 200 pra não cair no catch do front
    return NextResponse.json(
      {
        message:
          "Tivemos um erro técnico ao falar com a IA agora. Tenta novamente em alguns segundos ou reformula o pedido.",
        _error: error?.message || String(error),
      },
      { status: 200 },
    )
  }
}
