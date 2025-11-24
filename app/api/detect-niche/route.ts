import Groq from "groq-sdk"

export const runtime = "nodejs"
export const maxDuration = 60

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY não configurada")
      return Response.json({ result: [] }, { status: 200 })
    }

    const body = await req.json()
    const ads = Array.isArray(body.ads) ? body.ads : []

    if (!ads.length) {
      return Response.json({ result: [] }, { status: 200 })
    }

    // garante que não explode o prompt
    const contentList = ads.slice(0, 30).map((ad: any, index: number) => ({
      id: ad.id?.toString() ?? String(index),
      title: ad.title ?? "",
      description: ad.description ?? "",
    }))

    const categories = [
      "Marketing Digital / Negócios Online",
      "Finanças / Investimentos",
      "Relacionamentos",
      "Saúde / Emagrecimento",
      "Beleza / Estética",
      "Make / Moda",
      "Gastronomia / Receitas",
      "Pets",
      "Infantil / Maternidade",
      "Educação / Concursos / Estudos",
      "Religião / Espiritualidade",
      "Entretenimento / Séries / Filmes / Humor",
      "Jogos / Apostas / Cassino",
      "Carros / Motos",
      "Imóveis",
      "Outros",
    ]

    const adsText = JSON.stringify(contentList)

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Você é um classificador de anúncios. Para cada anúncio você escolhe exatamente UM nicho de uma lista fixa.",
        },
        {
          role: "user",
          content:
            `Categorias permitidas (escolha exatamente UMA por anúncio, em português): ${categories.join(
              "; "
            )}.\n\n` +
            "Entrada: uma lista JSON de anúncios com campos `id`, `title` e `description`.\n" +
            "Saída: um JSON no formato {\"result\":[{\"id\":\"...\",\"niche\":\"...\"}, ...]}.\n" +
            "Não invente categorias fora da lista. Se não tiver certeza, use 'Outros'.\n\n" +
            `Anúncios:\n${adsText}`,
        },
      ],
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content || "{}"

    let parsed: any = {}
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = {}
    }

    const result = Array.isArray(parsed.result) ? parsed.result : []

    return Response.json({ result }, { status: 200 })
  } catch (e) {
    console.error("Erro em /api/detect-niche:", e)
    return Response.json({ result: [] }, { status: 500 })
  }
}
