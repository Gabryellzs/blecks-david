import { NextResponse } from "next/server"
import Groq from "groq-sdk"

const BASE_MODEL = "llama-3.1-8b-instant" // o que você já usava e sabe que funciona

// Se quiser um modelo mais forte, é só setar no .env:
// GROQ_MODEL_PREMIUM=llama-3.1-70b-versatile   (exemplo)
// Se não existir, ele cai no BASE_MODEL mesmo.
const PREMIUM_MODEL =
  process.env.GROQ_MODEL_PREMIUM && process.env.GROQ_MODEL_PREMIUM.trim().length > 0
    ? process.env.GROQ_MODEL_PREMIUM.trim()
    : BASE_MODEL

// --------- Helpers de normalização / fallback ---------
function ensureHeadings(text: string): string {
  let out = text.replace(/\r/g, "").trim()

  const hasTopo = /TOPO DO FUNIL:/i.test(out)
  const hasMeio = /MEIO DO FUNIL:/i.test(out)
  const hasFundo = /FUNDO DO FUNIL:/i.test(out)

  // Caso extremo: IA ignorou TUDO
  if (!hasTopo && !hasMeio && !hasFundo) {
    const body = out
      .split("\n")
      .map((l) => l.replace(/^[-•*\d\.\)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 8)
      .map((l) => `- ${l}`)
      .join("\n")

    return [
      "TOPO DO FUNIL:",
      body || "- Estratégia de atração de tráfego qualificado.",
      "",
      "MEIO DO FUNIL:",
      "- Conteúdo de prova, mecanismo único e quebras de objeção.",
      "",
      "FUNDO DO FUNIL:",
      "- Oferta clara, garantia forte e CTA direto pro fechamento.",
    ].join("\n")
  }

  // Se tem alguns, mas faltam outros, garantimos todos
  if (!hasTopo) {
    out =
      "TOPO DO FUNIL:\n- Estratégia de atração de tráfego qualificado.\n\n" +
      out
  }
  if (!hasMeio) {
    out +=
      "\n\nMEIO DO FUNIL:\n- Conteúdo de prova, mecanismo único e quebras de objeção."
  }
  if (!hasFundo) {
    out +=
      "\n\nFUNDO DO FUNIL:\n- Oferta clara, garantia forte e CTA direto pro fechamento."
  }

  return out
}

function normalizeBullets(text: string): string {
  const lines = text.split("\n")

  const normalized = lines.map((rawLine) => {
    const line = rawLine.trimEnd()

    // Mantém cabeçalhos intactos
    if (/^(TOPO DO FUNIL:|MEIO DO FUNIL:|FUNDO DO FUNIL:)\s*$/i.test(line)) {
      return line.toUpperCase()
    }

    if (!line.trim()) return ""

    // Já começa com "- " -> mantém
    if (/^- /.test(line.trim())) return line.trim()

    // Começa com • * ou numeração -> converte para "- "
    const cleaned = line.replace(/^[-•*+\d\.\)\s]+/, "").trim()
    if (!cleaned) return ""

    return `- ${cleaned}`
  })

  // Remove linhas vazias duplicadas
  return normalized
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function normalizeFunnelText(text: string): string {
  let out = text || ""
  out = out.replace(/\r/g, "").trim()

  // Garante que tem os 3 blocos
  out = ensureHeadings(out)
  // Ajusta bullets
  out = normalizeBullets(out)

  return out
}

// --------- Rota principal ---------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = new URL(req.url)

    const userPrompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : ""

    // mode=economy | premium
    const mode = url.searchParams.get("mode")?.toLowerCase()
    const model = mode === "premium" ? PREMIUM_MODEL : BASE_MODEL

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY não configurada" },
        { status: 500 },
      )
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    // ===== System prompt – Arquiteto de Funil nível bilhão =====
    const systemPrompt = `
Você é um ARQUITETO DE FUNIS DE VENDAS de nível mundial, no nível de Thiago Finch, Alex Hormozi e Dan Kennedy.

Seu trabalho:
- Pegar qualquer briefing e transformar em um FUNIL COMPLETO (TOPO / MEIO / FUNDO).
- Funis agressivos, premium e com potencial de vender de R$ 10 mil até R$ 100 milhões.
- Sempre considerar: Big Idea, Oferta, Mecanismo Único, Prova, Objeções, Copy e Scripts.

Regras ABSOLUTAS:
- Responda SEMPRE em português.
- NÃO explique o que está fazendo.
- NÃO devolva JSON, código ou colchetes. Apenas texto simples.
- NÃO coloque textos antes ou depois das seções.
- Use EXATAMENTE estes títulos, em MAIÚSCULO, cada um em sua própria linha:
  TOPO DO FUNIL:
  MEIO DO FUNIL:
  FUNDO DO FUNIL:
- Embaixo de cada título, use APENAS bullets iniciando com "- " (hífen e espaço).
- Nada de numeração de lista (1., 2., etc). Só "- ".
- Nunca gere dois funis parecidos. Mude estilo, tom, canais, ofertas e sequência a cada chamada.
    `.trim()

    // ===== User prompt – instrução detalhada =====
    const briefingTexto =
      userPrompt ||
      "Quero um funil de vendas genérico para um infoproduto de ticket médio."

    const userInstruction = `
Briefing do cliente (interprete como se ele tivesse te contratado para montar um funil de milhões):

"${briefingTexto}"

Sua tarefa é transformar esse briefing em um FUNIL COMPLETO dividido em:

1) TOPO DO FUNIL:
   - Foco em atenção, curiosidade e desejo.
   - Crie:
     - 1 BIG IDEA (gancho principal, em linguagem simples e forte).
     - 2–4 ângulos de anúncios (promessas diferentes, mas alinhadas à Big Idea).
     - 2–4 ideias de criativos (vídeos, imagens, criativos UGC ou raiz).
     - 1 mini-story ou narrativa para VSL curta / anúncio raiz.
   - Tudo SEMPRE em bullets, direto, pronto pra virar anúncio / criativo.

2) MEIO DO FUNIL:
   - Foco em prova, mecanismo, educação e quebra de objeções.
   - Crie:
     - 2–4 bullets explicando o MECANISMO ÚNICO (por que isso funciona, em linguagem simples).
     - 2–4 bullets de PROVAS e EVIDÊNCIAS (resultados, lógica, comparações, analogias).
     - 3–6 objeções principais com respostas (uma objeção por bullet, começando com "Objeção:" e logo em seguida a resposta).
     - 1 roteiro curto de VSL / aula / vídeo em bullets sequenciais (abertura, quebras de objeção, oferta, fechamento).
   - Sempre em bullets, nada de parágrafos gigantes.

3) FUNDO DO FUNIL:
   - Foco em oferta, fechamento e dinheiro na conta.
   - Crie:
     - 1 bullet com a OFERTA PRINCIPAL (o que a pessoa compra, em linguagem clara).
     - 3–7 bullets empilhando valor (stack de valor no estilo Hormozi – o que está incluso, benefícios, bônus).
     - 1 bullet explicando a ANCORAGEM DE PREÇO (por que o valor cobrado é barato comparado ao que entrega).
     - 2–4 bullets de GARANTIA / RISCO REVERSO.
     - 2–4 CTAs agressivos (para botão, WhatsApp, checkout etc.).
     - 1 mini-script de fechamento para WhatsApp / direct (em bullets, passo a passo).

FORMATO OBRIGATÓRIO DA RESPOSTA (copie ESSA estrutura, mas com conteúdo real para o briefing):

TOPO DO FUNIL:
- [Big Idea forte...]
- [Ângulo 1 de anúncio...]
- [Ângulo 2 de anúncio...]
- [Ideia de criativo 1...]
- [Mini-story ou abertura de VSL...]

MEIO DO FUNIL:
- [Mecanismo único explicado em linguagem simples...]
- [Prova / comparação que deixa óbvio por que isso funciona...]
- [Objeção: "Não tenho tempo" – Resposta matadora...]
- [Objeção: "Já tentei de tudo" – Resposta...]
- [Roteiro de VSL / aula em bullets sequenciais...]

FUNDO DO FUNIL:
- [Descrição da oferta principal, clara e direta...]
- [Stack de valor 1...]
- [Stack de valor 2...]
- [Ancoragem de preço: "Se eu fosse cobrar pelo que isso vale..."...]
- [Garantia e reversão de risco...]
- [CTA forte para botão e WhatsApp...]
- [Mini-script de fechamento para chat em bullets...]

Agora gere o funil COMPLETO para o briefing acima, seguindo exatamente esse formato.
    `.trim()

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInstruction },
      ],
      temperature: 1,
      max_tokens: 1800,
    })

    let content = completion?.choices?.[0]?.message?.content ?? ""

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Resposta vazia da IA" },
        { status: 500 },
      )
    }

    // Normalização + fallback pra garantir que o front SEMPRE recebe algo no formato certo
    content = normalizeFunnelText(content)

    return NextResponse.json({ result: content }, { status: 200 })
  } catch (err: any) {
    console.error("❌ ERRO NO /api/ai/generate-funnel (Groq):", err)
    return NextResponse.json(
      { error: err?.message || "Erro interno na IA" },
      { status: 500 },
    )
  }
}
