import { memo } from "react"

export const TestimonialsSection = memo(function TestimonialsSection() {
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
  ]

  const firstRow = allPlatforms.slice(0, 9)
  const secondRow = allPlatforms.slice(9, 17)
  const thirdRow = allPlatforms.slice(17, 25)

  const largerLogos = ["Logzz", "SoluPay", "Payt", "Greem", "ClickBank", "Vega", "Kirvano"]

  const renderLogosRow = (platforms: typeof firstRow, animationClass: string, rowKey: string) => (
    <div className="relative flex overflow-hidden">
      <div className={`flex gap-6 md:gap-8 lg:gap-10 ${animationClass}`} style={{ willChange: "transform" }}>
        {[...platforms, ...platforms].map((platform, index) => {
          const isLarger = largerLogos.includes(platform.name)
          const imageSize = isLarger
            ? "h-28 w-28 md:h-36 md:w-36 lg:h-44 lg:w-44"
            : "h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14"

          return (
            <div
              key={`${rowKey}-${index}`}
              className="flex-shrink-0 neon-card rounded-lg p-3 md:p-4 lg:p-5 w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center"
            >
              <img
                src={platform.src || "/placeholder.svg"}
                alt={platform.name}
                className={`${imageSize} object-contain opacity-70 hover:opacity-100 transition-opacity duration-300`}
                loading="lazy"
              />
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <section id="integracoes" className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance mb-4">
            INTEGRAMOS COM AS MELHORES PLATAFORMAS DO MERCADO!
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            mais plataformas em breve!
          </p>
        </div>

        <div
          className="relative w-full overflow-hidden py-8"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          }}
        >
          <div className="flex flex-col gap-6 md:gap-8">
            {renderLogosRow(firstRow, "animate-scroll-left-seamless", "row1")}
            {renderLogosRow(secondRow, "animate-scroll-right-seamless", "row2")}
            {renderLogosRow(thirdRow, "animate-scroll-left-seamless-slow", "row3")}
          </div>
        </div>
      </div>
    </section>
  )
})
