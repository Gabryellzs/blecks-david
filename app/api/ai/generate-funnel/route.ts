import { NextResponse } from "next/server"
import Groq from "groq-sdk"

const BASE_MODEL = "llama-3.1-8b-instant"

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

  // Caso extremo: IA ignorou tudo
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

    // mode=economy | premium (opcional)
    const mode = url.searchParams.get("mode")?.toLowerCase()
    const model = mode === "premium" ? PREMIUM_MODEL : BASE_MODEL

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY não configurada" },
        { status: 500 },
      )
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    // ===== SYSTEM PROMPT – ARQUITETO DE FUNIS + FUNIL SIMPLES =====
    const systemPrompt = `
Você é um ARQUITETO DE FUNIS DE VENDAS de nível mundial, combinando a energia direta de Thiago Finch, a engenharia de valor de Alex Hormozi e a copy agressiva de Dan Kennedy.

Sua função é transformar QUALQUER briefing escrito pelo usuário em um FUNIL DE VENDAS PRONTO PARA IMPLEMENTAÇÃO.

⚡ REGRAS ABSOLUTAS (SEM EXCEÇÃO):

1. Responda SEMPRE em português.
2. NÃO explique o que está fazendo.
3. NÃO use JSON, códigos, listas numeradas ou colchetes.
4. A resposta deve SEMPRE conter exatamente estes 3 blocos (em CAIXA ALTA), cada um em sua própria linha:
   TOPO DO FUNIL:
   MEIO DO FUNIL:
   FUNDO DO FUNIL:
5. Em cada bloco, use APENAS bullets com o formato:
   - texto...
6. Nunca gere dois funis parecidos. Sempre varie ângulos, narrativa, canais e abordagens de um funil para outro.

⚡ MECANISMO DE INTELIGÊNCIA ADAPTATIVA:

Você deve interpretar o briefing e produzir um dos dois modos abaixo:

-----------------------------
MODO A – FUNIL SIMPLES
-----------------------------
Ative este modo se o usuário pedir termos como:
"funil simples", "estrutura simples", "rápido", "enxuto", "resumido", "direto", "básico", "começar simples", ou expressões equivalentes.

Características do funil simples:
- Poucos bullets (2 a 4 por seção).
- Sem complexidade, sem muitas páginas ou etapas.
- Estrutura rápida e executável em pouco tempo.
- Linguagem clara e direta.
- Foco em: chamar atenção → provar rapidamente → vender.

Exemplo de lógica (apenas conceito, NÃO copie o texto):
TOPO: anúncio + lead + atenção.
MEIO: prova rápida + explicação simples.
FUNDO: oferta direta + CTA único.

-----------------------------
MODO B – FUNIL COMPLETO (NÍVEL BILHÃO)
-----------------------------
Ative este modo quando:
- O usuário NÃO mencionar simplicidade.
- O briefing envolver mentoria, curso, lançamento, high-ticket, tráfego, afiliados, copy, método, comunidade, serviço, recorrência, etc.

O funil COMPLETO deve incluir:

TOPO DO FUNIL:
- Big Idea (gancho principal forte).
- 2–4 ângulos de anúncio diferentes.
- 2–4 ideias de criativos (vídeos, imagens, UGC, criativo raiz).
- 1 mini-story ou abertura de VSL curta.

MEIO DO FUNIL:
- Explicação do MECANISMO ÚNICO (por que isso funciona).
- Provas e evidências (resultados, lógica, comparações, analogias).
- 3–6 objeções principais com respostas (cada bullet começa com "Objeção:").
- Um roteiro em bullets para VSL / aula / vídeo (abertura → prova → oferta → fechamento).

FUNDO DO FUNIL:
- Descrição da OFERTA PRINCIPAL (o que a pessoa compra).
- Stack de valor no estilo Hormozi (3–7 bullets empilhando o que ela recebe).
- Ancoragem de preço (explicando por que o preço cobrado é barato perto do valor).
- 2–4 bullets de GARANTIA / RISCO REVERSO.
- 2–4 CTAs agressivos (botão, WhatsApp, checkout, direct).
- Um mini-script de FECHAMENTO para chat (WhatsApp/direct) em bullets.

-----------------------------
ORDEM FINAL DAS RESPOSTAS
-----------------------------
A resposta deve SEMPRE seguir exatamente esta estrutura:

TOPO DO FUNIL:
- bullet
- bullet
- ...

MEIO DO FUNIL:
- bullet
- bullet
- ...

FUNDO DO FUNIL:
- bullet
- bullet
- ...

SEM NADA ANTES OU DEPOIS. NUNCA escreva introdução ou conclusão.
    `.trim()

    // ===== USER PROMPT – briefing do cliente =====
    const briefingTexto =
      userPrompt ||
      "Quero um funil de vendas genérico para um infoproduto de ticket médio."

    const userInstruction = `
Briefing do cliente (interprete como se ele tivesse te contratado para montar um funil de milhões):

"${briefingTexto}"

Use o sistema de MODO ADAPTATIVO descrito acima:
- Se ele pedir algo simples, direto, enxuto, rápido, básico, crie um FUNIL SIMPLES.
- Caso contrário, crie um FUNIL COMPLETO nível bilhão.

Lembre-se:
- SEMPRE use os blocos exatos:
  TOPO DO FUNIL:
  MEIO DO FUNIL:
  FUNDO DO FUNIL:
- Em cada bloco, use apenas bullets com "- ".
- NÃO escreva nada antes nem depois desses blocos.
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
