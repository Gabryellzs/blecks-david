"use client"

import { useEffect, useState, useRef, memo } from "react"

export const CleanSectionThree = memo(function CleanSectionThree() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

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

  return (
    <section
      ref={sectionRef}
      id="pix-section"
      className="relative py-16 md:py-24 lg:py-32 bg-background overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10"></div>

      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />

      <div className="absolute top-10 md:top-20 left-10 md:left-20 w-16 h-16 md:w-32 md:h-32 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-16 md:bottom-32 right-16 md:right-32 w-12 h-12 md:w-24 md:h-24 bg-primary/30 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/3 w-8 h-8 md:w-16 md:h-16 bg-primary/15 rounded-full blur-xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[400px] md:min-h-[600px] gap-8 lg:gap-12 -mt-8 lg:-mt-16">
          <div className="perspective-1000 relative order-2 lg:order-1 lg:-ml-16">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <svg className="w-[560px] h-[560px] opacity-60" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(400,400)">
                  <circle r="100" className="fill-none stroke-primary/30 stroke-[1px]" />
                  <circle r="200" className="fill-none stroke-primary/40 stroke-[1px]" />
                  <circle r="300" className="fill-none stroke-primary/30 stroke-[1px]" />
                  <circle r="400" className="fill-none stroke-primary/20 stroke-[1px]" />

                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 0 0;360 0 0"
                      dur="12.7s"
                      repeatCount="indefinite"
                    />
                    <circle r="4" className="fill-primary stroke-primary stroke-[1px]" cx="100" cy="0" />
                  </g>

                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="180 0 0;-180 0 0"
                      dur="18.3s"
                      repeatCount="indefinite"
                      begin="3.2s"
                    />
                    <circle r="4" className="fill-primary stroke-primary stroke-[1px]" cx="200" cy="0" />
                  </g>

                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="90 0 0;450 0 0"
                      dur="21.9s"
                      repeatCount="indefinite"
                      begin="7.8s"
                    />
                    <circle r="4" className="fill-primary stroke-primary stroke-[1px]" cx="300" cy="0" />
                  </g>

                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="270 0 0;-90 0 0"
                      dur="15.4s"
                      repeatCount="indefinite"
                      begin="1.5s"
                    />
                    <circle r="4" className="fill-primary stroke-primary stroke-[1px]" cx="400" cy="0" />
                  </g>
                </g>
              </svg>
            </div>

            <div className="absolute -top-3 md:-top-6 -right-3 md:-right-6 w-10 h-10 md:w-20 md:h-20 bg-primary/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 md:-bottom-6 -left-3 md:-left-6 w-8 h-8 md:w-16 md:h-16 bg-primary/30 rounded-full blur-lg"></div>

            <img
              src="/pix-dashboard-mobile-updated.png"
              alt="Dashboard PIX Mobile"
              className={`max-w-sm md:max-w-lg lg:max-w-2xl w-full h-auto transition-all duration-2000 ease-out transform-gpu relative z-10 mt-8
                ${isVisible ? "translate-y-0 opacity-100 rotate-x-5 rotate-y-2" : "translate-y-full opacity-0"}
                hover:rotate-x-2 hover:rotate-y-5 hover:scale-105
                animate-float-3d
              `}
              style={{ willChange: isVisible ? "auto" : "transform, opacity" }}
              loading="lazy"
            />
          </div>

          <div className="flex-1 max-w-2xl text-center lg:text-left order-1 lg:order-2">
            <h2
              className={`text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white leading-relaxed transition-all duration-2000 ease-out transform
              ${isVisible ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"}
            `}
              style={{
                transitionDelay: isVisible ? "0.5s" : "0s",
                willChange: isVisible ? "auto" : "transform, opacity",
              }}
            >
              <span
                className={`inline-block transition-all duration-2000 ease-out transform
                  ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}
                `}
                style={{
                  transitionDelay: isVisible ? "0.7s" : "0s",
                }}
              >
                VOCÊ TAMBÉM VAI TER NA PALMA DA SUA MÃO O CONTROLE ABSOLUTO DA SUA OPERAÇÃO,
              </span>
              <br />
              <span
                className={`text-gray-300 text-base md:text-lg lg:text-xl xl:text-2xl inline-block transition-all duration-2000 ease-out transform
                  ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}
                `}
                style={{
                  transitionDelay: isVisible ? "1s" : "0s",
                }}
              >
                acompanhando cada venda em tempo real e com a força necessária para escalar seus resultados sem limites.
              </span>
            </h2>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between mt-12 md:mt-16 gap-8 lg:gap-12">
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <h3
              className={`text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-relaxed transition-all duration-2000 ease-out transform
              ${isVisible ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"}
            `}
              style={{
                transitionDelay: isVisible ? "1.5s" : "0s",
                willChange: isVisible ? "auto" : "transform, opacity",
              }}
            >
              <span
                className={`inline-block transition-all duration-2000 ease-out transform
                  ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}
                `}
                style={{
                  transitionDelay: isVisible ? "1.7s" : "0s",
                }}
              >
                ESCALA SEM LIMITES: TENHA TODAS AS MÉTRICAS NAS SUAS MÃOS
              </span>
              <br />
              <span
                className={`text-muted-foreground text-base md:text-lg lg:text-xl xl:text-2xl inline-block transition-all duration-2000 ease-out transform
                  ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}
                `}
                style={{
                  transitionDelay: isVisible ? "2s" : "0s",
                }}
              >
                Aqui você tem cada métrica para cortar desperdícios e multiplicar resultados sem limites.
              </span>
            </h3>
          </div>

          <div className="relative max-w-sm md:max-w-lg lg:max-w-2xl w-full">
            <img
              src="/meta-ads-dashboard.png"
              alt="Dashboard Meta ADS"
              className={`w-full h-auto rounded-lg shadow-lg transition-all duration-2000 ease-out transform
                ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95"}
              `}
              style={{
                transitionDelay: isVisible ? "1.3s" : "0s",
                willChange: isVisible ? "auto" : "transform, opacity",
              }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
})
