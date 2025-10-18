import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    // Verificar se a chave da API está configurada
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API key do Groq não configurada no servidor" }, { status: 500 })
    }

    const { messages } = await req.json()

    // Validar os dados de entrada
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 })
    }

    // Adicionar instruções de sistema para copywriting
    const systemMessage = {
      role: "system",
      content: `Você é um especialista em copywriting e marketing digital com mais de 10 anos de experiência.
      Sua missão é ajudar o usuário a criar textos persuasivos, envolventes e de alta conversão para diversas finalidades de marketing.
      
      Siga estas diretrizes para garantir a máxima qualidade:
      1. **Foco na Persuasão:** Sempre busque persuadir e motivar o público-alvo.
      2. **Clareza e Concisão:** Escreva de forma direta, eliminando redundâncias e jargões desnecessários.
      3. **Benefícios, não Características:** Destaque os benefícios e a transformação que o produto/serviço oferece.
      4. **Gatilhos Mentais:** Utilize estrategicamente gatilhos como escassez, urgência, prova social, autoridade e reciprocidade.
      5. **Chamada para Ação (CTA) Clara:** Sempre finalize com uma CTA forte, específica e irresistível.
      6. **Tom de Voz Adequado:** Adapte o tom de voz ao contexto e ao público-alvo (ex: formal, informal, inspirador, direto).
      7. **Linguagem Emocional:** Conecte-se emocionalmente com o leitor, usando linguagem que ressoe com seus desejos e dores.
      8. **Estrutura Lógica:** Organize o conteúdo de forma fluida e lógica, utilizando estruturas como AIDA (Atenção, Interesse, Desejo, Ação) ou PAS (Problema, Agitação, Solução).
      9. **Originalidade:** Evite clichês e frases genéricas. Busque sempre a originalidade e a criatividade.
      10. **Português do Brasil:** Responda sempre em português do Brasil, com gramática impecável e ortografia correta.
      
      Forneça sugestões específicas, exemplos práticos e melhorias detalhadas para os textos do usuário. Seja criativo, estratégico e focado em resultados.`,
    }

    const allMessages = [systemMessage, ...messages]

    // Fazer a chamada direta para a API do Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        // Adicionar cabeçalhos para evitar cache
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Modelo mais leve
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    // Verificar se a resposta é um erro HTTP
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na API do Groq:", errorText)
      return NextResponse.json(
        { error: `Erro na API do Groq: ${response.status} ${response.statusText}` },
        { status: 500 },
      )
    }

    // Parsear a resposta
    const data = await response.json()

    // Extrair o texto gerado
    const assistantMessage = data.choices?.[0]?.message?.content || "Não foi possível gerar uma resposta."

    // Retornar o resultado com cabeçalhos para evitar cache
    return new NextResponse(JSON.stringify({ message: assistantMessage }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error: any) {
    console.error("Erro ao processar a requisição:", error)
    return NextResponse.json({ error: `Erro ao processar a requisição: ${error.message}` }, { status: 500 })
  }
}
