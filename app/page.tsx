"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { CleanSection } from "@/components/clean-section"
import { FeaturesSection } from "@/components/features-section"
import { CleanSectionThree } from "@/components/clean-section-three"
import { CleanSectionTwo } from "@/components/clean-section-two"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"
import { CleanSectionFour } from "@/components/clean-section-four"
import { CleanSectionFive } from "@/components/clean-section-five"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CleanSection />
        <FeaturesSection />
        <CleanSectionThree />
        <CleanSectionTwo />
        <CleanSectionFour />
        <CleanSectionFive />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
