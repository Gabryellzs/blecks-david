"use client"

import { memo, useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

const INTERVAL_TIME = 7000 // 7 segundos

// =============================
// MÓDULOS
// =============================
const courseModules = [
  {
    icon: "Análise-De-Faturamento",
    title: "ANÁLISE DE FATURAMENTO",
    subtitle: "Análise completa e precisa do seu faturamento",
    description:
      "Tenha clareza total sobre seus números e tome decisões estratégicas para aumentar seus lucros mês após mês com dados precisos e insights acionáveis.",
  },
  {
    icon: "Diario-Semanal",
    title: "DIÁRIO SEMANAL",
    subtitle: "Tenha uma visão clara da sua semana",
    description:
      "Mantenha consistência, disciplina e crescimento constante. Organize seus pensamentos, acompanhe sua evolução e mantenha o foco no que realmente importa.",
  },
  {
    icon: "calendario",
    title: "CALENDÁRIO",
    subtitle: "Chega de ter a sua agenda desorganizada",
    description:
      "Transforme sua rotina: planeje, acompanhe e execute suas metas com muito mais eficiência.",
  },
  {
    icon: "ias",
    title: "IA'S",
    subtitle: "Tenha todas as IA's em um só lugar",
    description: "Acesse as melhores inteligências artificiais para acelerar seu trabalho.",
  },
] as const

type FeatureCardProps = {
  module: (typeof courseModules)[number]
  index: number
  isVisible: boolean
  active: boolean
}

// =============================
// CARD INDIVIDUAL
// =============================
const FeatureCard = memo(function FeatureCard({
  module,
  index,
  isVisible,
  active,
}: FeatureCardProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [hovered, setHovered] = useState(false)

  // Movimento com o mouse (apenas quando hover, bem mais leve)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hovered) return

      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const px = x / rect.width
      const py = y / rect.height

      const maxTilt = 6
      const ry = (px - 0.5) * maxTilt * 2
      const rx = (0.5 - py) * maxTilt * 2

      setTilt({ rx, ry })
    },
    [hovered],
  )

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    // volta suavemente pro “zero”
    setTilt({ rx: 0, ry: 0 })
  }, [])

  const isHoveredOrActive = hovered || active

  // ===== EFEITO DE ENTRADA DE BAIXO PRA CIMA =====
  const enterOffset = 40
  const translateY = isVisible ? 0 : enterOffset
  const scale = isVisible ? (isHoveredOrActive ? 1.02 : 1) : 0.96
  const opacity = isVisible ? 1 : 0

  const transform = `
    translateY(${translateY}px)
    rotateX(${tilt.rx}deg)
    rotateY(${tilt.ry}deg)
    scale(${scale})
  `

  return (
    <div
      ref={wrapperRef}
      className="group relative"
      style={{
        perspective: "1200px",
        transitionDelay: isVisible ? `${index * 110}ms` : "0ms",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* halo externo elegante - neon mais leve */}
      <div
        className="
          pointer-events-none absolute -inset-[0.5px] rounded-[26px]
          bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_65%)]
          blur-lg opacity-0
          group-hover:opacity-100
          transition-opacity duration-500
        "
      />

      {/* CARD */}
      <Card
        className={[
          "relative overflow-hidden flex flex-col h-full",
          "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl",
          "px-6 pt-7 pb-8 shadow-[0_14px_32px_rgba(0,0,0,0.55)]",
          isHoveredOrActive
            ? "border-neutral-200/40 shadow-[0_0_22px_rgba(255,255,255,0.16)]"
            : "",
        ].join(" ")}
        style={{
          transform,
          opacity,
          transformStyle: "preserve-3d",
          willChange: "transform, box-shadow, border-color, opacity",
          transition:
            "transform 320ms ease-out, border-color 240ms ease-out, box-shadow 240ms ease-out, opacity 520ms ease-out",
        }}
      >
        {/* borda interna */}
        <div className="pointer-events-none absolute inset-[1px] rounded-[22px] border border-white/6" />

        {/* CONTEÚDO */}
        <div className="relative z-10 flex flex-col h-full">
          <CardHeader className="pb-6 flex flex-col items-center text-center gap-4">
            {/* QUADRADO DO ÍCONE */}
            <div
              className={[
                "w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20",
                "flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.45)]",
                "group-hover:shadow-[0_0_16px_rgba(255,255,255,0.20)] group-hover:border-white/30",
              ].join(" ")}
              style={{ transform: "translateZ(26px)" }}
            >
              <Image
                src={`/icons-siderbar/${module.icon}.png`}
                alt={module.title}
                width={52}
                height={52}
                className="h-12 w-12 object-contain opacity-95"
                style={{ transform: "translateZ(34px)" }}
                loading="lazy"
              />
            </div>

            {/* TÍTULO + SUBTÍTULO */}
            <div
              className="flex flex-col items-center text-center gap-1"
              style={{ transform: "translateZ(20px)" }}
            >
              <CardTitle
                className="
                  text-[14px] font-semibold 
                  tracking-[0.05em] text-white uppercase 
                  whitespace-nowrap text-center
                "
              >
                {module.title}
              </CardTitle>

              <div className="text-xs md:text-sm text-neutral-300 font-medium leading-tight max-w-[90%]">
                {module.subtitle}
              </div>
            </div>

            {/* FAIXA DE NEON PREMIUM */}
            <div
              className="
                h-[2px] w-32 md:w-40 lg:w-48 mt-3
                bg-gradient-to-r from-transparent via-white/40 to-transparent
                transition-all duration-500
                group-hover:via-white/80
              "
              style={{
                transform: "translateZ(16px)",
                boxShadow: "0 0 6px rgba(255,255,255,0.20)",
              }}
            />
          </CardHeader>

          {/* DESCRIÇÃO */}
          <CardContent className="flex-1 flex items-start justify-center text-center px-2">
            <CardDescription className="text-[13px] text-neutral-100/90 leading-relaxed">
              {module.description}
            </CardDescription>
          </CardContent>
        </div>
      </Card>
    </div>
  )
})

// =============================
// SEÇÃO COMPLETA
// =============================
export const FeaturesSection = memo(function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeCard, setActiveCard] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  // aparece quando entra na tela
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      },
    )

    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  // troca automática dos cards (só muda destaque visual, sem animação pesada)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % courseModules.length)
    }, INTERVAL_TIME)

    return () => clearInterval(interval)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-20 relative bg-gradient-to-b from-black/90 via-black/80 to-black/95"
    >
      <div className="container mx-auto px-4">
        {/* ===== TÍTULO ===== */}
        <div className="text-center mb-14 md:mb-20">
          <h2 className="text-[36px] md:text-[44px] lg:text-[52px] font-bold uppercase tracking-[0.18em]">
            <span className="bg-gradient-to-r from-white via-neutral-200 to-white/60 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,255,255,0.28)]">
              OUTRAS ABAS
            </span>
          </h2>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {courseModules.map((module, index) => (
            <FeatureCard
              key={module.title}
              module={module}
              index={index}
              isVisible={isVisible}
              active={activeCard === index}
            />
          ))}
        </div>
      </div>
    </section>
  )
})
