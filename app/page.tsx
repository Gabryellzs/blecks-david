import "./globals.css"
import dynamic from "next/dynamic"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { CleanSection } from "@/components/clean-section"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

// ===============================
// SEÇÕES PESADAS EM LAZY LOADING
// ===============================

// CleanSectionTwo
const CleanSectionTwo = dynamic(
  () =>
    import("@/components/clean-section-two").then((m) => m.CleanSectionTwo),
  {
    ssr: false,
    loading: () => <div className="h-32 md:h-40 lg:h-52 w-full" />,
  },
)

// CleanSectionThree
const CleanSectionThree = dynamic(
  () =>
    import("@/components/clean-section-three").then((m) => m.CleanSectionThree),
  {
    ssr: false,
    loading: () => <div className="h-32 md:h-40 lg:h-52 w-full" />,
  },
)

// CleanSectionFour
const CleanSectionFour = dynamic(
  () =>
    import("@/components/clean-section-four").then((m) => m.CleanSectionFour),
  {
    ssr: false,
    loading: () => <div className="h-32 md:h-40 lg:h-52 w-full" />,
  },
)

// CleanSectionFive
const CleanSectionFive = dynamic(
  () =>
    import("@/components/clean-section-five").then((m) => m.CleanSectionFive),
  {
    ssr: false,
    loading: () => <div className="h-32 md:h-40 lg:h-52 w-full" />,
  },
)

// TestimonialsSection
const TestimonialsSection = dynamic(
  () =>
    import("@/components/testimonials-section").then(
      (m) => m.TestimonialsSection,
    ),
  {
    ssr: false,
    loading: () => <div className="h-40 md:h-56 lg:h-72 w-full" />,
  },
)

// FAQSection
const FAQSection = dynamic(
  () => import("@/components/faq-section").then((m) => m.FAQSection),
  {
    ssr: false,
    loading: () => <div className="h-40 md:h-56 lg:h-72 w-full" />,
  },
)

export default function HomePage() {
  return (
    <div className="page-main min-h-screen bg-background">
      <Header />
      <main>
        {/* DOBRADA PRINCIPAL: CARREGA IMEDIATO */}
        <HeroSection />
        <CleanSection />
        <FeaturesSection />

        {/* SEÇÕES ABAIXO CARREGAM MAIS LEVE / NO CLIENTE */}
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
