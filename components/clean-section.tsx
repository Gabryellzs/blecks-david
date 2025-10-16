"use client"

import { useEffect, useRef, useState, memo } from "react"

export const CleanSection = memo(function CleanSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.3,
        rootMargin: "-50px 0px",
      },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  return (
    <section ref={sectionRef} className="py-4 md:py-6 lg:py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="min-h-[100px] flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
          <div
            className={`w-full max-w-2xl transition-all duration-1000 ease-out ${
              isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
            }`}
            style={{ willChange: isVisible ? "auto" : "transform, opacity" }}
          >
            <img
              src="/images/design-mode/Captura%20de%20Tela%202025-09-05%20a%CC%80s%2019.28.46.png"
              alt="Dashboard Analytics"
              className="w-full h-auto rounded-lg shadow-2xl border border-gray-800 neon-card neon-glow neon-pulse"
              loading="lazy"
            />
          </div>
          <div
            className={`flex-1 max-w-xl transition-all duration-1000 ease-out delay-300 text-center lg:text-left ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
            style={{ willChange: isVisible ? "auto" : "transform, opacity" }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight">
              QUEM TEM ACESSO AOS <span className="text-gray-300">DADOS, TEM O PODER</span> DE DOMINAR O MERCADO.
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mt-2 md:mt-3 font-semibold">
              ESSA DASHBOARD VAI LEVAR SUA OPERAÇÃO PARA OUTRO NÍVEL.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
})
