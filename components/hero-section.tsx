import Image from "next/image"

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative pt-28 pb-12 md:pt-36 md:pb-16 lg:pt-40 lg:pb-20 overflow-hidden min-h-screen flex items-center"
    >
      {/* FUNDO PREMIUM + EFEITO CINZA METÁLICO LUXO */}
      <div className="absolute inset-0">
        {/* Base escura */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-black/90 backdrop-blur-[2px]" />

        {/* Luz cinza metálica suave — mesma usada no FOOTER */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(150,150,150,0.22),rgba(0,0,0,0.9)_65%)] opacity-65" />

        {/* Luz cinza discreta à direita — mesmo tom luxuoso */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(120,120,120,0.15),transparent_70%)] opacity-70" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* TEXTOS */}
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                  DOMINE CADA DETALHE DA SUA{" "}
                  <span className="text-gray-600">OPERAÇÃO</span>
                </h1>

                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
                  E ESCALE SUA <span className="text-gray-600">OPERAÇÃO</span> COM TOTAL PRECISÃO
                </h2>

                <p className="text-lg md:text-xl text-neutral-200 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  A solução completa que você precisa para automatizar processos, aumentar produtividade e escalar seu
                  negócio de forma inteligente.
                </p>
              </div>

              {/* BOTÃO */}
              <div className="flex justify-center lg:justify-start mt-10">
                <a
                  href="/register"
                  className="block hover:scale-[1.03] transition-transform duration-300"
                >
                  {/* SVG LUXO (mesmo estilo) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="-20 -20 920 220"
                    className="w-[260px] sm:w-[300px] md:w-[360px] lg:w-[380px]"
                  >
                    <defs>
                      <linearGradient id="outer" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0" stopColor="#141414" />
                        <stop offset="0.55" stopColor="#111111ff" />
                        <stop offset="1" stopColor="#141414" />
                      </linearGradient>

                      <linearGradient id="inner" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.10" />
                        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.04" />
                      </linearGradient>

                      <linearGradient id="gloss" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
                        <stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.06" />
                        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                      </linearGradient>

                      <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="10" result="blur" />
                        <feFlood floodColor="#b9b9b9" floodOpacity="0.75" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>

                      <filter id="shadow" x="-60%" y="-60%" width="220%" height="220%">
                        <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.55" />
                      </filter>
                    </defs>

                    {/* Cápsula externa */}
                    <rect
                      x="4"
                      y="9"
                      width="872"
                      height="160"
                      rx="80"
                      fill="url(#outer)"
                      stroke="#C8C8C8"
                      strokeWidth="1"
                      filter="url(#neon-glow)"
                    />

                    {/* Parte interna */}
                    <g transform="translate(80,38)">
                      <rect width="640" height="102" rx="51" fill="url(#inner)" stroke="#FFFFFF" strokeOpacity="0.05" />
                      <rect width="640" height="102" rx="51" fill="url(#gloss)" />
                    </g>

                    {/* Texto */}
                    <text
                      x="380"
                      y="101"
                      fontSize="32"
                      fontWeight="900"
                      letterSpacing="2.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      filter="url(#neon-glow)"
                    >
                      TESTE GRÁTIS POR 7 DIAS
                    </text>

                    {/* Seta */}
                    <g transform="translate(770,64)" filter="url(#neon-glow)">
                      <path d="M0 25 H40" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                      <path
                        d="M24 10 L40 25 L24 40"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </svg>
                </a>
              </div>
            </div>

            {/* LOGO */}
            <div className="relative flex items-center justify-center mt-8 lg:mt-0">
              <div className="relative">
                <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-zinc-300/10 via-zinc-600/10 to-transparent rounded-2xl flex items-center justify-center border border-zinc-300/20">
                  <Image
                    src="/logo.png"
                    alt="Logo da empresa"
                    width={300}
                    height={300}
                    className="animate-rotateY opacity-90 hover:opacity-100 transition-opacity duration-300 w-48 h-48 md:w-60 md:h-60 lg:w-72 lg:h-72"
                    priority
                  />
                </div>

                <div className="absolute -top-4 -right-4 w-16 h-16 md:w-20 md:h-20 bg-zinc-300/20 rounded-full blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-12 h-12 md:w-16 md:h-16 bg-zinc-400/30 rounded-full blur-lg" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
