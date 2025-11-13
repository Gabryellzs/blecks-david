import { memo } from "react"
import Image from "next/image"

const allPlatforms = [
  { name: "Hotmart", src: "/platforms/hotmart.png" },
  { name: "Appmax", src: "/platforms/appmax.png" },
  { name: "BeaP", src: "/platforms/beap.png" },
  { name: "Cakto", src: "/platforms/cakto.png" },
  { name: "Nuvemshop", src: "/platforms/nuvemshop.png" },
  { name: "Cart", src: "/platforms/cart.png" },
  { name: "GoatPay", src: "/platforms/goatpay.png" },
  { name: "Kiwify", src: "/platforms/kiwify.png" },
  { name: "Network", src: "/platforms/network-platform.png" },
  { name: "Pay", src: "/platforms/pay.png" },
  { name: "Platform Gold", src: "/platforms/platform-gold.png" },
  { name: "Platform New", src: "/platforms/platform-new.avif" },
  { name: "Platform Yellow", src: "/platforms/platform-yellow.png" },
  { name: "Shopify", src: "/platforms/shopify.png" },
  { name: "Udemy", src: "/platforms/udemy.webp" },
  { name: "Placeholder 1", src: "/platforms/placeholder-1.png" },
  { name: "Placeholder 2", src: "/platforms/placeholder-2.png" },
  { name: "Placeholder 3", src: "/platforms/placeholder-3.png" },
  { name: "Payt", src: "/platforms/payt.png" },
  { name: "Logzz", src: "/platforms/logzz.png" },
  { name: "Greem", src: "/platforms/greem.png" },
  { name: "ClickBank", src: "/platforms/clickbank.png" },
  { name: "Vega", src: "/platforms/vega.png" },
  { name: "SoluPay", src: "/platforms/solupay.png" },
  { name: "Platform White", src: "/platforms/platform-white.png" },
] as const

const firstRow = allPlatforms.slice(0, 9)
const secondRow = allPlatforms.slice(9, 17)
const thirdRow = allPlatforms.slice(17, 25)

const largerLogos = ["Logzz", "SoluPay", "Payt", "Greem", "ClickBank", "Vega", "Kirvano"]

type Platform = (typeof allPlatforms)[number]

interface LogosRowProps {
  platforms: Platform[]
  animationClass: string
  rowKey: string
  speed?: string
}

function LogosRow({ platforms, animationClass, rowKey, speed }: LogosRowProps) {
  return (
    <div className="relative flex overflow-hidden">
      <div
        className={`flex gap-6 md:gap-8 lg:gap-10 ${animationClass}`}
        style={{
          willChange: "transform",
          ...(speed ? ({ ["--speed" as string]: speed } as any) : null),
        }}
      >
        {[...platforms, ...platforms].map((platform, index) => {
          const isLarger = largerLogos.includes(platform.name)
          const imageSize = isLarger
            ? "h-28 w-28 md:h-36 md:w-36 lg:h-44 lg:w-44"
            : "h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14"

          return (
            <div
              key={`${rowKey}-${index}`}
              className="
                flex-shrink-0
                glass-card neon-card
                rounded-2xl
                p-2 md:p-3 lg:p-3
                w-20 h-20 md:w-22 md:h-22 lg:w-24 lg:h-24
                flex items-center justify-center
                shadow-[0_14px_30px_rgba(0,0,0,0.65)]
                hover:shadow-[0_0_24px_rgba(255,255,255,0.20)]
                transition-all duration-300
                hover:scale-[1.04]
              "
            >
              <Image
                src={platform.src || "/placeholder.svg"}
                alt={platform.name}
                width={80}
                height={80}
                className={`${imageSize} object-contain opacity-80 hover:opacity-100 transition-opacity duration-300`}
                loading="lazy"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const TestimonialsSection = memo(function TestimonialsSection() {
  return (
    <section
      id="integracoes"
      className="relative py-12 md:py-16 lg:py-20 overflow-hidden bg-black"
    >
      {/* Luz cinza vindo do canto esquerdo */}
      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(circle_at_top_left,rgba(140,140,140,0.25),rgba(0,0,0,1) 60%)]
          opacity-90
          z-0
        "
      />

      {/* Luz suave na direita */}
      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(circle_at_right,rgba(60,60,60,0.18),transparent 70%)]
          opacity-60
          z-0
        "
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            INTEGRAMOS COM AS MELHORES PLATAFORMAS DO MERCADO!
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            mais plataformas em breve!
          </p>
        </div>

        <div
          className="relative w-full overflow-hidden py-8"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          }}
        >
          <div className="flex flex-col gap-6 md:gap-8">
            <LogosRow
              platforms={firstRow}
              animationClass="animate-scroll-left-seamless"
              rowKey="row1"
              speed="28s"
            />
            <LogosRow
              platforms={secondRow}
              animationClass="animate-scroll-right-seamless"
              rowKey="row2"
              speed="34s"
            />
            <LogosRow
              platforms={thirdRow}
              animationClass="animate-scroll-left-seamless-slow"
              rowKey="row3"
              speed="42s"
            />
          </div>
        </div>
      </div>
    </section>
  )
})
