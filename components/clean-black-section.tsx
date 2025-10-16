export function CleanBlackSection() {
  return (
    <section className="py-19 md:py-20 lg:py-24 bg-black relative">
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-card/20 pointer-events-none"></div>
      <div className="container mx-auto px-4">
        <div className="min-h-[200px] md:min-h-[300px] lg:min-h-[400px] flex items-center justify-center">
          {/* Seção limpa e preta - conteúdo pode ser adicionado aqui */}
        </div>
      </div>
    </section>
  )
}
