import { type NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"

export async function POST(req: NextRequest) {
  try {
    const { content, url } = await req.json()

    if (!content || !content.html) {
      return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 })
    }

    // Criar um novo arquivo ZIP
    const zip = new JSZip()

    // Adicionar o HTML principal
    zip.file("index.html", content.html)

    // Adicionar os arquivos CSS
    const cssFolder = zip.folder("css")
    if (content.css && Array.isArray(content.css)) {
      content.css.forEach((css: string, index: number) => {
        cssFolder?.file(`style-${index + 1}.css`, css)
      })
    }

    // Adicionar os arquivos JavaScript
    const jsFolder = zip.folder("js")
    if (content.js && Array.isArray(content.js)) {
      content.js.forEach((js: string, index: number) => {
        jsFolder?.file(`script-${index + 1}.js`, js)
      })
    }

    // Adicionar recursos (imagens, etc.)
    const assetsFolder = zip.folder("assets")
    if (content.assets && Array.isArray(content.assets)) {
      content.assets.forEach((asset: any, index: number) => {
        try {
          if (asset.url) {
            // Use the URL as the filename if possible
            const fileName = asset.url.split("/").pop() || `asset-${index + 1}`

            // If we have data and it's a base64 string, try to add it
            if (asset.data && typeof asset.data === "string" && asset.data.startsWith("data:")) {
              // Extract the base64 part
              const base64Data = asset.data.split(",")[1]
              if (base64Data) {
                assetsFolder?.file(fileName, base64Data, { base64: true })
              } else {
                // Just store the URL as text if we can't extract base64 data
                assetsFolder?.file(`${fileName}.txt`, `URL original: ${asset.url}\nTipo: ${asset.type || "unknown"}`)
              }
            } else if (asset.data && typeof asset.data === "string") {
              // If it's not a data URL but still a string, store it as is
              assetsFolder?.file(fileName, asset.data)
            } else {
              // Just store the URL as text
              assetsFolder?.file(`${fileName}.txt`, `URL original: ${asset.url}\nTipo: ${asset.type || "unknown"}`)
            }
          }
        } catch (assetError) {
          console.error("Error processing asset:", assetError)
          // Continue with other assets even if one fails
        }
      })
    }

    // Se tivermos um screenshot, adicioná-lo com tratamento de erro
    if (content.screenshot) {
      try {
        // Ensure it's a valid base64 string
        if (typeof content.screenshot === "string") {
          // If it's already a clean base64 string
          if (/^[A-Za-z0-9+/=]+$/.test(content.screenshot)) {
            zip.file("screenshot.png", content.screenshot, { base64: true })
          }
          // If it's a data URL, extract the base64 part
          else if (content.screenshot.startsWith("data:")) {
            const base64Data = content.screenshot.split(",")[1]
            if (base64Data) {
              zip.file("screenshot.png", base64Data, { base64: true })
            }
          }
        }
      } catch (screenshotError) {
        console.error("Error processing screenshot:", screenshotError)
        // Continue without the screenshot if there's an error
      }
    }

    // Add a readme file with information about the cloned site
    const readmeContent = `
# Site Clonado

URL original: ${url || "Não especificada"}
Data de clonagem: ${new Date().toLocaleString()}

## Conteúdo

- index.html: Página principal
- css/: Arquivos CSS
- js/: Arquivos JavaScript
- assets/: Recursos (imagens, etc.)
- screenshot.png: Captura de tela do site (se disponível)

## Como usar

Abra o arquivo index.html em um navegador para visualizar o site clonado.
`
    zip.file("README.md", readmeContent)

    // Gerar o arquivo ZIP
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    })

    // Retornar o arquivo ZIP
    return new Response(zipBlob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${content.format === "wordpress" ? "wordpress-export.zip" : "cloned-site.zip"}`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar download:", error)
    return NextResponse.json({ error: "Erro ao gerar arquivo para download" }, { status: 500 })
  }
}
