"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

type Offer = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  adCount: number;
  level: "low" | "medium" | "high";
  niche: string;
  country: string;
  link: string;
};

const ALL_COUNTRIES = [
  "Afeganistão","África do Sul","Albânia","Alemanha","Andorra","Angola","Antígua e Barbuda","Arábia Saudita","Argélia","Argentina","Armênia","Austrália","Áustria","Azerbaijão","Bahamas","Bangladesh","Barbados","Bahrein","Bélgica","Belize","Benin","Bielorrússia","Bolívia","Bósnia e Herzegovina","Botsuana","Brasil","Brunei","Bulgária","Burkina Faso","Burundi","Butão","Cabo Verde","Camarões","Camboja","Canadá","Catar","Cazaquistão","Chade","Chile","China","Chipre","Colômbia","Comores","Congo","Coreia do Norte","Coreia do Sul","Costa do Marfim","Costa Rica","Croácia","Cuba","Dinamarca","Djibuti","Dominica","Egito","El Salvador","Emirados Árabes Unidos","Equador","Eritreia","Eslováquia","Eslovênia","Espanha","Estados Unidos","Estônia","Eswatini","Etiópia","Fiji","Filipinas","Finlândia","França","Gabão","Gâmbia","Gana","Geórgia","Granada","Grécia","Guatemala","Guiana","Guiné","Guiné-Bissau","Guiné Equatorial","Haiti","Honduras","Hungria","Iêmen","Ilhas Marshall","Ilhas Salomão","Índia","Indonésia","Irã","Iraque","Irlanda","Islândia","Israel","Itália","Jamaica","Japão","Jordânia","Kiribati","Kosovo","Kuwait","Laos","Lesoto","Letônia","Líbano","Libéria","Líbia","Liechtenstein","Lituânia","Luxemburgo","Macedônia do Norte","Madagascar","Malásia","Malawi","Maldivas","Mali","Malta","Marrocos","Maurícia","Mauritânia","México","Mianmar","Micronésia","Moçambique","Moldávia","Mônaco","Mongólia","Montenegro","Namíbia","Nauru","Nepal","Nicarágua","Níger","Nigéria","Noruega","Nova Zelândia","Omã","Países Baixos","Palau","Panamá","Papua-Nova Guiné","Paquistão","Paraguai","Peru","Polônia","Portugal","Quênia","Quirguistão","Reino Unido","República Centro-Africana","República Democrática do Congo","República Dominicana","República Tcheca","Romênia","Ruanda","Rússia","Samoa","San Marino","Santa Lúcia","São Cristóvão e Névis","São Tomé e Príncipe","São Vicente e Granadinas","Senegal","Serra Leoa","Sérvia","Seychelles","Singapura","Síria","Somália","Sri Lanka","Sudão","Sudão do Sul","Suécia","Suíça","Suriname","Tailândia","Taiwan","Tajiquistão","Tanzânia","Timor-Leste","Togo","Tonga","Trinidad e Tobago","Tunísia","Turcomenistão","Turquia","Tuvalu","Ucrânia","Uganda","Uruguai","Uzbequistão","Vanuatu","Vaticano","Venezuela","Vietnã","Zâmbia","Zimbábue",
];

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
};

export default function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);        // só para carga inicial / troca de país
  const [loadingMore, setLoadingMore] = useState(false); // para paginação
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [after, setAfter] = useState<string | null>(null);

  async function fetchOffers(cursor?: string, mode: "initial" | "more" = "initial") {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "more") setLoadingMore(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("q", "oferta");
      params.set("ad_type", "ALL");
      params.set("limit", "25");
      if (cursor) params.set("after", cursor);

      if (selectedCountry !== "all") {
        const iso2 = COUNTRY_TO_ISO2[selectedCountry];
        if (iso2) params.set("countries", JSON.stringify([iso2]));
      }

      const response = await fetch(`/api/ads?${params.toString()}`);
      if (!response.ok) throw new Error(`Erro na API: ${response.status} ${response.statusText}`);

      const json = await response.json();
      const rows = Array.isArray(json) ? json : json?.data;
      const nextAfter: string | null = json?.paging?.cursors?.after ?? null;
      if (!Array.isArray(rows)) throw new Error("Formato de dados inválido");

      const mapped: Offer[] = rows.map((ad: any) => ({
        id: ad.id?.toString() ?? `${Date.now()}-${Math.random()}`,
        title: ad.page_name ? `Anúncio de ${ad.page_name}` : `Anúncio ${ad.id}`,
        description: ad.ad_creative_body ?? "",
        imageUrl: `/api/ad-image?id=${ad.id}`, // criativo
        category: "Meta",
        adCount: 1,
        level: "low",
        niche: "",
        country: selectedCountry === "all" ? "Todos" : selectedCountry,
        link: ad.ad_snapshot_url_public,
      }));

      setOffers(mode === "more" ? (prev) => [...prev, ...mapped] : mapped);
      setAfter(nextAfter);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Erro desconhecido ao carregar ofertas");
      if (mode === "initial") setOffers([]);
    } finally {
      if (mode === "initial") setLoading(false);
      if (mode === "more") setLoadingMore(false);
    }
  }

  // carga inicial / troca de país
  useEffect(() => {
    fetchOffers(undefined, "initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  // fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOfferClick = (offer: Offer) => {
    if (offer.link) window.open(offer.link, "_blank");
  };

  const organizeIntoColumns = () => {
    const columns: Offer[][] = [[], [], [], [], []];
    offers.forEach((offer, index) => {
      columns[index % 5].push(offer);
    });
    return columns;
  };

  const getFireFillPercentage = (adCount: number) => Math.min((adCount / 50) * 100, 100);

  const filteredCountries = ["Todos", ...ALL_COUNTRIES].filter((country) =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 👇 só mostra tela de loading quando realmente não há conteúdo
  if (loading && offers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-muted-foreground/40 border-t-foreground" />
          <p className="text-2xl font-semibold text-foreground">Carregando ofertas...</p>
        </div>
      </div>
    );
  }

  if (error && offers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center">
          <p className="mb-4 text-2xl font-semibold text-destructive">Erro ao carregar ofertas</p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchOffers(undefined, "initial")}
            className="mt-6 rounded-lg bg-destructive px-6 py-3 font-semibold text-destructive-foreground transition-colors hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl font-semibold text-foreground">Nenhuma oferta encontrada</p>
          <p className="mt-2 text-muted-foreground">Tente selecionar outro país</p>
        </div>
      </div>
    );
  }

  const columns = organizeIntoColumns();

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <label htmlFor="country-filter" className="text-base sm:text-lg font-medium text-muted-foreground">
              País:
            </label>
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex min-w-[180px] sm:min-w-[220px] items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm sm:text-base font-medium shadow-sm transition-colors hover:bg-card/80"
              >
                <span>{selectedCountry === "all" ? "Todos" : selectedCountry}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`h-5 w-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-[280px] sm:w-[320px] rounded-lg border border-border bg-popover shadow-lg">
                  <div className="border-b border-border p-3">
                    <input
                      type="text"
                      placeholder="Buscar país..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                            setSelectedCountry(country === "Todos" ? "all" : country);
                            setIsDropdownOpen(false);
                            setSearchTerm("");
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                            (selectedCountry === "all" && country === "Todos") || selectedCountry === country
                              ? "bg-muted font-semibold"
                              : "text-foreground"
                          }`}
                        >
                          {country}
                        </button>
                      ))
                    ) : (
                      <div className="px-6 py-4 text-center text-sm text-muted-foreground">Nenhum país encontrado</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid responsiva */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-4 sm:gap-6">
              {column.map((offer) => (
                <div
                  key={offer.id}
                  className="group flex h-[320px] sm:h-[340px] lg:h-[350px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow transition-all hover:scale-[1.01] hover:shadow-lg"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 bg-muted/60 px-4 py-2 border-b border-border">
                    <Image src="/meta-icon.png" alt="Meta" width={24} height={24} className="h-6 w-6 object-contain" />
                    <span className="text-xs sm:text-sm font-semibold">META</span>
                  </div>

                  {/* Imagem */}
                  <div className="relative h-full w-full overflow-hidden">
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
                      <span className="text-xs sm:text-sm font-medium">{offer.adCount} anúncios</span>
                      <span className="text-[11px] sm:text-xs text-muted-foreground">Nicho: {offer.niche || "-"}</span>
                    </div>

                    {/* Termômetro */}
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 sm:h-8 sm:w-8 opacity-30">
                        <path
                          fillRule="evenodd"
                          d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                          clipRule="evenodd"
                        />
                      </svg>

                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(${100 - getFireFillPercentage(offer.adCount)}% 0 0 0)` }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-7 w-7 sm:h-8 sm:w-8 transition-all ${offer.adCount >= 15 ? "text-red-500" : offer.adCount >= 10 ? "text-orange-500" : "text-yellow-500"}`}>
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

        {/* Paginação */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => after && fetchOffers(after, "more")}
            disabled={!after || loadingMore}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {after ? (loadingMore ? "Carregando..." : "Carregar mais") : "Sem mais resultados"}
          </button>
        </div>
      </div>
    </div>
  );
}
