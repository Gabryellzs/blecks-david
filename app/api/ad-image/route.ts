import { NextResponse } from "next/server"
import puppeteer from "puppeteer-core"
import puppeteerFull from "puppeteer" // usado só em dev
import chromium from "@sparticuz/chromium"
import path from "node:path"
import fs from "node:fs/promises"
import { existsSync, mkdirSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const maxDuration = 120 // 2 minutos

const TTL = Number(process.env.AD_IMAGE_TTL_SECONDS || 60 * 60 * 24 * 7) // 7 dias
const USE_SUPABASE =
  !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = "ad-images"

function nowSec() {
  return Math.floor(Date.now() / 1000)
}

// ----------------- CACHE LOCAL (/tmp ou .ad-cache) -----------------
function getLocalCacheDir() {
  if (process.env.VERCEL) return "/tmp/ad-cache"
  return path.join(process.cwd(), ".ad-cache")
}

function localFilePath(id: string) {
  return path.join(getLocalCacheDir(), `${id}.png`)
}

// ----------------- BROWSER (DEV + PRODUÇÃO) -----------------
async function getBrowser() {
  const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL

  if (isProd) {
    console.log("[ad-image] Usando chromium (produção)")
    const executablePath = await chromium.executablePath()
    if (!executablePath) {
      console.error("[ad-image] chromium.executablePath() retornou vazio")
      throw new Error("Chromium executablePath not found")
    }

    return puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      defaultViewport: { width: 1360, height: 1000 },
    })
  }

  console.log("[ad-image] Usando puppeteer-full (local)")
  return puppeteerFull.launch({
    headless: true,
    defaultViewport: { width: 1360, height: 1000 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
}

// ----------------- CAPTURA DO CRIATIVO -----------------
async function renderCreativePng(adId: string): Promise<Buffer | null> {
  const token =
    process.env.META_ACCESS_TOKEN || process.env.FB_USER_TOKEN_LONG || ""
  const base = `https://www.facebook.com/ads/archive/render_ad/?id=${adId}`
  const renderUrl = token
    ? `${base}&access_token=${encodeURIComponent(token)}`
    : base

  let browser: puppeteer.Browser | null = null

  try {
    browser = await getBrowser()

    const page = await browser.newPage()
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
    )
    await page.setExtraHTTPHeaders({
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const openAndPrep = async (url: string) => {
      console.log("[ad-image] Abrindo URL:", url)
      await page.goto(url, {
        waitUntil: ["domcontentloaded", "networkidle0"],
        timeout: 90_000,
      })

      try {
        const cookieBtn =
          (await page.$('button:has-text("Permitir todos")')) ||
          (await page.$('button:has-text("Aceitar todos")')) ||
          (await page.$('button[aria-label*="aceitar"]'))
        if (cookieBtn) {
          await cookieBtn.click()
          await sleep(500)
        }
      } catch (e) {
        console.warn("[ad-image] Erro ao tentar clicar no cookie banner:", e)
      }
    }

    const mediaSelector = [
      'img[src*="scontent"][src*="fbcdn"]',
      "video",
      'div[style*="background-image"][style*="scontent"]',
    ].join(",")

    // 1) Tenta render_ad
    try {
      await openAndPrep(renderUrl)
      await page.waitForSelector(mediaSelector, { timeout: 20000 })
    } catch (e) {
      console.warn(
        `[ad-image] Falha no render_ad (id: ${adId}), tentando library...`,
        e,
      )
      // 2) Fallback: library
      try {
        await openAndPrep(
          `https://www.facebook.com/ads/library/?id=${adId}`,
        )
        await page.waitForSelector(mediaSelector, { timeout: 20000 })
      } catch (fallbackError) {
        console.error(
          `[ad-image] Falha total (render_ad + library) para id: ${adId}`,
          fallbackError,
        )
        // Último fallback: screenshot da página inteira
        const full = (await page.screenshot({
          type: "png",
          fullPage: true,
        })) as Buffer
        return full
      }
    }

    await sleep(1000)

    const candidates = await page.$$(
      [
        'img[src*="scontent"][src*="fbcdn"]',
        "video",
        'div[style*="background-image"][style*="scontent"]',
        'div[style*="background-image"]',
        '[role="img"]',
        "img",
      ].join(","),
    )

    type Scored = {
      area: number
      box: puppeteer.BoundingBox
      h: puppeteer.ElementHandle<Element>
    }
    const scored: Scored[] = []

    for (const h of candidates) {
      const b = await h.boundingBox()
      if (!b) continue
      const tooSmall = b.width < 140 || b.height < 140
      const ar = b.width / (b.height || 1)
      const tooThin = ar < 0.3 || ar > 3.0
      if (tooSmall || tooThin) continue
      scored.push({ h, area: b.width * b.height, box: b })
    }

    let png: Buffer

    if (scored.length) {
      scored.sort((a, b) => b.area - a.area)
      const best = scored[0]
      const pad = 6
      const clip = {
        x: Math.max(0, best.box.x - pad),
        y: Math.max(0, best.box.y - pad),
        width: Math.max(1, best.box.width + pad * 2),
        height: Math.max(1, best.box.height + pad * 2),
      }
      png = (await page.screenshot({ type: "png", clip })) as Buffer
    } else {
      console.warn(
        `[ad-image] Nenhum candidato de mídia pra id ${adId}, usando fullPage`,
      )
      png = (await page.screenshot({
        type: "png",
        fullPage: true,
      })) as Buffer
    }

    return png
  } catch (e) {
    console.error(`Erro geral no renderCreativePng para id ${adId}:`, e)
    return null
  } finally {
    try {
      await browser?.close()
    } catch {}
  }
}

// ----------------- SUPABASE -----------------
async function getSupabase() {
  if (!USE_SUPABASE) return null
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

async function supabaseGetSignedUrl(id: string) {
  const supabase = await getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(`${id}.png`, TTL)
  if (error) {
    console.warn("[ad-image] createSignedUrl error:", error.message)
    return null
  }
  return data.signedUrl
}

async function supabaseUpload(id: string, png: Buffer) {
  const supabase = await getSupabase()
  if (!supabase) return false
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${id}.png`, png, {
      contentType: "image/png",
      upsert: true,
    })
  if (error) {
    console.error("[ad-image] upload error:", error.message)
    return false
  }
  return true
}

// ----------------- ROUTE -----------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing ad id" }, { status: 400 })
  }

  let png: Buffer | null = null

  // 1) Primeiro tenta Supabase
  if (USE_SUPABASE) {
    const signed = await supabaseGetSignedUrl(id)
    if (signed) {
      return NextResponse.redirect(signed, { status: 302 })
    }

    png = await renderCreativePng(id)

    if (!png) {
      return NextResponse.json(
        { error: "Creative not found or render failed" },
        { status: 404 },
      )
    }

    await supabaseUpload(id, png)
    const url = await supabaseGetSignedUrl(id)
    if (url) {
      return NextResponse.redirect(url, { status: 302 })
    }

    // Fallback se Supabase falhar
    return new NextResponse(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": `public, max-age=${TTL}`,
      },
    })
  }

  // 2) Fallback: cache local em /tmp
  const dir = getLocalCacheDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const file = localFilePath(id)

  try {
    const stat = await fs.stat(file)
    const age = nowSec() - Math.floor(stat.mtimeMs / 1000)
    if (age < TTL) {
      const pngBuffer = await fs.readFile(file)
      return new NextResponse(pngBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": `public, max-age=${TTL}`,
        },
      })
    }
  } catch {}

  png = await renderCreativePng(id)

  if (!png) {
    return NextResponse.json(
      { error: "Creative not found or render failed" },
      { status: 404 },
    )
  }

  try {
    await fs.writeFile(file, png)
  } catch (e) {
    console.error("[ad-image] Failed to write /tmp:", e)
  }

  return new NextResponse(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${TTL}`,
    },
  })
}
