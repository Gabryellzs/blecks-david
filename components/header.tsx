"use client"

import Image from "next/image"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const scrollToHero = () => {
    router.push("/")
    setTimeout(() => {
      const heroSection = document.getElementById("hero")
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  const navigateToSection = (sectionId: string) => {
    router.push("/")
    setTimeout(() => {
      const section = document.getElementById(sectionId)
      if (section) {
        section.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  return (
    // 👉 FIXED = flutuando por cima do conteúdo, sem criar faixa preta própria
    <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      {/* CARD FLUTUANTE CENTRALIZADO */}
      <div className="container mx-auto px-4 pt-4">
        <div
          className="
            pointer-events-auto
            max-w-6xl mx-auto
            flex items-center justify-between
            rounded-2xl
            border border-white/20
            bg-black/50
            backdrop-blur-xl
            shadow-[0_18px_40px_rgba(0,0,0,0.8)]
            px-4 md:px-6 lg:px-8
            h-14 md:h-16
          "
        >
          {/* LOGO */}
          <button
            onClick={scrollToHero}
            className="flex items-center space-x-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Image
              src="/bless-logo.png"
              alt="BLECK's Logo"
              width={180}
              height={60}
              className="h-9 md:h-12 w-auto"
            />
          </button>

          {/* NAV DESKTOP */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-9 text-sm">
            <button
              onClick={() => navigateToSection("features")}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Outras Abas
            </button>
            <button
              onClick={() => router.push("/assinaturas")}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Assinaturas
            </button>
            <button
              onClick={() => navigateToSection("integracoes")}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Integrações
            </button>
          </nav>

          {/* BOTÕES DESKTOP */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => router.push("/login")}
              className="
                px-5 py-1.5
                rounded-full
                text-sm
                border border-zinc-600/80
                text-zinc-100
                hover:bg-zinc-900/80
                transition-all
              "
            >
              Entrar
            </button>
            <button
              onClick={() => (window.location.href = "https://www.blacksproductivity.site/register")}
              className="
                px-5 py-1.5
                rounded-full
                text-sm
                border border-zinc-300/60
                bg-gradient-to-b from-zinc-200/25 via-zinc-100/10 to-zinc-50/5
                text-white font-medium
                shadow-[0_0_18px_rgba(0,0,0,0.6)]
                hover:opacity-90
                transition-all
              "
            >
              Teste 7 Dias
            </button>
          </div>

          {/* MENU MOBILE (ÍCONE) */}
          <button
            className="md:hidden p-2 text-zinc-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE ABAIXO DO CARD, TAMBÉM FLUTUANTE */}
      {isMenuOpen && (
        <div className="pointer-events-auto md:hidden px-4 pt- pb-4">
          <div
            className="
              max-w-6xl mx-auto
              rounded-3xl
              border border-white/10
              bg-black/80
              backdrop-blur-xl
              shadow-[0_18px_40px_rgba(0,0,0,0.85)]
              overflow-hidden
            "
          >
            <nav className="px-6 py-4 space-y-3">
              <button
                onClick={() => {
                  navigateToSection("features")
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left text-zinc-300 hover:text-white transition-colors py-1.5"
              >
                Outras Abas
              </button>
              <button
                onClick={() => {
                  router.push("/assinaturas")
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left text-zinc-300 hover:text-white transition-colors py-1.5"
              >
                Assinaturas
              </button>
              <button
                onClick={() => {
                  navigateToSection("integracoes")
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left text-zinc-300 hover:text-white transition-colors py-1.5"
              >
                Integrações
              </button>

              <div className="pt-3 space-y-2">
                <button
                  onClick={() => {
                    router.push("/login")
                    setIsMenuOpen(false)
                  }}
                  className="
                    w-full
                    px-5 py-2
                    rounded-full
                    border border-zinc-600/80
                    text-zinc-100
                    text-sm
                    hover:bg-zinc-900/80
                    transition-all
                  "
                >
                  Entrar
                </button>
                <button
                  onClick={() => {
                    router.push("/register")
                    setIsMenuOpen(false)
                  }}
                  className="
                    w-full
                    px-5 py-2
                    rounded-full
                    border border-zinc-300/60
                    bg-gradient-to-b from-zinc-200/25 via-zinc-100/10 to-zinc-50/5
                    text-white font-medium
                    text-sm
                    shadow-[0_0_18px_rgba(0,0,0,0.6)]
                    hover:opacity-90
                    transition-all
                  "
                >
                  Teste 7 Dias
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
