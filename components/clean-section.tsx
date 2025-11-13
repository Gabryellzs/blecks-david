"use client"

import { useEffect, useRef, useState, memo } from "react"
import Image from "next/image"

export const CleanSection = memo(function CleanSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = sectionRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: 0.3,
        rootMargin: "-50px 0px",
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-4 md:py-6 lg:py-8 overflow-hidden bg-black"
    >
      {/* ======= LUZ CINZA DO CANTO ESQUERDO SUPERIOR ======= */}
      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(circle_at_top_left,rgba(130,130,130,0.28),rgba(0,0,0,1) 65%)]
          opacity-90
          z-0
        "
      />

      {/* ======= LUZ SUAVE NO CANTO DIREITO ======= */}
      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(circle_at_right,rgba(80,80,80,0.18),transparent 70%)]
          opacity-60
          z-0
        "
      />

      {/* ======= CONTEÚDO ======= */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="min-h-[100px] flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
          {/* IMAGEM */}
          <div
            className={`w-full max-w-2xl transition-all duration-1000 ease-out ${
              isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
            }`}
          >
            <Image
              src="/images/design-mode/Captura%20de%20Tela%202025-09-05%20a%CC%80s%2019.28.46.png"
              alt="Dashboard Analytics"
              width={1280}
              height={720}
              className="w-full h-auto rounded-lg shadow-2xl border border-gray-800 neon-card neon-glow neon-pulse"
              loading="lazy"
              sizes="(min-width: 1024px) 640px, 100vw"
            />
          </div>

          {/* TEXTO */}
          <div
            className={`flex-1 max-w-xl transition-all duration-1000 ease-out delay-300 text-center lg:text-left ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight">
              QUEM TEM ACESSO AOS{" "}
              <span className="text-gray-300">DADOS, TEM O PODER</span> DE DOMINAR O MERCADO.
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
