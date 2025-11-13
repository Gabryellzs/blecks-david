"use client"

import { memo, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

const INTERVAL_TIME = 7000 // 7 segundos

// =============================
// MÓDULOS
// =============================
const courseModules = [
  {
    icon: "Análise De Faturamento",
    title: "ANÁLISE DE FATURAMENTO",
    subtitle: "Análise completa e precisa do seu faturamento",
    description:
      "Tenha clareza total sobre seus números e tome decisões estratégicas para aumentar seus lucros mês após mês com dados precisos e insights acionáveis.",
  },
  {
    icon: "diario-semanal",
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
    description:
      "Acesse as melhores inteligências artificiais para acelerar seu trabalho.",
  },
] as const

// =============================
// CARD INDIVIDUAL
// =============================
function FeatureCard({ module, index, isVisible, active }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [hovered, setHovered] = useState(false)
  const angleRef = useRef(0)

  // Movimento suave automático
  useEffect(() => {
    let frameId: number

    const animate = () => {
      angleRef.current += 0.015

      setTilt((prev) => {
        let rx = prev.rx
        let ry = prev.ry

        if (active && !hovered) {
          const amp = 3
          rx = Math.sin(angleRef.current) * amp
          ry = Math.cos(angleRef.current * 0.8) * amp
        } else if (!hovered) {
          const easing = 0.08
          rx = rx + (0 - rx) * easing
          ry = ry + (0 - ry) * easing
        }

        return { rx, ry }
      })

      frameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(frameId)
  }, [active, hovered])

  // Movimento com o mouse
  const handleMouseMove = (e) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = x / rect.width
    const py = y / rect.height

    const maxTilt = 10
    const ry = (px - 0.5) * maxTilt * 2
    const rx = (0.5 - py) * maxTilt * 2

    setTilt({ rx, ry })
  }

  const isHoveredOrActive = hovered || active

  const transform = `
    translateY(${isVisible ? 0 : 18}px)
    rotateX(${tilt.rx}deg)
    rotateY(${tilt.ry}deg)
    scale(${isHoveredOrActive ? 1.04 : 1})
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
      onMouseLeave={() => setHovered(false)}
    >
      {/* halo externo elegante - agora controlado só por CSS, sem piscar */}
      <div
        className="
          pointer-events-none absolute -inset-px rounded-[26px] blur-xl
          bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%)]
          opacity-0 group-hover:opacity-100
          transition-opacity duration-500
        "
      />

      {/* CARD */}
      <Card
        className={[
          "relative overflow-hidden flex flex-col h-full",
          "bg-white/5 backdrop-blur-2xl border border-white/12 rounded-3xl",
          "px-6 pt-7 pb-8 shadow-[0_20px_50px_rgba(0,0,0,0.55)]",
          isHoveredOrActive ? "border-neutral-200/50 shadow-[0_0_30px_rgba(255,255,255,0.18)]" : "",
        ].join(" ")}
        style={{
          transform,
          opacity: isVisible ? 1 : 0,
          transformStyle: "preserve-3d",
          transition:
            "transform 320ms ease-out, border-color 280ms ease-out, box-shadow 280ms ease-out, opacity 600ms ease-out",
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
                "flex items-center justify-center shadow-[0_6px_22px_rgba(0,0,0,0.5)]",
                "group-hover:shadow-[0_0_18px_rgba(255,255,255,0.22)] group-hover:border-white/35",
              ].join(" ")}
              style={{ transform: "translateZ(30px)" }}
            >
              <Image
                src={`/icons-siderbar/${module.icon}.png`}
                alt={module.title}
                width={52}
                height={52}
                className="h-12 w-12 object-contain opacity-95"
                style={{ transform: "translateZ(40px)" }}
              />
            </div>

            {/* TÍTULO + SUBTÍTULO */}
            <div
              className="flex flex-col items-center text-center gap-1"
              style={{ transform: "translateZ(22px)" }}
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

            {/* FAIXA DE NEON PREMIUM - estável, sem bug */}
            <div
              className="
                h-[2px] w-32 md:w-40 lg:w-48 mt-3
                bg-gradient-to-r from-transparent via-white/50 to-transparent
                transition-all duration-500
                group-hover:via-white/90
              "
              style={{
                transform: "translateZ(18px)",
                boxShadow: "0 0 10px rgba(255,255,255,0.25)",
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
}

// =============================
// SEÇÃO COMPLETA
// =============================
export const FeaturesSection = memo(function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeCard, setActiveCard] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  // aparece quando entra na tela
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true)
    })

    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  // troca automática dos cards
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
        {/* ===== TÍTULO LUXO FUTURISTA ===== */}
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
