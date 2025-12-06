"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

type Offer = {
  id: string
  title: string
  description: string
  imageUrl: string
  category: string
  adCount: number
  level: "low" | "medium" | "high"
  niche: string
  country: string
  link: string
}

// =======================
// 🔥 BLOQUEIO DE PALAVRAS
// =======================
const BLOCKED_KEYWORDS = [
  "dorama",
  "doramas",
  "kdrama",
  "k-drama",
  "drama coreano",
  "novela coreana",
  "kpop",
  "k-pop",
  "anime",
  "mangá",
  "manga",
  "kdramas",
  "kdramas coreanos",
]

function normalizeText(text: string): string {
  if (!text) return ""
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function isBlockedOffer(offer: Offer): boolean {
  const base = normalizeText(
    [offer.title, offer.description, offer.niche, offer.link]
      .filter(Boolean)
      .join(" ")
  )

  if (!base) return false

  return BLOCKED_KEYWORDS.some((keyword) =>
    base.includes(normalizeText(keyword))
  )
}

// =======================
// 🎯 MAPEAMENTO DE NICHOS
// =======================
function resolveNicheFromTerm(term: string): string {
  const t = normalizeText(term)

  // SAÚDE / EMAGRECIMENTO
  if (
    t.includes("emagrec") ||
    t.includes("dieta") ||
    t.includes("peso") ||
    t.includes("saude") ||
    t.includes("saúde") ||
    t.includes("fitness") ||
    t.includes("treino") ||
    t.includes("bajar de peso") ||
    t.includes("perdida de peso")
  ) {
    return "Saúde / Emagrecimento"
  }

  // DROPSHIPPING / ECOMMERCE / PLR
  if (
    t.includes("dropshipping") ||
    t.includes("drop") ||
    t.includes("ecommerce") ||
    t.includes("e commerce") ||
    t.includes("loja virtual") ||
    t.includes("loja online") ||
    t.includes("shopee") ||
    t.includes("plr") ||
    t.includes("infoproduto") ||
    t.includes("infoprodutos") ||
    t.includes("infoproducto") ||
    t.includes("infoproductos") ||
    t.includes("tienda online") ||
    t.includes("tienda en linea")
  ) {
    return "Dropshipping / Ecommerce"
  }

  // RENDA EXTRA / BET / IGAME
  if (
    t.includes("renda extra") ||
    t.includes("ganhar dinheiro") ||
    t.includes("ganhe dinheiro") ||
    t.includes("aposta") ||
    t.includes("bet") ||
    t.includes("cassino") ||
    t.includes("trader esportivo") ||
    t.includes("igame") ||
    t.includes("ingresos extra") ||
    t.includes("ingresos pasivos") ||
    t.includes("ganar dinero")
  ) {
    return "Renda Extra / Bet / Igame"
  }

  // MARKETING / VENDAS / TRÁFEGO
  if (
    t.includes("marketing digital") ||
    t.includes("trafego pago") ||
    t.includes("tráfego pago") ||
    t.includes("gestor de trafego") ||
    t.includes("copywriting") ||
    t.includes("copy") ||
    t.includes("funil") ||
    t.includes("lancamento") ||
    t.includes("lançamento") ||
    t.includes("perpetuo") ||
    t.includes("perpétuo") ||
    t.includes("ventas online") ||
    t.includes("embudo de ventas") ||
    t.includes("trafico pago")
  ) {
    return "Marketing / Vendas"
  }

  // DESENVOLVIMENTO PESSOAL
  if (
    t.includes("desenvolvimento pessoal") ||
    t.includes("produtividade") ||
    t.includes("mentalidade") ||
    t.includes("mindset") ||
    t.includes("habito") ||
    t.includes("hábito") ||
    t.includes("inteligencia emocional") ||
    t.includes("inteligência emocional")
  ) {
    return "Desenvolvimento Pessoal"
  }

  return "Outros"
}

export default function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados de nicho mantidos
  const [selectedNiche, setSelectedNiche] = useState<string>("all")
  const [isNicheDropdownOpen, setIsNicheDropdownOpen] = useState(false)
  const [nicheSearchTerm, setNicheSearchTerm] = useState("")

  const nicheDropdownRef = useRef<HTMLDivElement>(null)

  const [after, setAfter] = useState<string | null>(null)

  const getFireFillPercentage = (adCount: number) =>
    Math.min((adCount / 50) * 100, 100)

  // lista de nichos únicos (a partir das ofertas carregadas)
  const allNiches = Array.from(
    new Set(
      offers
        .map((o) => o.niche?.trim())
        .filter((n) => n && n.length > 0) as string[]
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"))

  const filteredNiches = ["Todos", ...allNiches].filter((n) =>
    n.toLowerCase().includes(nicheSearchTerm.toLowerCase())
  )

  // offers visíveis depois do filtro de nicho
  const visibleOffers = offers.filter((offer) =>
    selectedNiche === "all" ? true : offer.niche === selectedNiche
  )

  async function fetchOffers(
    cursor?: string,
    mode: "initial" | "more" = "initial"
  ) {
    try {
      if (mode === "initial") setLoading(true)
      if (mode === "more") setLoadingMore(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("limit", "80")

      // 🌎 Países que vamos buscar de verdade (BR + PT + LATAM + PALOP)
      params.set(
        "countries",
        JSON.stringify(["BR", "PT", "MX", "CO", "CL", "PE", "AR", "AO", "MZ", "CV"])
      )

      if (cursor) params.set("after", cursor)

      const response = await fetch(`/api/ads?${params.toString()}`)
      if (!response.ok)
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)

      const json = await response.json()

      // Se backend devolver { data: [...] }
      const rows = Array.isArray(json) ? json : json?.data ?? []
      const nextAfter: string | null = null // ainda não estamos usando paginação de front

      if (!Array.isArray(rows)) throw new Error("Formato de dados inválido")

      console.log("DEBUG /api/ads -> meta:", {
        total_raw: json.total_raw,
        total_filtered: json.total_filtered,
        total_scaled: json.total_scaled,
        countries: json.countries,
        generated_at: json.generated_at,
      })

      console.log("DEBUG /api/ads -> exemplo de item:", rows[0])

      // 1) mapeia ofertas básicas
      const mappedBase: Offer[] = rows.map((ad: any) => {
        const rawNiche =
          typeof ad.search_term === "string" ? ad.search_term : ad.__source_q || ""
        const resolvedNiche = rawNiche ? resolveNicheFromTerm(rawNiche) : "Outros"

        const adCountFromBackend =
          typeof ad.group_size === "number" && ad.group_size > 0
            ? ad.group_size
            : 1

        return {
          id: ad.id?.toString() ?? `${Date.now()}-${Math.random()}`,
          title: ad.page_name ? `Anúncio de ${ad.page_name}` : `Anúncio ${ad.id}`,
          description: "",
          imageUrl: `/api/ad-image?id=${ad.id}`,
          category: "Meta",
          adCount: adCountFromBackend,
          level: "low",
          niche: resolvedNiche,
          country: "Todos", // Se quiser, depois podemos mapear por país
          link: ad.ad_snapshot_url_public,
        }
      })

      // 2) aplica filtro de blacklist
      const cleanedOffers = mappedBase.filter((offer) => !isBlockedOffer(offer))

      // 3) ordena por mais escalado
      const sortedOffers = cleanedOffers.sort(
        (a, b) => b.adCount - a.adCount
      )

      // 4) salva as ofertas
      setOffers((prev) =>
        mode === "more" ? [...prev, ...sortedOffers] : sortedOffers
      )
      setAfter(nextAfter)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? "Erro desconhecido ao carregar ofertas")
      if (mode === "initial") setOffers([])
    } finally {
      if (mode === "initial") setLoading(false)
      if (mode === "more") setLoadingMore(false)
    }
  }

  // Carga inicial
  useEffect(() => {
    fetchOffers(undefined, "initial")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        nicheDropdownRef.current &&
        !nicheDropdownRef.current.contains(target)
      ) {
        setIsNicheDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOfferClick = (offer: Offer) => {
    if (offer.link) window.open(offer.link, "_blank")
  }

  // Loading
  if (loading && offers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-muted-foreground/40 border-t-foreground" />
          <p className="text-2xl font-semibold text-foreground">
            Carregando ofertas...
          </p>
        </div>
      </div>
    )
  }

  if (error && offers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center">
          <p className="mb-4 text-2xl font-semibold text-destructive">
            Erro ao carregar ofertas
          </p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchOffers(undefined, "initial")}
            className="mt-6 rounded-lg bg-destructive px-6 py-3 font-semibold text-destructive-foreground transition-colors hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl font-semibold text-foreground">
            Nenhuma oferta encontrada
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 text-foreground">
      <div className="mx-auto max-w-[2000px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-6">
          <h1 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
              OFERTAS ESCALADAS
            </span>
          </h1>

          {/* Filtros */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {/* Nicho */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="niche-filter"
                className="text-base sm:text-lg font-medium text-muted-foreground"
              >
                Nicho:
              </label>
              <div ref={nicheDropdownRef} className="relative">
                <button
                  onClick={() => setIsNicheDropdownOpen(!isNicheDropdownOpen)}
                  className="flex min-w-[180px] sm:min-w-[220px] items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm sm:text-base font-medium shadow-sm transition-colors hover:bg-card/80"
                >
                  <span>
                    {selectedNiche === "all" ? "Todos" : selectedNiche}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className={`h-5 w-5 transition-transform ${
                      isNicheDropdownOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isNicheDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-[260px] sm:w-[300px] rounded-lg border border-border bg-popover shadow-lg">
                    <div className="border-b border-border p-3">
                      <input
                        type="text"
                        placeholder="Buscar nicho..."
                        value={nicheSearchTerm}
                        onChange={(e) => setNicheSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {filteredNiches.length > 0 ? (
                        filteredNiches.map((niche) => (
                          <button
                            key={niche}
                            onClick={() => {
                              setSelectedNiche(
                                niche === "Todos" ? "all" : niche
                              )
                              setIsNicheDropdownOpen(false)
                              setNicheSearchTerm("")
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                              (selectedNiche === "all" &&
                                niche === "Todos") ||
                              selectedNiche === niche
                                ? "bg-muted font-semibold"
                                : "text-foreground"
                            }`}
                          >
                            {niche}
                          </button>
                        ))
                      ) : (
                        <div className="px-6 py-4 text-center text-sm text-muted-foreground">
                          Nenhum nicho encontrado
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Se não tiver oferta no nicho filtrado */}
        {visibleOffers.length === 0 && (
          <div className="mb-6 rounded-lg border border-border bg-card/40 p-4 text-center text-sm text-muted-foreground">
            Nenhuma oferta encontrada para o nicho selecionado.
          </div>
        )}

        {/* Grid fixa com 5 colunas em qualquer tela */}
        <div className="grid grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {visibleOffers.map((offer) => (
            <div
              key={offer.id}
              className="group flex h-[320px] sm:h-[340px] lg:h-[350px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow transition-all hover:scale-[1.01] hover:shadow-lg"
            >
              {/* Header */}
              <div className="flex items-center gap-2 bg-muted/60 px-4 py-2 border-b border-border">
                <Image
                  src="/meta-icon.png"
                  alt="Meta"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
                <span className="text-xs sm:text-sm font-semibold">META</span>
              </div>

              {/* Imagem */}
              <div className="relative flex-1 w-full overflow-hidden">
                <Image
                  src={offer.imageUrl || "/placeholder.svg"}
                  alt={offer.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* CTA */}
              <button
                onClick={() => handleOfferClick(offer)}
                className="w-full bg-gradient-to-b from-card to-card/70 py-2.5 text-sm sm:text-base font-bold tracking-wide transition-colors hover:bg-card"
              >
                VER OFERTA
              </button>

              {/* Rodapé */}
              <div className="flex items-center justify-between border-t border-border bg-card/60 px-4 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-medium">
                    {offer.adCount} anúncios
                  </span>
                  <span className="text-[11px] sm:text-xs text-muted-foreground">
                    Nicho: {offer.niche || "-"}
                  </span>
                </div>

                {/* Termômetro */}
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7 sm:h-8 sm:w-8 opacity-30"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                      clipRule="evenodd"
                    />
                  </svg>

                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      clipPath: `inset(${100 - getFireFillPercentage(
                        offer.adCount
                      )}% 0 0 0)`,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`h-7 w-7 sm:h-8 sm:w-8 transition-all ${
                        offer.adCount >= 50
                          ? "text-red-500"
                          : offer.adCount >= 20
                          ? "text-orange-500"
                          : "text-yellow-500"
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => after && fetchOffers(after, "more")}
            disabled={!after || loadingMore}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {after
              ? loadingMore
                ? "Carregando..."
                : "Carregar mais"
              : "Sem mais resultados"}
          </button>
        </div>
      </div>
    </div>
  )
}
