"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import Image from "next/image"

export function CleanSectionTwo() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const [isCopywritingSectionVisible, setIsCopywritingSectionVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const copywritingSectionRef = useRef<HTMLDivElement>(null)
  const timelineObserverRef = useRef<IntersectionObserver | null>(null)
  const copywritingObserverRef = useRef<IntersectionObserver | null>(null)

  const timelineItems = [
    {
      year: "SISTEMA DE RASTREAMENTO",
      title: "TODAS AS PLATAFORMAS",
      description: "Rastreie suas vendas com precisão e escale sem medo.",
      logo: null,
    },
    {
      year: "META ADS",
      title: "Analise suas suas metricas",
      description: "  ",
      logo: "/ads-logos/meta-ads.png",
    },
    {
      year: "Google ADS",
      title: "Expansão de Recursos",
      description: "Expandimos nossa plataforma com IA avançada e analytics em tempo real.",
      logo: "/ads-logos/google-ads.png",
    },
    {
      year: "Analitycs",
      title: "Reconhecimento Internacional",
      description: "Recebemos o prestigioso prêmio de Melhor Plataforma de Gestão Empresarial.",
      logo: "/ads-logos/google-analytics.png",
    },
    {
      year: "TikTok ADS",
      title: "Integração com IA",
      description: "Implementamos recursos de inteligência artificial para automação completa de processos.",
      logo: "/ads-logos/tiktok-ads.png",
    },
    {
      year: "Kwai ADS",
      title: "Expansão Global",
      description: "Expandimos nossa operação para mercados internacionais com suporte 24/7.",
      logo: "/ads-logos/kwai-ads.png",
    },
  ]

  useEffect(() => {
    if (!timelineObserverRef.current) {
      timelineObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = itemRefs.current.findIndex((ref) => ref === entry.target)
              if (index !== -1) {
                setVisibleCards((prev) => {
                  if (!prev.includes(index)) {
                    return [...prev, index].sort((a, b) => a - b)
                  }
                  return prev
                })
              }
            }
          })
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        },
      )
    }

    if (!copywritingObserverRef.current) {
      copywritingObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsCopywritingSectionVisible(true)
            }
          })
        },
        {
          threshold: 0.2,
          rootMargin: "50px",
        },
      )
    }

    itemRefs.current.forEach((ref) => {
      if (ref && timelineObserverRef.current) {
        timelineObserverRef.current.observe(ref)
      }
    })

    if (copywritingSectionRef.current && copywritingObserverRef.current) {
      copywritingObserverRef.current.observe(copywritingSectionRef.current)
    }

    return () => {
      if (timelineObserverRef.current) {
        timelineObserverRef.current.disconnect()
      }
      if (copywritingObserverRef.current) {
        copywritingObserverRef.current.disconnect()
      }
    }
  }, []) // Array de dependências vazio para executar apenas uma vez

  const lineHeight = useMemo(() => {
    if (visibleCards.length === 0) return "0%"
    const lastVisibleIndex = Math.max(...visibleCards)
    const totalItems = timelineItems.length
    return `${((lastVisibleIndex + 1) / totalItems) * 100}%`
  }, [visibleCards])

  return (
    <section ref={sectionRef} className="py-12 md:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-start min-h-[400px] md:min-h-[500px]">
          <div className="relative max-w-6xl w-full">
            <div
              className={`absolute left-4 md:left-1/2 transform md:-translate-x-1/2 z-20 -top-2 transition-all duration-300 ${
                visibleCards.length > 0 ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}
            >
              <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-200 border-2 border-grey-200 rounded-full shadow-lg"></div>
            </div>

            <div
              className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-0.5 bg-gray-600 transition-all duration-700 ease-out transform-gpu"
              style={{
                height: lineHeight,
                top: 0,
              }}
            ></div>

            <div
              className={`absolute left-4 md:left-1/2 transform md:-translate-x-1/2 z-20 transition-all duration-300 ${
                visibleCards.length === timelineItems.length ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}
              style={{
                top: `calc(${lineHeight} - 8px)`,
              }}
            >
              <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-200 border-2 border-grey-200 rounded-full shadow-lg"></div>
            </div>

            <div className="space-y-8 md:space-y-10">
              {timelineItems.map((item, index) => (
                <div
                  key={index}
                  ref={(el) => (itemRefs.current[index] = el)}
                  className={`relative flex flex-col md:flex-row items-start md:items-center justify-center transition-all duration-700 transform-gpu ${
                    visibleCards.includes(index) ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                  }`}
                  style={{
                    transitionDelay: `${index * 150}ms`,
                  }}
                >
                  <div
                    className={`w-full md:w-5/12 pl-12 md:pl-0 ${index % 2 === 0 ? "md:pr-8 md:text-right" : "md:order-2 md:pl-8 md:text-left"}`}
                  >
                    <div className="neon-card bg-card border border-border rounded-lg p-4 md:p-6">
                      <div
                        className={`flex items-center gap-3 mb-2 ${index % 2 === 0 ? "justify-start md:justify-end" : "justify-start"}`}
                      >
                        {item.logo && (
                          <Image
                            src={item.logo || "/placeholder.svg"}
                            alt={`${item.year} logo`}
                            width={24}
                            height={24}
                            className="md:w-8 md:h-8 object-contain"
                          />
                        )}
                        <div className="text-gray-400 text-base md:text-lg font-semibold">{item.year}</div>
                      </div>
                      <h3 className="text-white text-lg md:text-xl font-bold mb-2 md:mb-3">{item.title}</h3>
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 z-10 top-4 md:top-auto">
                    <div
                      className={`w-4 h-4 md:w-6 md:h-6 bg-background border-2 border-gray-400 rounded-full transition-all duration-300 ${
                        visibleCards.includes(index) ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      }`}
                    ></div>
                  </div>

                  <div className={`hidden md:block w-5/12 ${index % 2 === 0 ? "order-2" : ""}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          ref={copywritingSectionRef}
          className="mt-[80px] md:mt-[100px] lg:mt-[120px] flex flex-col lg:flex-row items-start gap-6 lg:gap-12"
        >
          <div
            className={`flex-shrink-0 max-w-full lg:max-w-2xl transition-all duration-800 ease-out transform-gpu ${
              isCopywritingSectionVisible ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"
            }`}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 rounded-lg blur-sm opacity-50"></div>
              <div className="relative">
                <Image
                  src="/copywriting-generator.png"
                  alt="Gerador de Copywriting Interface"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-lg relative z-10"
                  priority
                />
              </div>
            </div>
          </div>

          <div
            className={`flex-1 lg:pt-8 transition-all duration-800 ease-out delay-300 transform-gpu ${
              isCopywritingSectionVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
            }`}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 lg:mb-6 leading-tight">
              QUEM TEM AS MELHORES COPYS, DOMINA O MERCADO.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Com apenas alguns cliques, você cria copys de alto impacto e escala resultados sem limites.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
