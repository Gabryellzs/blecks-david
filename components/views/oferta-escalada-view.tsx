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
    // Simulating API call - replace with your actual API endpoint
    const fetchOffers = async () => {
      try {
        // TODO: Replace with your actual API endpoint
        // const response = await fetch('YOUR_API_ENDPOINT')
        // const data = await response.json()
        // setOffers(data)

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
      } catch (error) {
        console.error("[v0] Erro ao buscar ofertas:", error)
        setLoading(false)
      }
    }

    fetchOffers()
  }, [])

  const handleOfferClick = (offer: Offer) => {
    console.log("[v0] Oferta clicada:", offer)
    alert(`Você clicou em: ${offer.title}`)
    // TODO: Add your navigation or modal logic here
  }

  const organizeIntoColumns = () => {
    const columns: Offer[][] = [[], [], [], [], []]
    offers.forEach((offer, index) => {
      const columnIndex = index % 5
      columns[columnIndex].push(offer)
    })
    return columns
  }

  const getFireIntensity = (adsCount: number) => {
    if (adsCount >= 20) {
      return { color: "text-red-500", opacity: "opacity-100", label: "Alto" }
    } else if (adsCount >= 10) {
      return { color: "text-orange-500", opacity: "opacity-80", label: "Médio" }
    } else {
      return { color: "text-yellow-500", opacity: "opacity-60", label: "Baixo" }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-2xl text-white">Carregando ofertas...</p>
      </div>
    )
  }

  const columns = organizeIntoColumns()

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-[2000px]">
        <h1 className="mb-12 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-center text-5xl font-bold text-transparent">
          OFERTAS ESCALADAS
        </h1>

        <div className="grid grid-cols-5 gap-8">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-6">
              {column.map((offer) => {
                const fireIntensity = getFireIntensity(offer.adsCount)

                return (
                  <div
                    key={offer.id}
                    className="group flex h-[350px] flex-col overflow-hidden rounded-2xl border-2 border-gray-300 bg-white shadow-lg shadow-gray-400/50 transition-all duration-300 hover:scale-[1.02] hover:border-gray-400 hover:shadow-2xl hover:shadow-gray-500/50"
                  >
                    <div className="relative h-full w-full overflow-hidden">
                      <Image
                        src={offer.imageUrl || "/placeholder.svg"}
                        alt={offer.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-16 left-0 right-0 p-5">
                        <h3 className="mb-2 text-xl font-bold text-white drop-shadow-lg">{offer.title}</h3>
                        <p className="text-sm leading-relaxed text-gray-200 drop-shadow-md">{offer.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOfferClick(offer)}
                      className="w-full bg-gradient-to-b from-gray-100 to-gray-200 py-4 text-xl font-bold tracking-wide text-black transition-all duration-300 hover:from-white hover:to-gray-100 hover:shadow-inner"
                    >
                      VER OFERTA
                    </button>

                    <div className="flex items-center justify-between border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 px-5 py-4">
                      <span className="text-sm font-medium text-gray-600">{offer.adsCount} anúncios</span>
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={`h-6 w-6 ${fireIntensity.color} ${fireIntensity.opacity} drop-shadow-[0_0_8px_currentColor]`}
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className={`text-xs font-semibold ${fireIntensity.color}`}>{fireIntensity.label}</span>
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
