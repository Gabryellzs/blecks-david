"use client"

import Image from "next/image"
import { memo } from "react"

export const HeroSection = memo(function HeroSection() {
  return (
    <section
      id="hero"
      className="relative py-12 md:py-20 lg:py-32 overflow-hidden min-h-screen flex items-center"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left side - Text content */}
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                  DOMINE CADA DETALHE DA SUA{" "}
                  <span className="text-gray-600">OPERAÇÃO</span>
                </h1>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white/90 leading-tight">
                  E ESCALE SUA <span className="text-gray-600">OPERAÇÃO</span> COM TOTAL PRECISÃO
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                  A solução completa que você precisa para automatizar processos, aumentar produtividade e escalar seu
                  negócio de forma inteligente.
                </p>
              </div>

              {/* Centralizing botão no mobile */}
              <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start justify-center lg:justify-start">
                <div className="glowbox glowbox-active w-full sm:w-auto lg:max-w-xs lg:-ml-12">
                  <div className="glowbox-animations">
                    <div className="glowbox-glow"></div>
                    <div className="glowbox-stars-masker">
                      <div className="glowbox-stars"></div>
                    </div>
                  </div>
                  <div className="glowbox-borders-masker">
                    <div className="glowbox-borders"></div>
                  </div>
                  <a href="/register">
                    <div className="btn-cta-box">
                      <div className="btn-cta">TESTE GRÁTIS POR 7 DIAS</div>
                      <img src="/images/design-mode/seta-2.svg" className="arrow-icon" alt="Seta" />
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Right side - Logo rotativo */}
            <div className="relative flex items-center justify-center mt-8 lg:mt-0">
              <div className="relative">
                <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Image
                    src="/logo.png"
                    alt="Logo da empresa"
                    width={300}
                    height={300}
                    className="animate-rotateY opacity-90 hover:opacity-100 transition-opacity duration-300 w-48 h-48 md:w-60 md:h-60 lg:w-72 lg:h-72"
                    priority
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 md:w-16 md:h-16 bg-primary/30 rounded-full blur-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})
