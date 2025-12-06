import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const GRAPH = "https://graph.facebook.com/v20.0"

// 🔥 BUSCAS EM PORTUGUÊS (BR/PT)
const KEYWORD_QUERIES_PT: string[] = [
  // SAÚDE / EMAGRECIMENTO
  "curso emagrecimento online",
  "curso de emagrecimento",
  "curso para emagrecer",
  "desafio de emagrecimento",
  "desafio para emagrecer",
  "desafio 21 dias emagrecimento",
  "treino para emagrecer",
  "treino em casa emagrecimento",
  "programa de emagrecimento",
  "mentoria emagrecimento",

  // FITNESS / TREINO
  "curso treino em casa",
  "curso treino feminino",
  "treino para definicao",
  "treino hipertrofia online",
  "mentoria treino online",
  "programa de treino online",

  // DROPSHIPPING / LOJA / PF / PLR
  "curso dropshipping",
  "curso dropshipping para iniciantes",
  "curso loja virtual",
  "curso e commerce",
  "curso ecommerce",
  "curso de loja online",
  "curso shopee",
  "curso marketplace",
  "curso shopee ads",
  "curso plr",
  "curso infoproduto",
  "curso venda de infoprodutos",

  // RENDA EXTRA / BET / IGAME / VENDER CURSO
  "curso renda extra online",
  "curso de renda extra",
  "curso marketing digital renda extra",
  "curso apostas esportivas",
  "curso trader esportivo",
  "curso multiplas esportivas",
  "curso igame",
  "curso cassino online",
  "curso como vender curso online",
  "curso como vender infoproduto",
  "curso como ganhar dinheiro na internet",

  // MARKETING / TRÁFEGO / COPY / LANÇAMENTO
  "curso marketing digital do zero",
  "curso de marketing digital",
  "curso trafego pago",
  "curso de trafego pago",
  "mentoria trafego pago",
  "curso gestao de trafego",
  "curso gestor de trafego",
  "curso copywriting",
  "curso copy para redes sociais",
  "curso funil de vendas",
  "curso lancamento digital",
  "curso perpeto",
  "curso perpétuo",
  "mentoria de lancamento",
  "mentoria de marketing digital",

  // DESENVOLVIMENTO PESSOAL / PRODUTIVIDADE
  "curso desenvolvimento pessoal",
  "curso inteligencia emocional",
  "curso de produtividade",
  "curso mudanca de habitos",
  "curso mudança de hábitos",
  "curso mentalidade",
  "curso mindset",
  "mentoria desenvolvimento pessoal",

  // COMUNIDADE / GRUPO / MENTORIA CONTÍNUA
  "comunidade de alunos",
  "comunidade fechada de alunos",
  "grupo vip whatsapp marketing digital",
  "grupo vip telegram marketing digital",
  "mentoria em grupo marketing digital",
  "mentoria em grupo de vendas",

  // FORMATOS TÍPICOS DE OFERTA
  "treinamento intensivo marketing digital",
  "treinamento intensivo de vendas",
  "treinamento intensivo trafego pago",
  "imersao marketing digital",
  "imersão marketing digital",
  "imersao de vendas online",
  "workshop de marketing digital",
  "workshop de vendas online",
  "aula gratuita marketing digital",
  "aula gratuita trafego pago",
  "aula gratuita vendas online",
  "evento online marketing digital",
  "evento online de vendas",
]

// 🔥 BUSCAS EM ESPANHOL (LATAM)
const KEYWORD_QUERIES_ES: string[] = [
  // SAÚDE / EMAGRECIMENTO
  "curso para bajar de peso",
  "curso bajar de peso rapido",
  "curso dieta online",
  "curso perdida de peso",

  // RENDA EXTRA / GANHAR DINHEIRO
  "curso ganar dinero por internet",
  "curso ingresos extra",
  "curso ingresos pasivos",
  "curso dinero extra",
  "curso marketing de afiliados",
  "curso ganar dinero con marketing digital",

  // MARKETING / TRÁFEGO / VENDAS
  "curso marketing digital",
  "curso marketing digital desde cero",
  "curso trafico pago",
  "curso trafico pago para principiantes",
  "mentoria trafico pago",
  "curso embudo de ventas",
  "curso ventas online",
  "curso lanzamientos digitales",
  "mentoria marketing digital",

  // DROPSHIPPING / ECOMMERCE
  "curso dropshipping",
  "curso tienda online",
  "curso ecommerce",
  "curso tienda en linea",
  "curso tienda virtual",
  "curso infoproductos",
  "curso vender infoproductos",

  // APOSTAS / TRADER
  "curso apuestas deportivas",
  "curso trader deportivo",
  "curso trading deportivo",
]

// JUNTA TUDO
const KEYWORD_QUERIES: string[] = [
  ...KEYWORD_QUERIES_PT,
  ...KEYWORD_QUERIES_ES,
]

// mínimo padrão de anúncios ativos por grupo (page_id + palavra-chave)
const DEFAULT_MIN_ACTIVE_PER_GROUP = 4

// ----------------- helpers -----------------
function getToken(): string {
  const token = process.env.META_ACCESS_TOKEN ?? process.env.FB_USER_TOKEN_LONG
  if (!token) {
    throw new Error("META_ACCESS_TOKEN ou FB_USER_TOKEN_LONG não configurado")
  }
  return token
}

function normalizeText(text: string): string {
  if (!text) return ""
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

// ❌ COISAS QUE NÃO QUEREMOS (dorama, novela, política, etc.)
const HARD_BLOCK_KEYWORDS = [
  "dorama",
  "doramas",
  "kdrama",
  "k-drama",
  "drama coreano",
  "novela",
  "novela coreana",
  "serie",
  "série",
  "series",
  "filme",
  "pelicula",
  "cinema",
  "episodio",
  "episódio",
  "temporada",

  "eleicao",
  "eleição",
  "elecciones",
  "campanha politica",
  "campanha política",
  "campana politica",
  "presidente",
  "governo",
  "gobierno",
  "vereador",
  "prefeito",
  "alcalde",
  "deputado",
  "senador",
  "prefeitura",
  "camara municipal",

  "jornal",
  "noticia",
  "notícia",
  "noticias",
  "notícias",
  "noticias de hoy",
  "podcast",
  "podcaster",
  "entrevista exclusiva",
]

// ✅ COISAS TÍPICAS DE INFOPRODUTO (PT + ES)
const INFO_KEYWORDS = [
  // PT
  "curso",
  "mentoria",
  "treinamento",
  "desafio",
  "programa",
  "comunidade",
  "grupo vip",
  "imersao",
  "imersão",
  "workshop",
  "bootcamp",
  "formacao",
  "formação",
  "aula",
  "evento",
  "turma",
  "vagas",
  "lista de espera",
  "renda extra",
  "marketing digital",
  "trafego pago",
  "tráfego pago",
  "gestor de trafego",
  "copywriting",
  "funil de vendas",
  "lancamento digital",
  "lançamento digital",
  "perpetuo",
  "perpétuo",
  "infoproduto",
  "infoprodutos",
  "emagrecimento",
  "emagrecer",
  "perda de peso",
  "treino",
  "saude",
  "saúde",
  "fitness",
  "desenvolvimento pessoal",
  "produtividade",
  "mentalidade",
  "mindset",

  // ES
  "curso online",
  "curso digital",
  "mentoria",
  "programa",
  "comunidad",
  "grupo vip",
  "ingresos extra",
  "ingreso extra",
  "ingresos pasivos",
  "ganar dinero",
  "ganar dinero por internet",
  "marketing digital",
  "trafico pago",
  "embudo de ventas",
  "infoproducto",
  "infoproductos",
  "curso ecommerce",
  "curso tienda online",
  "curso tienda en linea",
  "curso apuestas deportivas",
  "curso trader deportivo",
]

function buildAdText(ad: any): string {
  return normalizeText(
    [ad.page_name, ad.__source_q].filter(Boolean).join(" ")
  )
}

function isHardBlocked(ad: any): boolean {
  const base = buildAdText(ad)
  if (!base) return false
  return HARD_BLOCK_KEYWORDS.some((kw) => base.includes(normalizeText(kw)))
}

function looksLikeInfoProduct(ad: any): boolean {
  const base = buildAdText(ad)
  if (!base) return false
  return INFO_KEYWORDS.some((kw) => base.includes(normalizeText(kw)))
}

// chave pra agrupar: mesma página + mesma palavra
function getGroupKey(ad: any): string {
  const pageKey = ad.page_id || ad.page_name || "unknown-page"
  const searchKey = ad.__source_q || ""
  return `${pageKey}::${searchKey}`
}

function toTimestamp(v?: string): number {
  if (!v) return 0
  const n = Date.parse(v)
  return isNaN(n) ? 0 : n
}

// ----------------- handler principal -----------------
export async function GET(req: Request) {
  try {
    const token = getToken()
    const { searchParams } = new URL(req.url)

    // limite por busca (por página de resultado)
    const limitPerQuery = Math.max(
      20,
      Math.min(100, Number(searchParams.get("limit") ?? 80)
      )
    )

    // quantas páginas no máximo vamos buscar POR keyword
    const maxPagesPerQuery = Math.max(
      1,
      Math.min(5, Number(searchParams.get("max_pages_per_query") ?? 3)
      )
    )

    // mínimo de anúncios ativos por grupo (pode vir da query)
    const minActive =
      Number(searchParams.get("min_active") ?? DEFAULT_MIN_ACTIVE_PER_GROUP) ||
      DEFAULT_MIN_ACTIVE_PER_GROUP

    // países vindos do front (?countries=["BR","PT","MX"]) – default BR
    let countries = ["BR"]
    const rawCountries = searchParams.get("countries")
    if (rawCountries) {
      try {
        const parsed = JSON.parse(rawCountries)
        if (
          Array.isArray(parsed) &&
          parsed.every((c) => typeof c === "string" && c.length === 2)
        ) {
          countries = parsed
        }
      } catch {
        // se quebrar o JSON, ignora e segue com ["BR"]
      }
    }

    const fields =
      "id,page_id,page_name,ad_delivery_start_time,ad_snapshot_url"
    const allAds: any[] = []

    // 1) BUSCA SÓ PELAS PALAVRAS-CHAVE (PT+ES), COM PAGINAÇÃO
    for (const q of KEYWORD_QUERIES) {
      let page = 0
      let afterCursor: string | null = null

      do {
        const url = new URL(`${GRAPH}/ads_archive`)
        url.searchParams.set("access_token", token)
        url.searchParams.set(
          "ad_reached_countries",
          JSON.stringify(countries)
        )
        url.searchParams.set("search_terms", q)
        url.searchParams.set("ad_type", "ALL")
        url.searchParams.set("ad_active_status", "ACTIVE")
        url.searchParams.set("limit", String(limitPerQuery))
        url.searchParams.set("fields", fields)

        if (afterCursor) {
          url.searchParams.set("after", afterCursor)
        }

        const res = await fetch(url.toString(), { cache: "no-store" })
        const json = await res.json()

        if (!res.ok) {
          console.error("Erro Graph:", json?.error || json)
          break
        }

        const data = Array.isArray(json.data) ? json.data : []

        for (const ad of data) {
          const enriched = {
            ...ad,
            __source_q: q,
            ad_snapshot_url_public: ad.ad_snapshot_url,
          }
          // evita duplicado
          if (!allAds.find((a) => a.id === enriched.id)) {
            allAds.push(enriched)
          }
        }

        const paging = json.paging
        afterCursor = paging?.cursors?.after ?? null
        page += 1
      } while (afterCursor && page < maxPagesPerQuery)
    }

    if (allAds.length === 0) {
      return NextResponse.json({
        source: "KEYWORD_INFOPRODUCT",
        generated_at: new Date().toISOString(),
        total_raw: 0,
        total_filtered: 0,
        total_scaled: 0,
        min_active_per_group: minActive,
        countries,
        data: [],
      })
    }

    // 2) BLOCKLIST
    let filtered = allAds.filter((ad) => !isHardBlocked(ad))

    // 3) WHITELIST INFOPRODUTO
    const onlyInfo = filtered.filter((ad) => looksLikeInfoProduct(ad))
    if (onlyInfo.length > 0) filtered = onlyInfo

    if (filtered.length === 0) {
      return NextResponse.json({
        source: "KEYWORD_INFOPRODUCT",
        generated_at: new Date().toISOString(),
        total_raw: allAds.length,
        total_filtered: 0,
        total_scaled: 0,
        min_active_per_group: minActive,
        countries,
        data: [],
      })
    }

    // 4) AGRUPA POR (page_id + q) E CONTA QUANTOS ANÚNCIOS TEM POR GRUPO
    const groupCounts = new Map<string, number>()
    for (const ad of filtered) {
      const key = getGroupKey(ad)
      groupCounts.set(key, (groupCounts.get(key) ?? 0) + 1)
    }

    // 5) SÓ GRUPOS ESCALADOS (>= minActive)
    const scaled = filtered.filter((ad) => {
      const key = getGroupKey(ad)
      const count = groupCounts.get(key) ?? 0
      return count >= minActive
    })

    if (scaled.length === 0) {
      return NextResponse.json({
        source: "KEYWORD_INFOPRODUCT",
        generated_at: new Date().toISOString(),
        total_raw: allAds.length,
        total_filtered: filtered.length,
        total_scaled: 0,
        min_active_per_group: minActive,
        countries,
        data: [],
      })
    }

    // 6) APENAS 1 ANÚNCIO POR GRUPO (o mais recente)
    const bestByGroup = new Map<string, any>()
    for (const ad of scaled) {
      const key = getGroupKey(ad)
      const current = bestByGroup.get(key)

      if (!current) {
        bestByGroup.set(key, ad)
      } else {
        const currentTs = toTimestamp(current.ad_delivery_start_time)
        const newTs = toTimestamp(ad.ad_delivery_start_time)
        if (newTs > currentTs) {
          bestByGroup.set(key, ad)
        }
      }
    }

    // 7) ACOPLA group_size (quantos anúncios aquela oferta tem no grupo)
    const finalData = Array.from(bestByGroup.values()).map((ad) => {
      const key = getGroupKey(ad)
      const groupSize = groupCounts.get(key) ?? 1
      return {
        ...ad,
        group_size: groupSize,
        search_term: ad.__source_q,
      }
    })

    return NextResponse.json({
      source: "KEYWORD_INFOPRODUCT",
      generated_at: new Date().toISOString(),
      total_raw: allAds.length,
      total_filtered: filtered.length,
      total_scaled: finalData.length,
      min_active_per_group: minActive,
      countries,
      data: finalData,
    })
  } catch (e: any) {
    console.error("Erro na /api/ads:", e)
    return NextResponse.json(
      { error: e?.message || "Erro interno na API de anúncios" },
      { status: 500 }
    )
  }
}
