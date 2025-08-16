import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

// Armazenamento temporário para progresso
const progressStore: Record<string, number> = {}

// Função principal para processar a requisição POST
export async function POST(req: NextRequest) {
  try {
    const { url, options, mode = "basic" } = await req.json()
    const requestId = req.nextUrl.searchParams.get("id") || Date.now().toString()

    progressStore[requestId] = 0

    if (!url) {
      return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 })
    }

    // Validar URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch (error) {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 })
    }

    // Atualizar progresso
    progressStore[requestId] = 10

    // Usar apenas o modo básico, que não depende do Playwright
    try {
      return await handleBasicClone(url, options, requestId)
    } catch (error) {
      console.error(`Erro no modo básico:`, error)
      return NextResponse.json(
        {
          error: `Erro ao processar o site: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          details: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json(
      {
        error: `Erro interno ao processar a solicitação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

async function handleBasicClone(url: string, options: any, requestId: string) {
  try {
    // Buscar o conteúdo do site
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Falha ao acessar o site: ${response.statusText}` },
        { status: response.status },
      )
    }

    progressStore[requestId] = 30

    const html = await response.text()
    const baseUrl = new URL(url).origin

    // Processar o HTML com cheerio
    const $ = cheerio.load(html)

    progressStore[requestId] = 50

    // Coletar estilos
    const cssArray: string[] = []
    if (options?.includeStyles) {
      // Extrair estilos inline
      $("style").each((_, el) => {
        const styleContent = $(el).html()
        if (styleContent) {
          cssArray.push(styleContent)
        }
      })

      // Extrair links para arquivos CSS
      $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr("href")
        if (href) {
          cssArray.push(`/* CSS de ${href} */\n/* Conteúdo não disponível no modo básico */`)
        }
      })
    }

    // Remover scripts se não forem solicitados
    if (!options?.includeScripts) {
      $("script").remove()
    }

    // Coletar scripts
    const jsArray: string[] = []
    if (options?.includeScripts) {
      $("script").each((_, el) => {
        const scriptContent = $(el).html()
        if (scriptContent && !$(el).attr("src")) {
          jsArray.push(scriptContent)
        } else if ($(el).attr("src")) {
          jsArray.push(`/* JavaScript de ${$(el).attr("src")} */\n/* Conteúdo não disponível no modo básico */`)
        }
      })
    }

    progressStore[requestId] = 70

    // Coletar recursos (imagens, etc.)
    const assets: { url: string; type: string }[] = []

    if (options?.includeImages) {
      $("img").each((_, el) => {
        const src = $(el).attr("src")
        if (src) {
          try {
            const fullUrl = src.startsWith("http") ? src : new URL(src, baseUrl).href
            assets.push({
              url: fullUrl,
              type: "image/unknown",
            })
          } catch (e) {
            // Ignorar URLs inválidas
            console.warn("URL de imagem inválida:", src)
          }
        }
      })
    }

    // Modificar links se necessário
    if (!options?.preserveLinks) {
      $("a").attr("target", "_blank")
    }

    progressStore[requestId] = 90

    // Retornar o conteúdo processado
    const result = {
      html: $.html(),
      css: cssArray,
      js: jsArray,
      assets,
    }

    progressStore[requestId] = 100

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro no modo básico:", error)
    return NextResponse.json({ error: "Erro ao processar o site no modo básico" }, { status: 500 })
  }
}

// Rota para obter o progresso
export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("id")

  if (!requestId || !progressStore[requestId]) {
    return NextResponse.json({ progress: 0 })
  }

  // Configurar cabeçalhos para SSE
  const headers = new Headers()
  headers.set("Content-Type", "text/event-stream")
  headers.set("Cache-Control", "no-cache")
  headers.set("Connection", "keep-alive")

  const progress = progressStore[requestId]
  const data = `data: ${JSON.stringify({ progress })}\n\n`

  return new Response(data, { headers })
}
