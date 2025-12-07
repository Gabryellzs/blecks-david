import { NextResponse } from "next/server"
import Groq from "groq-sdk"

const BASE_MODEL = "llama-3.1-8b-instant"
const PREMIUM_MODEL =
  process.env.GROQ_MODEL_PREMIUM && process.env.GROQ_MODEL_PREMIUM.trim().length > 0
    ? process.env.GROQ_MODEL_PREMIUM.trim()
    : BASE_MODEL

/* =============== FALLBACKS & NORMALIZAÇÃO ================= */

function ensureHeadings(text: string): string {
  let out = text.replace(/\r/g, "").trim()

  const hasTopo = /TOPO DO FUNIL:/i.test(out)
  const hasMeio = /MEIO DO FUNIL:/i.test(out)
  const hasFundo = /FUNDO DO FUNIL:/i.test(out)

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
      body || "- Estratégia inicial.",
      "",
      "MEIO DO FUNIL:",
      "- Conteúdo de prova e mecanismo.",
      "",
      "FUNDO DO FUNIL:",
      "- Oferta, garantia e CTA.",
    ].join("\n")
  }

  if (!hasTopo) out = "TOPO DO FUNIL:\n- Etapa inicial.\n\n" + out
  if (!hasMeio) out += "\n\nMEIO DO FUNIL:\n- Etapa intermediária."
  if (!hasFundo) out += "\n\nFUNDO DO FUNIL:\n- Fechamento."

  return out
}

function normalizeBullets(text: string): string {
  const lines = text.split("\n")

  const normalized = lines.map((rawLine) => {
    const line = rawLine.trimEnd()

    if (/^(TOPO DO FUNIL:|MEIO DO FUNIL:|FUNDO DO FUNIL:)$/i.test(line))
      return line.toUpperCase()

    if (!line.trim()) return ""

    if (/^- /.test(line.trim())) return line.trim()

    const cleaned = line.replace(/^[-•*+\d\.\)\s]+/, "").trim()
    if (!cleaned) return ""

    return `- ${cleaned}`
  })

  return normalized.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

function normalizeFunnelText(text: string): string {
  let out = text.replace(/\r/g, "").trim()
  out = ensureHeadings(out)
  out = normalizeBullets(out)
  return out
}

/* =============== ROTA PRINCIPAL ================= */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = new URL(req.url)

    const userPrompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : ""

    const mode = url.searchParams.get("mode")?.toLowerCase()
    const model = mode === "premium" ? PREMIUM_MODEL : BASE_MODEL

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY não configurada" },
        { status: 500 }
      )
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    /* =============== SYSTEM PROMPT SUPER OTIMIZADO =============== */
    const systemPrompt = `
Você é um ARQUITETO DE FUNIS DE VENDAS de nível mundial (Thiago Finch + Alex Hormozi + Dan Kennedy).

SEU PAPEL:
- Transformar qualquer briefing em um funil dividido nas seções:
  TOPO DO FUNIL:
  MEIO DO FUNIL:
  FUNDO DO FUNIL:

- Funis completos devem conter:
  Big Idea, Ângulos, Criativos, Mecanismo Único, Provas, Objeções, Oferta,
  Stack de Valor, Garantias, CTAs e Script de Fechamento.

REGRA ESPECIAL INTELIGENTE:
- Quanto MAIS detalhado for o briefing → MAIS completo, longo e profundo deve ser o funil.
- Quanto MENOS detalhado for o briefing → gere um funil menor, resumido e direto.
- Se o usuário pedir explicitamente "funil pequeno / curto / simples", reduza para 1–3 bullets por seção.
- Nunca gere dois funis iguais. Sempre varie estilo, tom, canais, ângulos e sequência.

FORMATO ABSOLUTO:
- Responda em português.
- NUNCA use JSON, colchetes ou explicações.
- Use exatamente estes blocos:
  TOPO DO FUNIL:
  MEIO DO FUNIL:
  FUNDO DO FUNIL:
- Em cada bloco, use APENAS bullets começando com "- ".
- Nada de numeração (1., 2., etc).
- Nada fora das três seções.
`.trim()

    /* =============== USER INSTRUCTION =============== */

    const briefingTexto =
      userPrompt ||
      "Crie um funil genérico para um infoproduto de ticket médio."

    const wordCount = briefingTexto.split(/\s+/).length

    let expectedDepth = ""

    if (wordCount < 10) {
      expectedDepth = "O briefing é extremamente curto; gere um funil pequeno e direto."
    } else if (wordCount < 40) {
      expectedDepth = "Gere um funil moderado, com bullets balanceados."
    } else {
      expectedDepth =
        "O briefing é detalhado; gere um funil COMPLETO, profundo, agressivo e profissional."
    }

    const userInstruction = `
Briefing do cliente:
"${briefingTexto}"

${expectedDepth}

Siga SEMPRE o formato obrigatório:

TOPO DO FUNIL:
- [Bullets...]

MEIO DO FUNIL:
- [Bullets...]

FUNDO DO FUNIL:
- [Bullets...]

Agora gere o funil seguindo exatamente essas regras.
`.trim()

    /* =============== CHAMADA PARA A IA =============== */

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInstruction },
      ],
      temperature: 1,
      max_tokens: 2000,
    })

    let content = completion?.choices?.[0]?.message?.content ?? ""

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Resposta vazia da IA" },
        { status: 500 }
      )
    }

    /* =============== NORMALIZA E GARANTE FORMATO =============== */

    content = normalizeFunnelText(content)

    return NextResponse.json({ result: content }, { status: 200 })
  } catch (err: any) {
    console.error("❌ ERRO NA IA:", err)
    return NextResponse.json(
      { error: err?.message || "Erro interno na IA" },
      { status: 500 }
    )
  }
}
