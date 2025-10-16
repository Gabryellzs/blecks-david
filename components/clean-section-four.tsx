"use client"

import PlacasPremiacao from "./placas-premiacao"

export function CleanSectionFour() {
  return (
    <section className="relative pb-5 md:pb-6 lg:pb-8 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />

      <div className="absolute top-10 md:top-20 left-10 md:left-20 w-16 h-16 md:w-32 md:h-32 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-16 md:bottom-32 right-16 md:right-32 w-12 h-12 md:w-24 md:h-24 bg-primary/30 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/3 w-8 h-8 md:w-16 md:h-16 bg-primary/15 rounded-full blur-xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Lado esquerdo - Placas */}
          <div className="relative">
            <PlacasPremiacao />
          </div>

          {/* Lado direito - Conteúdo */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              CONQUISTE SUAS
              <span className="block text-primary"> METAS DE FATURAMENTO</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
              Cada marco alcançado merece ser celebrado. Nossa plataforma te ajuda a escalar seu negócio de forma
              consistente e atingir patamares cada vez maiores de faturamento com total controle e precisão.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="shiny-button px-8 py-3 rounded-lg font-semibold transition-all duration-300">
                COMEÇAR AGORA
              </button>
              <button className="border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300">
                SAIBA MAIS
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
