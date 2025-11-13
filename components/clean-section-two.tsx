"use client"

import { useEffect, useRef, useState, useMemo, memo } from "react"
import Image from "next/image"

// Lista das plataformas
const timelineItems = [
  {
    year: "SISTEMA DE RASTREAMENTO",
    title: "TODAS AS PLATAFORMAS",
    description: "Rastreie suas vendas com precisão e escale sem medo.",
    logo: null,
  },
  {
    year: "META ADS",
    title: "Analise suas métricas",
    description: "",
    logo: "/ads-logos/meta-ads.png",
  },
  {
    year: "GOOGLE ADS",
    title: "Expansão de Recursos",
    description: "Expandimos nossa plataforma com IA avançada e analytics em tempo real.",
    logo: "/ads-logos/google-ads.png",
  },
  {
    year: "ANALYTICS",
    title: "Reconhecimento Internacional",
    description: "Prêmio de Melhor Plataforma de Gestão Empresarial.",
    logo: "/ads-logos/google-analytics.png",
  },
  {
    year: "TIKTOK ADS",
    title: "Integração com IA",
    description: "Implementação de IA para automação completa.",
    logo: "/ads-logos/tiktok-ads.png",
  },
  {
    year: "KWAI ADS",
    title: "Expansão Global",
    description: "Suporte internacional e operação 24/7.",
    logo: "/ads-logos/kwai-ads.png",
  },
] as const

export const CleanSectionTwo = memo(function CleanSectionTwo() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const [isCopywritingSectionVisible, setIsCopywritingSectionVisible] = useState(false)

  const sectionRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const copywritingSectionRef = useRef<HTMLDivElement | null>(null)

  const timelineObserverRef = useRef<IntersectionObserver | null>(null)
  const copywritingObserverRef = useRef<IntersectionObserver | null>(null)

  // OBSERVERS
  useEffect(() => {
    // Timeline
    if (!timelineObserverRef.current) {
      timelineObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = itemRefs.current.findIndex((ref) => ref === entry.target)
              if (index !== -1) {
                setVisibleCards((prev) =>
                  prev.includes(index) ? prev : [...prev, index].sort((a, b) => a - b),
                )
              }
            }
          })
        },
        { threshold: 0.1, rootMargin: "50px" },
      )
    }

    // Copywriting
    if (!copywritingObserverRef.current) {
      copywritingObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setIsCopywritingSectionVisible(true)
          })
        },
        { threshold: 0.2, rootMargin: "50px" },
      )
    }

    itemRefs.current.forEach((ref) => {
      if (ref && timelineObserverRef.current) timelineObserverRef.current.observe(ref)
    })

    if (copywritingSectionRef.current && copywritingObserverRef.current) {
      copywritingObserverRef.current.observe(copywritingSectionRef.current)
    }

    return () => {
      timelineObserverRef.current?.disconnect()
      copywritingObserverRef.current?.disconnect()
    }
  }, [])

  // Altura da linha
  const lineHeight = useMemo(() => {
    if (visibleCards.length === 0) return "0%"
    const last = Math.max(...visibleCards)
    return `${((last + 1) / timelineItems.length) * 100}%`
  }, [visibleCards])

  return (
    <section
      ref={sectionRef}
      className="relative py-12 md:py-16 lg:py-20 overflow-hidden bg-black"
    >
      {/* Luzes de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(90,90,90,0.22),rgba(0,0,0,1) 60%)] z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(60,60,60,0.18),transparent 70%)] opacity-70 z-0" />

      <div className="container mx-auto px-4 relative z-10">
        {/* TIMELINE */}
        <div className="flex justify-center items-start min-h-[400px] md:min-h-[500px]">
          <div className="relative max-w-6xl w-full">
            {/* Ponto inicial */}
            <div
              className={`absolute left-6 md:left-1/2 transform md:-translate-x-1/2 -top-2 z-10 transition-all ${
                visibleCards.length ? "opacity-100 scale-100" : "opacity-0 scale-0"
              }`}
            >
              <div className="w-3 h-3 bg-gray-200 border-2 border-gray-300 rounded-full shadow-xl" />
            </div>

            {/* Linha vertical */}
            <div
              className="absolute left-6 md:left-1/2 transform md:-translate-x-1/2 w-[3px] bg-gray-600 transition-all duration-700"
              style={{ height: lineHeight, top: 0 }}
            />

            {/* Ponto final */}
            <div
              className={`absolute left-6 md:left-1/2 transform md:-translate-x-1/2 z-10 transition-all ${
                visibleCards.length === timelineItems.length ? "opacity-100 scale-100" : "opacity-0 scale-0"
              }`}
              style={{ top: `calc(${lineHeight} - 6px)` }}
            >
              <div className="w-3 h-3 bg-gray-200 border-2 border-gray-300 rounded-full shadow-xl" />
            </div>

            {/* CARDS */}
            <div className="space-y-10">
              {timelineItems.map((item, index) => (
                <div
                  key={index}
                  ref={(el) => (itemRefs.current[index] = el)}
                  className={`relative flex flex-col md:flex-row items-start md:items-center justify-center transition-all transform-gpu ${
                    visibleCards.includes(index)
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* COLUNA DO CARD (LADO ESQUERDO OU DIREITO) */}
                  <div
                    className={`w-full md:w-5/12 pl-14 md:pl-0 ${
                      index % 2 === 0
                        ? "md:pr-16 md:text-right"
                        : "md:order-2 md:pl-16 md:text-left"
                    }`}
                  >
                    {/* CARD PREMIUM, AFASTADO DA LINHA */}
                    <div className="group relative">
                      {/* Glow em volta */}
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-zinc-300/20 via-zinc-100/10 to-zinc-300/20 blur-md opacity-40 group-hover:opacity-80 transition" />

                      {/* Corpo do card */}
                      <div className="relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.6)] group-hover:border-white/25 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300">
                        <div
                          className={`flex items-center gap-3 mb-4 ${
                            index % 2 === 0 ? "justify-start md:justify-end" : "justify-start"
                          }`}
                        >
                          {item.logo && (
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
                              <Image
                                src={item.logo}
                                width={32}
                                height={32}
                                alt={item.year}
                                className="object-contain"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Nome da plataforma SEM contorno */}
                          <span className="text-gray-200 text-xs md:text-sm font-semibold tracking-wide uppercase">
                            {item.year}
                          </span>
                        </div>

                        <h3 className="text-white text-lg md:text-xl font-bold mb-2 leading-tight">
                          {item.title}
                        </h3>

                        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PONTO NA LINHA (NO CENTRO) */}
                  <div className="absolute left-6 md:left-1/2 transform md:-translate-x-1/2 top-5 z-20">
                    <div
                      className={`w-5 h-5 bg-background border-2 border-gray-400 rounded-full transition-all ${
                        visibleCards.includes(index) ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      }`}
                    />
                  </div>

                  {/* COLUNA VAZIA DO OUTRO LADO – GARANTE ESPAÇO DA LINHA */}
                  <div className={`hidden md:block w-5/12 ${index % 2 === 0 ? "order-2" : ""}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COPYWRITING SECTION */}
        <div
          ref={copywritingSectionRef}
          className="mt-24 flex flex-col lg:flex-row items-start gap-8"
        >
          {/* IMAGEM */}
          <div
            className={`max-w-full lg:max-w-2xl transition-all duration-700 ${
              isCopywritingSectionVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-xl blur-md opacity-40" />

              <Image
                src="/copywriting-generator.png"
                alt="Copywriting Generator"
                width={900}
                height={700}
                className="relative w-full h-auto rounded-xl shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* TEXTO */}
          <div
            className={`flex-1 transition-all duration-700 delay-200 ${
              isCopywritingSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4 leading-tight">
              QUEM TEM AS MELHORES COPYS, DOMINA O MERCADO.
            </h2>

            <p className="text-gray-300 text-lg md:text-xl">
              Com apenas alguns cliques, você cria copys de alto impacto e escala resultados sem limites.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
})
