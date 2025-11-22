import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // 🔴 ISSO AQUI É O QUE VAI RESOLVER SEU PROBLEMA NA VERCEL
  experimental: {
    serverComponentsExternalPackages: [
      "@sparticuz/chromium",
      "@sparticuz/chromium-min",
      "puppeteer-core"
    ],
  },
}

export default nextConfig
