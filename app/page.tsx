// app/page.tsx
"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

import { Header } from "@/components/header"
import { CleanSection } from "@/components/clean-section"
import { FeaturesSection } from "@/components/features-section"
import { CleanSectionThree } from "@/components/clean-section-three"
import { CleanSectionTwo } from "@/components/clean-section-two"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

// 🔥 dynamic apontando para **exports nomeados**
const HeroSection = dynamic(
  () => import("@/components/hero-section").then((m) => m.HeroSection),
  { ssr: false, loading: () => null }
)

const CleanSectionFour = dynamic(
  () => import("@/components/clean-section-four").then((m) => m.CleanSectionFour),
  { ssr: false, loading: () => null }
)

const CleanSectionFive = dynamic(
  () => import("@/components/clean-section-five").then((m) => m.CleanSectionFive),
  { ssr: false, loading: () => null }
)

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Suspense fallback={null}>
          <HeroSection />
        </Suspense>

        <CleanSection />
        <FeaturesSection />
        <CleanSectionThree />
        <CleanSectionTwo />

        <Suspense fallback={null}>
          <CleanSectionFour />
          <CleanSectionFive />
        </Suspense>

        <TestimonialsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
