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
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={scrollToHero}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Image src="/bless-logo.png" alt="BLESS Logo" width={180} height={60} className="h-8 md:h-12 w-auto" />
        </button>

        <nav className="hidden md:flex items-center space-x-8">
          <button
            onClick={() => navigateToSection("features")}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Outras Abas
          </button>
          <button
            onClick={() => router.push("/assinaturas")}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Assinaturas
          </button>
          <button
            onClick={() => navigateToSection("integracoes")}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Integrações
          </button>
        </nav>

        {/* Botões Desktop estilizados */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 rounded-full border border-gray-400 text-white hover:bg-gray-800 transition-all"
          >
            Entrar
          </button>
          <button
            onClick={() => router.push("/register")}
            className="px-6 py-2 rounded-full border border-gray-400 bg-gradient-to-b from-[#3a3a3a] to-[#0f0f0f] text-white font-medium shadow-inner hover:opacity-90 transition-all"
          >
            Teste 7 Dias
          </button>
        </div>

        {/* Botão Mobile Menu */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-gray-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur border-t border-gray-800">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <button
              onClick={() => {
                navigateToSection("features")
                setIsMenuOpen(false)
              }}
              className="block text-gray-400 hover:text-gray-300 transition-colors py-2 w-full text-left"
            >
              Outras Abas
            </button>
            <button
              onClick={() => {
                router.push("/assinaturas")
                setIsMenuOpen(false)
              }}
              className="block text-gray-400 hover:text-gray-300 transition-colors py-2 w-full text-left"
            >
              Assinaturas
            </button>
            <button
              onClick={() => {
                navigateToSection("integracoes")
                setIsMenuOpen(false)
              }}
              className="block text-gray-400 hover:text-gray-300 transition-colors py-2 w-full text-left"
            >
              Integrações
            </button>

            <div className="pt-4 space-y-2">
              <button
                onClick={() => {
                  router.push("/login")
                  setIsMenuOpen(false)
                }}
                className="px-6 py-2 rounded-full border border-gray-400 text-white w-full hover:bg-gray-800 transition-all"
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  router.push("/register")
                  setIsMenuOpen(false)
                }}
                className="px-6 py-2 rounded-full border border-gray-400 bg-gradient-to-b from-[#3a3a3a] to-[#0f0f0f] text-white font-medium shadow-inner w-full hover:opacity-90 transition-all"
              >
                Teste 7 Dias
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
