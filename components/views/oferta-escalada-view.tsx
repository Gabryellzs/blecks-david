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

const ALL_COUNTRIES = [
  "Afeganistão","África do Sul","Albânia","Alemanha","Andorra","Angola","Antígua e Barbuda","Arábia Saudita","Argélia","Argentina","Armênia","Austrália","Áustria","Azerbaijão","Bahamas","Bangladesh","Barbados","Bahrein","Bélgica","Belize","Benin","Bielorrússia","Bolívia","Bósnia e Herzegovina","Botsuana","Brasil","Brunei","Bulgária","Burkina Faso","Burundi","Butão","Cabo Verde","Camarões","Camboja","Canadá","Catar","Cazaquistão","Chade","Chile","China","Chipre","Colômbia","Comores","Congo","Coreia do Norte","Coreia do Sul","Costa do Marfim","Costa Rica","Croácia","Cuba","Dinamarca","Djibuti","Dominica","Egito","El Salvador","Emirados Árabes Unidos","Equador","Eritreia","Eslováquia","Eslovênia","Espanha","Estados Unidos","Estônia","Eswatini","Etiópia","Fiji","Filipinas","Finlândia","França","Gabão","Gâmbia","Gana","Geórgia","Granada","Grécia","Guatemala","Guiana","Guiné","Guiné-Bissau","Guiné Equatorial","Haiti","Honduras","Hungria","Iêmen","Ilhas Marshall","Ilhas Salomão","Índia","Indonésia","Irã","Iraque","Irlanda","Islândia","Israel","Itália","Jamaica","Japão","Jordânia","Kiribati","Kosovo","Kuwait","Laos","Lesoto","Letônia","Líbano","Libéria","Líbia","Liechtenstein","Lituânia","Luxemburgo","Macedônia do Norte","Madagascar","Malásia","Malawi","Maldivas","Mali","Malta","Marrocos","Maurícia","Mauritânia","México","Mianmar","Micronésia","Moçambique","Moldávia","Mônaco","Mongólia","Montenegro","Namíbia","Nauru","Nepal","Nicarágua","Níger","Nigéria","Noruega","Nova Zelândia","Omã","Países Baixos","Palau","Panamá","Papua-Nova Guiné","Paquistão","Paraguai","Peru","Polônia","Portugal","Quênia","Quirguistão","Reino Unido","República Centro-Africana","República Democrática do Congo","República Dominicana","República Tcheca","Romênia","Ruanda","Rússia","Samoa","San Marino","Santa Lúcia","São Cristóvão e Névis","São Tomé e Príncipe","São Vicente e Granadinas","Senegal","Serra Leoa","Sérvia","Seychelles","Singapura","Síria","Somália","Sri Lanka","Sudão","Sudão do Sul","Suécia","Suíça","Suriname","Tailândia","Taiwan","Tajiquistão","Tanzânia","Timor-Leste","Togo","Tonga","Trinidad e Tobago","Tunísia","Turcomenistão","Turquia","Tuvalu","Ucrânia","Uganda","Uruguai","Uzbequistão","Vanuatu","Vaticano","Venezuela","Vietnã","Zâmbia","Zimbábue",
]

const COUNTRY_TO_ISO2: Record<string, string> = {
  Brasil: "BR",
  "Estados Unidos": "US",
  Portugal: "PT",
  México: "MX",
  Argentina: "AR",
  Chile: "CL",
  Colômbia: "CO",
  Peru: "PE",
  Espanha: "ES",
  França: "FR",
  Alemanha: "DE",
  "Reino Unido": "GB",
  Itália: "IT",
  Canadá: "CA",
  Austrália: "AU",
}

export default function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [countrySearchTerm, setCountrySearchTerm] = useState("")

  const [selectedNiche, setSelectedNiche] = useState<string>("all")
  const [isNicheDropdownOpen, setIsNicheDropdownOpen] = useState(false)
  const [nicheSearchTerm, setNicheSearchTerm] = useState("")

  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const nicheDropdownRef = useRef<HTMLDivElement>(null)

  const [after, setAfter] = useState<string | null>(null)

  const getFireFillPercentage = (adCount: number) =>
    Math.min((adCount / 50) * 100, 100)

  // países filtrados
  const filteredCountries = ["Todos", ...ALL_COUNTRIES].filter((country) =>
    country.toLowerCase().includes(countrySearchTerm.toLowerCase())
  )

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
      params.set("q", "oferta")
      params.set("ad_type", "ALL")
      params.set("limit", "25")
      if (cursor) params.set("after", cursor)

      if (selectedCountry !== "all") {
        const iso2 = COUNTRY_TO_ISO2[selectedCountry]
        if (iso2) params.set("countries", JSON.stringify([iso2]))
      }

      const response = await fetch(`/api/ads?${params.toString()}`)
      if (!response.ok)
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)

      const json = await response.json()
      const rows = Array.isArray(json) ? json : json?.data
      const nextAfter: string | null = json?.paging?.cursors?.after ?? null
      if (!Array.isArray(rows)) throw new Error("Formato de dados inválido")

      // 1) mapeia ofertas básicas
      const mappedBase: Offer[] = rows.map((ad: any) => ({
        id: ad.id?.toString() ?? `${Date.now()}-${Math.random()}`,
        title: ad.page_name
          ? `Anúncio de ${ad.page_name}`
          : `Anúncio ${ad.id}`,
        description: ad.ad_creative_body ?? "",
        imageUrl: `/api/ad-image?id=${ad.id}`,
        category: "Meta",
        adCount: 1,
        level: "low",
        niche: "",
        country: selectedCountry === "all" ? "Todos" : selectedCountry,
        link: ad.ad_snapshot_url_public,
      }))

      // 2) chama IA UMA VEZ só em lote pra descobrir nichos
      let mappedWithNiche: Offer[] = mappedBase

      try {
        const res = await fetch("/api/detect-niche", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ads: mappedBase.map((o) => ({
              id: o.id,
              title: o.title,
              description: o.description,
            })),
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const result: any[] = Array.isArray(data.result) ? data.result : []

          const nicheMap = new Map<string, string>()
          for (const item of result) {
            if (item?.id && typeof item.niche === "string") {
              nicheMap.set(String(item.id), item.niche.trim())
            }
          }

          mappedWithNiche = mappedBase.map((o) => ({
            ...o,
            niche: nicheMap.get(o.id) || "",
          }))
        }
      } catch (e) {
        console.error("Falha ao detectar nichos em lote:", e)
        // se der erro, segue com niche vazio mesmo
      }

      // 3) salva as ofertas (respeitando paginação)
      setOffers((prev) =>
        mode === "more" ? [...prev, ...mappedWithNiche] : mappedWithNiche
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

  // quando trocar o país, resetar nicho e recarregar
  useEffect(() => {
    setSelectedNiche("all")
  }, [selectedCountry])

  // carga inicial / troca de país
  useEffect(() => {
    fetchOffers(undefined, "initial")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry])

  // fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(target)
      ) {
        setIsCountryDropdownOpen(false)
      }

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
          <p className="mt-2 text-muted-foreground">
            Tente selecionar outro país
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* País */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="country-filter"
                className="text-base sm:text-lg font-medium text-muted-foreground"
              >
                País:
              </label>
              <div ref={countryDropdownRef} className="relative">
                <button
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="flex min-w-[180px] sm:min-w-[220px] items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm sm:text-base font-medium shadow-sm transition-colors hover:bg-card/80"
                >
                  <span>
                    {selectedCountry === "all" ? "Todos" : selectedCountry}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className={`h-5 w-5 transition-transform ${
                      isCountryDropdownOpen ? "rotate-180" : ""
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

                {isCountryDropdownOpen && (
                  <div className="absolute left-0 z-50 mt-2 w-[280px] sm:w-[320px] rounded-lg border border-border bg-popover shadow-lg">
                    <div className="border-b border-border p-3">
                      <input
                        type="text"
                        placeholder="Buscar país..."
                        value={countrySearchTerm}
                        onChange={(e) => setCountrySearchTerm(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[380px] overflow-y-auto">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              setSelectedCountry(
                                country === "Todos" ? "all" : country
                              )
                              setIsCountryDropdownOpen(false)
                              setCountrySearchTerm("")
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                              (selectedCountry === "all" &&
                                country === "Todos") ||
                              selectedCountry === country
                                ? "bg-muted font-semibold"
                                : "text-foreground"
                            }`}
                          >
                            {country}
                          </button>
                        ))
                      ) : (
                        <div className="px-6 py-4 text-center text-sm text-muted-foreground">
                          Nenhum país encontrado
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

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

        {/* Grid responsiva */}
        <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
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
                        offer.adCount >= 15
                          ? "text-red-500"
                          : offer.adCount >= 10
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
