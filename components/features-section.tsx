"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CalendarIcon from "@/components/calendar-icon"
import { useEffect, useRef, useState, memo, useCallback } from "react"
import Image from "next/image"

const courseModules = [
  {
    icon: "revenue-analysis",
    title: "ANÁLISE DE FATURAMENTO",
    subtitle: "Análise completa e precisa do seu faturamento",
    description:
      "Tenha clareza total sobre seus números e tome decisões estratégicas para aumentar seus lucros mês após mês com dados precisos e insights acionáveis.",
  },
  {
    icon: "notebook-diary",
    title: "DIÁRIO SEMANAL",
    subtitle: "Tenha uma visão clara da sua semana",
    description:
      "Mantenha consistência, disciplina e crescimento constante. Organize seus pensamentos, acompanhe sua evolução e mantenha o foco no que realmente importa para seus resultados.",
  },
  {
    icon: CalendarIcon,
    title: "CALENDÁRIO",
    subtitle: "Chega de ter a sua agenda desorganizada",
    description:
      "Transforme sua rotina: planeje, acompanhe e execute suas metas com mais foco e eficiência. Tenha controle total do seu tempo e alcance seus objetivos com muito mais organização.",
  },
  {
    icon: "ai-brain",
    title: "IA'S",
    subtitle: "Tenha todas as IA's em um só lugar",
    description:
      "Acesse as inteligências artificiais mais usadas pelos maiores players do mercado em um único lugar, prontas para acelerar seus resultados e otimizar seu trabalho.",
  },
]

export const FeaturesSection = memo(function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  const handleMouseMove = useCallback((ev: MouseEvent) => {
    const cards = document.querySelectorAll(".card")

    cards.forEach((e) => {
      const blob = e.querySelector(".blob") as HTMLElement
      const fblob = e.querySelector(".fakeblob") as HTMLElement
      if (blob && fblob) {
        const rec = fblob.getBoundingClientRect()

        requestAnimationFrame(() => {
          blob.style.transform = `translate(${ev.clientX - rec.left - rec.width / 2}px, ${ev.clientY - rec.top - rec.height / 2}px)`
          blob.style.opacity = "1"
        })
      }
    })
  }, [])

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove])

  return (
    <section ref={sectionRef} id="features" className="py-12 md:py-16 lg:py-20 bg-background relative">
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-black/50 pointer-events-none z-10"></div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance mb-4 text-white">OUTRAS ABAS</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {courseModules.map((module, index) => (
            <Card
              key={index}
              className={`card bg-card border-border hover:border-primary/70 transition-all duration-1000 group shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:shadow-xl neon-glow relative overflow-hidden transform ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              }`}
              style={{
                transitionDelay: isVisible ? `${index * 150}ms` : "0ms",
                willChange: isVisible ? "auto" : "transform, opacity",
              }}
            >
              <div className="blob"></div>
              <div className="fakeblob"></div>

              <CardHeader className="relative z-10 pb-3">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary/30 transition-colors shadow-md shadow-primary/20 group-hover:shadow-primary/40">
                  {typeof module.icon === "string" ? (
                    <Image
                      src={`/icons/${module.icon}.png`}
                      alt={module.title}
                      width={36}
                      height={36}
                      className="h-8 w-8 md:h-9 md:w-9 object-contain drop-shadow-sm"
                      loading="lazy"
                    />
                  ) : (
                    <module.icon className="h-8 w-8 md:h-9 md:w-9 text-white drop-shadow-sm" />
                  )}
                </div>
                <CardTitle className="text-base md:text-lg font-bold text-white leading-tight">
                  {module.title}
                </CardTitle>
                <div className="text-xs md:text-sm text-white font-semibold">{module.subtitle}</div>
              </CardHeader>
              <CardContent className="relative z-10 pt-0">
                <CardDescription className="text-sm md:text-base text-white leading-relaxed mb-3 md:mb-4">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
})
