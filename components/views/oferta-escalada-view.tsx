"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface Offer {
  id: number
  title: string
  description: string
  imageUrl: string
  category: string
  adsCount: number
  level: "Alto" | "Médio" | "Baixo"
}

export default function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mockOffers: Offer[] = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      title: `Oferta ${i + 1}`,
      description: `Descrição da oferta ${i + 1}`,
      imageUrl: `/placeholder.svg?height=250&width=300&query=oferta-${i + 1}`,
      category: `Categoria ${Math.floor(i / 10) + 1}`,
      adsCount: Math.floor(Math.random() * 100) + 1,
      level: ["Alto", "Médio", "Baixo"][Math.floor(Math.random() * 3)] as "Alto" | "Médio" | "Baixo",
    }))

    setOffers(mockOffers)
    setLoading(false)
  }, [])

  const handleOfferClick = (offer: Offer) => {
    alert(`Você clicou em: ${offer.title}`)
  }

  const organizeIntoColumns = () => {
    const columns: Offer[][] = [[], [], [], [], []]
    offers.forEach((offer, index) => columns[index % 5].push(offer))
    return columns
  }

  const getFireIntensity = (adsCount: number) => {
    if (adsCount >= 20) return { color: "text-red-500", opacity: "opacity-100", label: "Alto" }
    if (adsCount >= 10) return { color: "text-orange-500", opacity: "opacity-80", label: "Médio" }
    return { color: "text-yellow-500", opacity: "opacity-60", label: "Baixo" }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-2xl">Carregando ofertas...</p>
      </div>
    )
  }

  const columns = organizeIntoColumns()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-[2000px]">
        <h1 className="mb-12 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/90 bg-clip-text text-center text-5xl font-bold text-transparent">
          OFERTAS ESCALADAS
        </h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-6">
              {column.map((offer) => {
                const fire = getFireIntensity(offer.adsCount)

                return (
                  <div
                    key={offer.id}
                    className="group flex h-[350px] flex-col overflow-hidden rounded-2xl border bg-card shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  >
                    {/* imagem */}
                    <div className="relative h-full w-full overflow-hidden">
                      <Image
                        src={offer.imageUrl || "/placeholder.svg"}
                        alt={offer.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* gradiente mais forte no rodapé */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      {/* TEXTO AGORA COLADO EMBAIXO DA IMAGEM */}
                      <div className="absolute inset-0 flex items-end p-5 pb-6">
                        <div>
                          <h3 className="mb-1 text-xl font-bold text-white drop-shadow">{offer.title}</h3>
                          <p className="text-sm leading-relaxed text-white/80 drop-shadow">
                            {offer.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* botão */}
                    <button
                      onClick={() => handleOfferClick(offer)}
                      className="w-full bg-muted/60 py-4 text-xl font-bold tracking-wide text-foreground transition-colors hover:bg-muted"
                    >
                      VER OFERTA
                    </button>

                    {/* rodapé de métricas */}
                    <div className="flex items-center justify-between border-t bg-card px-5 py-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        {offer.adsCount} anúncios
                      </span>
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={`h-5 w-5 ${fire.color} ${fire.opacity}`}
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className={`text-xs font-semibold ${fire.color}`}>{fire.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
