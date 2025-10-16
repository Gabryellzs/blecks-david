export function CleanSectionFive() {
  return (
    <section className="relative bg-background py-16 md:py-20 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Lado esquerdo vazio */}
          <div className="hidden lg:block"></div>

          {/* Lado direito com logo e texto */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            {/* Logo do funil */}
            <div className="w-48 md:w-56 lg:w-64">
              <img src="/images/logo-funil.png" alt="Logo funil de vendas" className="w-full h-auto" />
            </div>

            {/* Texto de impacto */}
            <div className="max-w-2xl">
              <p className="text-lg md:text-xl lg:text-2xl text-foreground leading-relaxed font-medium">
                <span className="text-primary font-bold">
                  VOCÊ TAMBÉM VAI TER NA PALMA DA SUA MÃO O CONTROLE ABSOLUTO DA SUA OPERAÇÃO
                </span>
                , acompanhando cada venda em tempo real e com a força necessária para escalar seus resultados sem
                limites.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
