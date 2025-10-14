// app/page.tsx
"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

import { Header } from "@/components/header"
import { CleanSection } from "@/components/clean-section"
import { FeaturesSection } from "@/components/features-section"
import { CleanSectionThree } from "@/components/clean-section-three"
import { CleanSectionTwo } from "@/components/clean-section-two"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

/** helper: usa export nomeado se existir, senão usa default */
const pick = <T, K extends keyof T>(mod: T, key: K) =>
  (mod && (mod as any)[key]) ? (mod as any)[key] : (mod as any).default

// ⚠️ Carregar os “animados” sem SSR e com fallback de export
const HeroSection = dynamic(
  () => import("@/components/hero-section").then((m) => pick(m, "HeroSection")),
  { ssr: false, loading: () => null }
)

const CleanSectionFour = dynamic(
  () => import("@/components/clean-section-four").then((m) => pick(m, "CleanSectionFour")),
  { ssr: false, loading: () => null }
)

const CleanSectionFive = dynamic(
  () => import("@/components/clean-section-five").then((m) => pick(m, "CleanSectionFive")),
  { ssr: false, loading: () => null }
)

/** Fallback estático para o Hero durante o SSR/primeiro paint */
function FallbackHero() {
  return (
    <section className="w-full bg-gradient-to-b from-black/40 to-transparent">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">BLECK&apos;s</p>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          DOMINE CADA DETALHE DA SUA <span className="opacity-70">OPERAÇÃO</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          A solução completa para automatizar processos, aumentar produtividade e escalar seu negócio.
        </p>
        <div className="mt-8">
          <a
            href="/register"
            className="inline-flex items-center rounded-full border px-5 py-3 text-sm font-semibold hover:bg-white/5"
          >
            Teste grátis por 7 dias →
          </a>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero visível no SSR; troca para versão animada após mount */}
        {!mounted ? <FallbackHero /> : <HeroSection />}

        {/* Blocos “seguros” (sem framer-motion/Window no render) */}
        <CleanSection />
        <FeaturesSection />
        <CleanSectionThree />
        <CleanSectionTwo />
        <TestimonialsSection />
        <FAQSection />

        {/* Blocos animados só no cliente */}
        {mounted && (
          <>
            <CleanSectionFour />
            <CleanSectionFive />
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
