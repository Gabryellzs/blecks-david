"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

interface Offer {
  id: number
  title: string
  description: string
  imageUrl: string
  category: string
  adCount: number
  level: "low" | "medium" | "high"
  niche: string
  country: string
  link?: string
}

const ALL_COUNTRIES = [
  "Afeganistão","África do Sul","Albânia","Alemanha","Andorra","Angola","Antígua e Barbuda","Arábia Saudita","Argélia","Argentina","Armênia","Austrália","Áustria","Azerbaijão","Bahamas","Bangladesh","Barbados","Bahrein","Bélgica","Belize","Benin","Bielorrússia","Bolívia","Bósnia e Herzegovina","Botsuana","Brasil","Brunei","Bulgária","Burkina Faso","Burundi","Butão","Cabo Verde","Camarões","Camboja","Canadá","Catar","Cazaquistão","Chade","Chile","China","Chipre","Colômbia","Comores","Congo","Coreia do Norte","Coreia do Sul","Costa do Marfim","Costa Rica","Croácia","Cuba","Dinamarca","Djibuti","Dominica","Egito","El Salvador","Emirados Árabes Unidos","Equador","Eritreia","Eslováquia","Eslovênia","Espanha","Estados Unidos","Estônia","Eswatini","Etiópia","Fiji","Filipinas","Finlândia","França","Gabão","Gâmbia","Gana","Geórgia","Granada","Grécia","Guatemala","Guiana","Guiné","Guiné-Bissau","Guiné Equatorial","Haiti","Honduras","Hungria","Iêmen","Ilhas Marshall","Ilhas Salomão","Índia","Indonésia","Irã","Iraque","Irlanda","Islândia","Israel","Itália","Jamaica","Japão","Jordânia","Kiribati","Kosovo","Kuwait","Laos","Lesoto","Letônia","Líbano","Libéria","Líbia","Liechtenstein","Lituânia","Luxemburgo","Macedônia do Norte","Madagascar","Malásia","Malawi","Maldivas","Mali","Malta","Marrocos","Maurícia","Mauritânia","México","Mianmar","Micronésia","Moçambique","Moldávia","Mônaco","Mongólia","Montenegro","Namíbia","Nauru","Nepal","Nicarágua","Níger","Nigéria","Noruega","Nova Zelândia","Omã","Países Baixos","Palau","Panamá","Papua-Nova Guiné","Paquistão","Paraguai","Peru","Polônia","Portugal","Quênia","Quirguistão","Reino Unido","República Centro-Africana","República Democrática do Congo","República Dominicana","República Tcheca","Romênia","Ruanda","Rússia","Samoa","San Marino","Santa Lúcia","São Cristóvão e Névis","São Tomé e Príncipe","São Vicente e Granadinas","Senegal","Serra Leoa","Sérvia","Seychelles","Singapura","Síria","Somália","Sri Lanka","Sudão","Sudão do Sul","Suécia","Suíça","Suriname","Tailândia","Taiwan","Tajiquistão","Tanzânia","Timor-Leste","Togo","Tonga","Trinidad e Tobago","Tunísia","Turcomenistão","Turquia","Tuvalu","Ucrânia","Uganda","Uruguai","Uzbequistão","Vanuatu","Vaticano","Venezuela","Vietnã","Zâmbia","Zimbábue",
]

export default function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true)
        setError(null)

        const url =
          selectedCountry === "all" ? "/api/offers" : `/api/offers?country=${encodeURIComponent(selectedCountry)}`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Erro na API: ${response.status} ${response.statusText}`)

        const data = await response.json()
        if (!Array.isArray(data)) throw new Error("Formato de dados inválido")
        setOffers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar ofertas")
        setOffers([])
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [selectedCountry])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOfferClick = (offer: Offer) => {
    if (offer.link) window.open(offer.link, "_blank")
    else alert(`Você clicou em: ${offer.title}`)
  }

  const organizeIntoColumns = () => {
    const columns: Offer[][] = [[], [], [], [], []]
    offers.forEach((offer, index) => {
      const columnIndex = index % 5
      columns[columnIndex].push(offer)
    })
    return columns
  }

  const getFireFillPercentage = (adCount: number) => Math.min((adCount / 50) * 100, 100)

  const filteredCountries = ["Todos", ...ALL_COUNTRIES].filter((country) =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-foreground/80" />
          <p className="text-2xl font-semibold text-foreground">Carregando ofertas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <p className="mb-2 text-2xl font-semibold text-destructive">Erro ao carregar ofertas</p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg border border-border bg-primary/90 px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary"
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
          <p className="text-2xl font-semibold text-foreground">Nenhuma oferta encontrada</p>
          <p className="mt-2 text-muted-foreground">Tente selecionar outro país</p>
        </div>
      </div>
    )
  }

  const columns = organizeIntoColumns()

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-[2000px]">
        <div className="mb-8 flex flex-col gap-6">
          <h1 className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-center text-5xl font-bold text-transparent">
            OFERTAS ESCALADAS
          </h1>

          <div className="flex items-center justify-end gap-3">
            <label htmlFor="country-filter" className="text-lg font-medium text-muted-foreground">
              País:
            </label>

            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="flex min-w-[200px] items-center justify-between gap-3 rounded-lg border border-border bg-background px-6 py-3 text-base font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none"
              >
                <span>{selectedCountry === "all" ? "Todos" : selectedCountry}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className={`h-5 w-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-[300px] overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                  <div className="border-b border-border p-3">
                    <input
                      type="text"
                      placeholder="Buscar país..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country}
                          onClick={() => {
                            setSelectedCountry(country === "Todos" ? "all" : country)
                            setIsDropdownOpen(false)
                            setSearchTerm("")
                          }}
                          className={`w-full px-6 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                            (selectedCountry === "all" && country === "Todos") || selectedCountry === country
                              ? "bg-accent/50 font-semibold"
                              : "text-muted-foreground"
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
        </div>

        <div className="grid grid-cols-5 gap-8">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-6">
              {column.map((offer) => (
                <div
                  key={offer.id}
                  className="group flex h-[350px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
                >
                  <div className="flex items-center gap-2 bg-muted px-4 py-2">
                    <Image src="/meta-icon.png" alt="Meta" width={24} height={24} className="h-6 w-6 object-contain" />
                    <span className="text-sm font-semibold text-muted-foreground">META</span>
                  </div>

                  <div className="relative h-full w-full overflow-hidden">
                    <Image
                      src={offer.imageUrl || "/placeholder.svg"}
                      alt={offer.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <button
                    onClick={() => handleOfferClick(offer)}
                    className="w-full bg-muted/60 py-2.5 text-base font-bold tracking-wide text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                  >
                    VER OFERTA
                  </button>

                  <div className="flex items-center justify-between border-t border-border bg-muted/60 px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">{offer.adCount} anúncios</span>
                      <span className="text-xs font-medium text-muted-foreground">Nicho: {offer.niche}</span>
                    </div>

                    {/* termômetro de “fogo” */}
                    <div className="relative">
                      {/* base */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-muted-foreground/30">
                        <path
                          fillRule="evenodd"
                          d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                          clipRule="evenodd"
                        />
                      </svg>

                      {/* preenchimento por clipPath */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(${100 - getFireFillPercentage(offer.adCount)}% 0 0 0)` }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={`h-8 w-8 transition-all duration-500 ${
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
          ))}
        </div>
      </div>
    </div>
  )
}
