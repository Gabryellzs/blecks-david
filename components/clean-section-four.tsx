"use client"

import PlacasPremiacao from "./placas-premiacao"

export function CleanSectionFour() {
  return (
    <section className="relative pb-5 md:pb-6 lg:pb-8 bg-black/80 overflow-hidden">
      {/* Fundo escuro com degradê */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-black/80 z-0" />

      {/* FEIXE DE LUZ CINZA NO CANTO ESQUERDO */}
      <div
        className="
          pointer-events-none
          absolute -left-24 md:-left-32 top-0
          h-[120%] w-40 md:w-56
          bg-gradient-to-b from-neutral-400/45 via-neutral-500/10 to-transparent
          blur-3xl
          opacity-80
          mix-blend-screen
          z-10
        "
      />

      {/* Luz suave à direita (opcional, só complementa o visual) */}
      <div
        className="
          pointer-events-none
          absolute bottom-10 md:bottom-24 right-0 md:right-10
          h-40 w-32 md:h-52 md:w-40
          bg-gradient-to-t from-primary/30 via-primary/10 to-transparent
          blur-3xl
          opacity-80
          mix-blend-screen
          z-10
        "
      />

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 relative z-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Lado esquerdo - Placas */}
          <div className="relative">
            <PlacasPremiacao />
          </div>

          {/* Lado direito - Texto e botões */}
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
