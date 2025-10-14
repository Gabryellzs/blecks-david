"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { ErrorCatcher } from "@/components/dev/ErrorCatcher"

import { Header } from "@/components/header"
import { CleanSection } from "@/components/clean-section"
import { FeaturesSection } from "@/components/features-section"
import { CleanSectionThree } from "@/components/clean-section-three"
import { CleanSectionTwo } from "@/components/clean-section-two"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

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
        <ErrorCatcher name="HeroSection">
          <Suspense fallback={null}>
            <HeroSection />
          </Suspense>
        </ErrorCatcher>

        <ErrorCatcher name="CleanSection"><CleanSection /></ErrorCatcher>
        <ErrorCatcher name="FeaturesSection"><FeaturesSection /></ErrorCatcher>
        <ErrorCatcher name="CleanSectionThree"><CleanSectionThree /></ErrorCatcher>
        <ErrorCatcher name="CleanSectionTwo"><CleanSectionTwo /></ErrorCatcher>

        <ErrorCatcher name="CleanSectionFour">
          <Suspense fallback={null}>
            <CleanSectionFour />
          </Suspense>
        </ErrorCatcher>

        <ErrorCatcher name="CleanSectionFive">
          <Suspense fallback={null}>
            <CleanSectionFive />
          </Suspense>
        </ErrorCatcher>

        <ErrorCatcher name="TestimonialsSection"><TestimonialsSection /></ErrorCatcher>
        <ErrorCatcher name="FAQSection"><FAQSection /></ErrorCatcher>
      </main>
      <Footer />
    </div>
  )
}
