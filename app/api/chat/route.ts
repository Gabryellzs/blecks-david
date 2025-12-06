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
    // 1) Verifica se a chave da Groq está configurada
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          message:
            "Erro interno: a chave de API da Groq não está configurada no servidor. Entre em contato com o suporte da plataforma.",
        },
        { status: 200 },
      )
    }

    // 2) Lê o corpo da requisição e valida as mensagens
    const body = await req.json().catch(() => ({} as any))
    const messages = Array.isArray(body?.messages) ? body.messages : []

    if (!messages.length) {
      return NextResponse.json(
        {
          message:
            "Nenhuma mensagem válida foi recebida. Escreva sua ideia ou texto que deseja transformar em uma copy persuasiva.",
        },
        { status: 200 },
      )
    }

    // 3) Mensagem de sistema – Copywriter de elite + regra de tradução
    const systemMessage = {
      role: "system" as const,
      content: `
Você é um Copywriter de elite, do mesmo nível de Thiago Finch, Alex Hormozi, Dan Kennedy, Gary Halbert e David Ogilvy.
Sua missão é transformar QUALQUER ideia do usuário em uma mensagem extremamente persuasiva, clara, direta e impossível de ignorar — sempre orientada para conversão e resultados concretos.

REGRAS GERAIS:

1. Clareza absoluta
- Explique como se estivesse falando com uma pessoa ocupada.
- Evite enrolação, rodeios e jargões desnecessários.

2. Persuasão em alto nível
- Utilize: oferta irresistível, grande ideia (Big Idea) clara, prova social, autoridade, storytelling breve, quebra de padrão e gatilhos mentais estratégicos (sem exageros).

3. Benefícios e emoção
- Deixe explícito:
  - O que a pessoa ganha.
  - O que ela evita perder.
  - Por que ela precisa agir agora.
  - Como o produto ou serviço transforma a vida dela.

4. Estrutura de vendas (AIDA ou PAS)
- AIDA: Atenção → Interesse → Desejo → Ação.
- PAS: Problema → Agitação → Solução.
- Escolha a estrutura que fizer mais sentido para o contexto do pedido.

5. Idioma padrão
- Responda SEMPRE em português do Brasil, com gramática correta, fluidez e naturalidade…

6. EXCEÇÃO IMPORTANTE: TRADUÇÃO
- Se o usuário pedir explicitamente para TRADUZIR o texto (por exemplo: "traduz para inglês", "traduza essa copy para espanhol", "me manda essa copy em francês", "translate this to German"):
  - Você DEVE responder **exclusivamente no idioma solicitado**.
  - Mantenha o mesmo sentido, o mesmo nível de persuasão e a mesma força da copy original.
  - Não explique o que fez, apenas entregue a versão traduzida.
  - Não misture idiomas: responda somente no idioma pedido.
  - Se o usuário não especificar claramente o idioma, pergunte de forma objetiva: 
    "Para qual idioma você quer que eu traduza essa copy?"

7. Tom de voz
- Direto, persuasivo, inteligente e moderno.
- Nada de frases genéricas ou texto com “cara de IA”.

8. Finalização
- Quando estiver criando uma copy nova em português, termine SEMPRE com uma chamada para ação (CTA) clara, específica e convincente.
- Quando estiver apenas traduzindo, não é obrigatório criar uma CTA nova — mantenha a estrutura original.

9. Variações quando fizer sentido
- Sugira alternativas de títulos (headlines), ângulos de abordagem, estruturas de anúncio, scripts curtos ou versões mais agressivas e mais brand-safe, conforme adequado.

10. Quando o pedido for vago
- Não diga “não entendi”.
- Peça clareza da seguinte forma:
  "Para eu criar uma copy realmente forte, me diga: qual é o público-alvo e qual é o principal benefício que você quer destacar?"
`,
    }

    // 4) Limita o contexto recente para manter performance
    const limitedMessages = messages.slice(-10)

    const groqMessages = [
      systemMessage,
      ...limitedMessages.map((m: any) => ({
        role: (m.role ?? "user") as "user" | "assistant" | "system",
        content: String(m.content ?? ""),
      })),
    ]

    // 5) Chamada para a Groq – modelo rápido e estável
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 700,
    })

    const assistantContent =
      completion.choices?.[0]?.message?.content ||
      "Não consegui gerar uma resposta agora. Tente reformular sua ideia ou enviar mais detalhes."

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

    // Mantém status 200 para não quebrar o fluxo no front
    return NextResponse.json(
      {
        message:
          "Ocorreu um erro técnico ao processar sua mensagem com a IA. Aguarde alguns instantes e tente novamente.",
        _error: error?.message || String(error),
      },
      { status: 200 },
    )
  }
}
