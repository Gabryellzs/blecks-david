"use client"

import type React from "react"
import { PenTool, type LucideIcon } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Image, { type StaticImageData } from "next/image"
import { useState, createContext, useContext } from "react"

// ====== IMPORTS ESTÁTICOS (garantem no build) ======
import IconDashAds from "@/public/icons-siderbar/dashboard-ads.png"
import IconDiario from "@/public/icons-siderbar/diario-semanal.png"
import IconOfertaEscalada from "@/public/icons-siderbar/ofertas-escaladas.png"

// Se quiser, importe os outros também:
import IconDashGateways from "@/public/icons-siderbar/dashboard-gateways.png"
import IconAnaliseFat from "@/public/icons-siderbar/analise-faturamento.png"
import IconDashboard from "@/public/icons-siderbar/dashboard.png"
import IconProductivity from "@/public/icons-siderbar/productivity.png"
import IconCalendario from "@/public/icons-siderbar/calendario.png"
import IconMapaMental from "@/public/icons-siderbar/mapa-mental.png"
import IconIas from "@/public/icons-siderbar/ias.png"
import IconFinanceiro from "@/public/icons-siderbar/financeiro.png"
import IconSuporte from "@/public/icons-siderbar/suporte.png"

// ---------------- Sidebar Context ----------------
const SidebarContext = createContext<{
  isExpanded: boolean
  toggleSidebar: () => void
}>({ isExpanded: false, toggleSidebar: () => {} })

export const useSidebarContext = () => useContext(SidebarContext)

interface AppSidebarProps {
  activeView?: string
  onViewChange?: (view: string) => void
  children: React.ReactNode
}

type MenuItem = {
  id: string
  title: string
  href: string
  icon?: LucideIcon
  iconSrc?: StaticImageData | string // << aceita import estático OU string
  size?: number
  offsetX?: number
  offsetY?: number
}

export function AppSidebar({ children }: AppSidebarProps) {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      id: "results-dashboard",
      title: "Dashboard De Gateways",
      iconSrc: IconDashGateways,
      href: "/dashboard/gateways",
      size: 31,
      offsetX: 2,
    },
    {
      id: "billing-analysis",
      title: "Análise De Faturamento",
      iconSrc: IconAnaliseFat,
      href: "/dashboard/billing-analysis",
      size: 31,
    },
    {
      id: "ads-dashboard",
      title: "Dashboard ADS",
      iconSrc: IconDashAds, // << import estático
      href: "/dashboard/ads",
      size: 31,
      offsetX: 1,
    },
    {
      id: "dashboard",
      title: "Dashboard",
      iconSrc: IconDashboard,
      href: "/dashboard",
      size: 31,
    },
    {
      id: "diary",
      title: "Diário Semanal",
      iconSrc: IconDiario, // << import estático
      href: "/dashboard/diary",
      size: 37,
      offsetX: -1,
    },
    {
      id: "productivity",
      title: "Produtividade",
      iconSrc: IconProductivity,
      href: "/dashboard/productivity",
      size: 37,
    },
    {
      id: "calendar",
      title: "Calendário",
      iconSrc: IconCalendario,
      href: "/dashboard/calendar",
      size: 37,
    },
    {
      id: "mindmap",
      title: "Mapa Mental",
      iconSrc: IconMapaMental,
      href: "/dashboard/mindmap",
      size: 41,
      offsetY: -1,
    },
    {
      id: "ai",
      title: "IA's",
      iconSrc: IconIas,
      href: "/dashboard/ai",
      size: 35,
      offsetX: 1,
    },
    {
      id: "copywriting",
      title: "Copywriting",
      icon: PenTool,
      href: "/dashboard/copywriting",
      size: 24,
      offsetX: 2,
    },
    {
      id: "oferta-escalada",
      title: "Oferta Escalada",
      iconSrc: IconOfertaEscalada, // << import estático
      href: "/dashboard/oferta-escalada",
      size: 30,
    },
    {
      id: "finances",
      title: "Financeiro",
      iconSrc: IconFinanceiro,
      href: "/dashboard/finances",
      size: 30,
    },
    {
      id: "editor-paginas",
      title: "Suporte",
      iconSrc: IconSuporte,
      href: "/dashboard/support",
      size: 31,
    },
  ]

  const handleNavigation = (href: string) => router.push(href)
  const toggleSidebar = () => setIsExpanded((v) => !v)

  const SidebarToggleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {isExpanded ? (
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )

  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar }}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out
            bg-background border-border border-r
            ${isExpanded ? "w-64" : "w-16"}
          `}
        >
          {/* Header */}
          <div className="p-4">
            <div className="relative h-[70px]">
              <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[65px] h-[70px]">
                <Image
                  src={theme === "dark" ? "/images/sidebar-logo-dark-theme.png" : "/images/sidebar-logo-light-theme.png"}
                  alt="BLECK's Logo"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <span
                className={`
                  absolute top-1/2 -translate-y-1/2 left-[69px]
                  text-xl font-bold text-foreground tracking-wide whitespace-nowrap
                  transition-all duration-300 ease-out
                  ${isExpanded ? "opacity-100 translate-x-0 max-w-[220px]" : "opacity-0 -translate-x-2 max-w-0"}
                  overflow-hidden pointer-events-none
                `}
              >
                BLECK's
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="px-3 mt-8">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const active = pathname === item.href
                const size = item.size ?? 24
                const x = item.offsetX ?? 0
                const y = item.offsetY ?? 0

                return (
                  <div key={item.id} className="relative group">
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigation(item.href)}
                      className={`
                        w-full h-11 text-sm flex items-center
                        ${isExpanded ? "justify-start pl-3 pr-3" : "justify-center px-0"}
                        ${active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground text-foreground"}
                      `}
                    >
                      {/* Ícone (import estático garante no build) */}
                      {item.iconSrc ? (
                        <span
                          className={`
                            relative inline-flex items-center justify-center shrink-0
                            transition-[filter,transform] duration-300
                            ${theme === "dark" ? "invert brightness-0" : "invert-0 brightness-0"}
                          `}
                          style={{
                            width: size,
                            height: size,
                            transform: isExpanded ? `translate(${x}px, ${y}px)` : `translate(0px, -1px)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src={item.iconSrc}
                            alt={item.title}
                            fill
                            className="object-contain"
                            style={{ objectPosition: "center" }}
                          />
                        </span>
                      ) : item.icon ? (
                        <item.icon
                          className="shrink-0"
                          style={{
                            width: size,
                            height: size,
                            transform: isExpanded ? `translate(${x}px, ${y}px)` : `translate(0px, -1px)`,
                          }}
                        />
                      ) : null}

                      {/* Label só quando expandido (não puxa o centro no fechado) */}
                      {isExpanded && (
                        <span className="ml-3 overflow-hidden transition-all duration-200 max-w-[220px]">
                          {item.title}
                        </span>
                      )}
                    </Button>

                    {/* Tooltip quando colapsado */}
                    {!isExpanded && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-border">
                        {item.title}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={`
            flex-1 flex flex-col overflow-hidden bg-background transition-all duration-300
            ${isExpanded ? "ml-64" : "ml-16"}
          `}
        >
          {children}
        </div>

        {/* Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={`
            fixed top-24 z-50 transition-all duration-300
            h-8 w-8 rounded-full p-0
            ${isExpanded ? "left-60" : "left-12"}
            bg-background hover:bg-accent border-2 border-border hover:border-accent text-foreground hover:text-accent-foreground
            shadow-lg hover:shadow-xl
            flex items-center justify-center
          `}
          aria-label="Toggle Sidebar"
        >
          <SidebarToggleIcon />
        </Button>
      </div>
    </SidebarContext.Provider>
  )
}
