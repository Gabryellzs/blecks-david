import { NextResponse } from "next/server"

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const META_VERSION = process.env.META_VERSION || "v24.0"

const getMockOffers = () => {
  const niches = ["Moda", "Tecnologia", "Alimentos", "Saúde", "Beleza", "Educação", "Fitness", "Viagem"]
  const countries = ["Brasil", "Estados Unidos", "Portugal", "Espanha", "México"]

  return Array.from({ length: 50 }, (_, i) => {
    const adCount = Math.floor(Math.random() * 50) + 1
    // Determinar level baseado em adCount
    let level: "low" | "medium" | "high"
    if (adCount >= 15) {
      level = "high"
    } else if (adCount >= 10) {
      level = "medium"
    } else {
      level = "low"
    }

    return {
      id: i + 1,
      title: `Oferta ${i + 1}`,
      description: `Descrição da oferta ${i + 1}`,
      imageUrl: `/placeholder.svg?height=300&width=400&query=product-${i + 1}`,
      category: "Meta Ads",
      adCount,
      level,
      niche: niches[Math.floor(Math.random() * niches.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
    }
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryFilter = searchParams.get("country")

    if (!META_ACCESS_TOKEN) {
      console.log("[v0] META_ACCESS_TOKEN not configured, using mock data")
      let offers = getMockOffers()

      if (countryFilter && countryFilter !== "all") {
        offers = offers.filter((offer) => offer.country === countryFilter)
      }

      return NextResponse.json(offers, { status: 200 })
    }

    const url = `https://graph.facebook.com/${META_VERSION}/ads_archive?ad_active_status=ACTIVE&limit=100&access_token=${META_ACCESS_TOKEN}`

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok || !data.data) {
      console.error("[v0] Meta API error:", data)
      // Retornar mock data em caso de erro
      return NextResponse.json(getMockOffers(), { status: 200 })
    }

    const offers = data.data.map((ad: any, index: number) => {
      const adCount = Math.floor(Math.random() * 100) + 1
      let level: "low" | "medium" | "high"
      if (adCount >= 15) {
        level = "high"
      } else if (adCount >= 10) {
        level = "medium"
      } else {
        level = "low"
      }

      return {
        id: index + 1,
        title: ad.page_name || "Anúncio Meta",
        description: ad.ad_creative_bodies?.[0] || "Sem descrição",
        imageUrl: "/meta-ad.jpg",
        category: "Meta Ads",
        adCount,
        level,
        niche: "Geral",
        country: countryFilter || "Brasil",
        link: ad.ad_snapshot_url,
      }
    })

    return NextResponse.json(offers, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in API route:", error)
    return NextResponse.json(getMockOffers(), { status: 200 })
  }
}
