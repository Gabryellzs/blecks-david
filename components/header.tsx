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
    // Cabeçalho flutuante
    <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      {/* fundo leve apenas pra dar contraste no topo */}
      <div className="bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
        <div className="container mx-auto px-4 pt-4">
          {/* === CARD DE VIDRO ESCURO (ESTILO DA IMAGEM) === */}
          <div
            className="
              pointer-events-auto
              relative
              max-w-6xl mx-auto

              rounded-[19px]
              overflow-hidden

              bg-black/40
              backdrop-blur-2xl
              backdrop-saturate-200

              border border-white/15
              shadow-[0_0_30px_rgba(255,255,255,0.08),0_0_60px_rgba(0,0,0,0.9)]

              px-4 md:px-6 lg:px-8
              h-14 md:h-16
              flex items-center
            "
          >
            {/* Reflexo suave superior */}
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/18 to-transparent pointer-events-none" />

            {/* Reflexo diagonal igual aos cards de exemplo */}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.03)_45%,rgba(0,0,0,0)_65%)] pointer-events-none" />

            {/* Glow lateral esquerda */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-10 bg-white/50 blur-[6px] rounded-full pointer-events-none" />
            {/* Glow lateral direita */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-10 bg-white/50 blur-[6px] rounded-full pointer-events-none" />

            {/* Glow central superior fino */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-white/55 blur-[3px] pointer-events-none" />

            {/* Conteúdo real do header */}
            <div className="relative z-10 flex w-full items-center justify-between">
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
                  className="text-slate-200/75 hover:text-white transition-colors"
                >
                  Outras Abas
                </button>

                {/* /assinaturas (plural) */}
                <button
                  onClick={() => router.push("/assinaturas")}
                  className="text-slate-200/75 hover:text-white transition-colors"
                >
                  Assinaturas
                </button>

                <button
                  onClick={() => navigateToSection("integracoes")}
                  className="text-slate-200/75 hover:text-white transition-colors"
                >
                  Integrações
                </button>
              </nav>

              {/* BOTÕES DESKTOP */}
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={() => router.push("/login")}
                  className="
                    px-8 py-1.5
                    rounded-full
                    text-sm
                    border border-slate-500/70
                    text-slate-50
                    bg-slate-900/50
                    hover:bg-slate-900/90
                    transition-all
                  "
                >
                  Entrar
                </button>
                <button
                  onClick={() =>
                    (window.location.href = "https://www.blacksproductivity.site/register")
                  }
                  className="
                    px-5 py-1.5
                    rounded-full
                    text-sm
                    bg-gradient-to-r from-slate-50 via-slate-200 to-slate-50
                    text-slate-900 font-medium
                    shadow-[0_0_18px_rgba(255,255,255,0.55)]
                    hover:shadow-[0_0_22px_rgba(255,255,255,0.9)]
                    hover:brightness-110
                    transition-all
                  "
                >
                  Teste 7 Dias
                </button>
              </div>

              {/* MENU MOBILE (ÍCONE) */}
              <button
                className="md:hidden p-2 text-slate-100 hover:text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MENU MOBILE ABAIXO DO CARD, TAMBÉM EM VIDRO ESCURO */}
      {isMenuOpen && (
        <div className="pointer-events-auto md:hidden px-4 pt-2 pb-4">
          <div
            className="
              max-w-6xl mx-auto
              rounded-3xl
              border border-white/10
              bg-black/80
              backdrop-blur-2xl
              shadow-[0_18px_50px_rgba(0,0,0,0.95)]
              overflow-hidden
            "
          >
            <nav className="px-6 py-4 space-y-3">
              <button
                onClick={() => {
                  navigateToSection("features")
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left text-slate-200 hover:text-white transition-colors py-1.5"
              >
                Outras Abas
              </button>

              <button
                onClick={() => {
                  router.push("/assinaturas")
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left text-slate-200 hover:text-white transition-colors py-1.5"
              >
                Assinaturas
              </button>

              <button
                onClick={() => {
                  navigateToSection("integracoes")
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left text-slate-200 hover:text-white transition-colors py-1.5"
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
                    border border-slate-600/80
                    text-slate-50
                    text-sm
                    bg-slate-900/70
                    hover:bg-slate-900/90
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
                    text-sm
                    bg-gradient-to-r from-slate-50 via-slate-200 to-slate-50
                    text-slate-900 font-medium
                    shadow-[0_0_32px_rgba(255,255,255,0.55)]
                    hover:shadow-[0_0_42px_rgba(255,255,255,0.9)]
                    hover:brightness-110
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
