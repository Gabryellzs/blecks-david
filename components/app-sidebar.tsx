"use client"

import type React from "react"
import { PenTool, type LucideIcon } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useState, createContext, useContext } from "react"

// ---------------- Sidebar Context ----------------
const SidebarContext = createContext<{
  isExpanded: boolean
  toggleSidebar: () => void
}>({
  isExpanded: false,
  toggleSidebar: () => {},
})

export const useSidebarContext = () => useContext(SidebarContext)

// ---------------- Types ----------------
interface AppSidebarProps {
  activeView?: string
  onViewChange?: (view: string) => void
  children: React.ReactNode
}

type MenuItem = {
  id: string
  title: string
  href: string
  icon?: LucideIcon            // Lucide fallback se quiser
  iconPath?: string            // PNG/SVG em /public
  size?: number                // px (largura/altura do ícone)
  offsetX?: number             // px (direita/esquerda) — só quando expandido
  offsetY?: number             // px (cima/baixo) — só quando expandido
}

// ---------------- Component ----------------
export function AppSidebar({ children }: AppSidebarProps) {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const ICON_BASE = "/icons-siderbar"

  const menuItems: MenuItem[] = [
    {
      id: "results-dashboard",
      title: "Dashboard De Gateways",
      iconPath: `${ICON_BASE}/dashboard-gateways.png`,
      href: "/dashboard/gateways",
      size: 31,
      offsetX: 2,
    },
    {
      id: "billing-analysis",
      title: "Análise De Faturamento",
      iconPath: `${ICON_BASE}/Análise De Faturamento.png`,
      href: "/dashboard/billing-analysis",
      size: 31,
    },
    {
      id: "ads-dashboard",
      title: "Dashboard ADS",
      iconPath: `${ICON_BASE}/Dashboard ADS.png`,
      href: "/dashboard/ads",
      size: 31,
      offsetX: 1,
    },
    {
      id: "dashboard",
      title: "Dashboard",
      iconPath: `${ICON_BASE}/dashboard.png`,
      href: "/dashboard",
      size: 31,
    },
    {
      id: "diary",
      title: "Diário Semanal",
      iconPath: `${ICON_BASE}/Diario-Semanal.png`,
      href: "/dashboard/diary",
      size: 37,
      offsetX: -1,
    },
    {
      id: "productivity",
      title: "Produtividade",
      iconPath: `${ICON_BASE}/productivity.png`,
      href: "/dashboard/productivity",
      size: 37,
    },
    {
      id: "calendar",
      title: "Calendário",
      iconPath: `${ICON_BASE}/calendario.png`,
      href: "/dashboard/calendar",
      size: 41,
    },
    {
      id: "mindmap",
      title: "Mapa Mental",
      iconPath: `${ICON_BASE}/mapa-mental.png`,
      href: "/dashboard/mindmap",
      size: 35,
      offsetY: -1,
    },
    {
      id: "ai",
      title: "IA's",
      iconPath: `${ICON_BASE}/ias.png`,
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
      title: "oferta Escalada",
      iconPath: `${ICON_BASE}/oferta-Escalada.png`,
      href: "/dashboard/oferta-escalada",
      size: 30,
    },
    {
      id: "finances",
      title: "Financeiro",
      iconPath: `${ICON_BASE}/financeiro.png`,
      href: "/dashboard/finances",
      size: 30,
    },
    {
      id: "editor-paginas",
      title: "Suporte",
      iconPath: `${ICON_BASE}/suporte.png`,
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
                      {/* Ícone: centralização perfeita no highlight */}
                      {item.iconPath ? (
                        <span
                          className={`
                            relative inline-flex items-center justify-center shrink-0
                            transition-[filter,transform] duration-300
                            ${theme === "dark" ? "invert brightness-0" : "invert-0 brightness-0"}
                          `}
                          style={{
                            width: size,
                            height: size,
                            // offsets só quando expandido; fechado usa micro ajuste ótico -1px Y
                            transform: isExpanded ? `translate(${x}px, ${y}px)` : `translate(0px, -1px)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src={item.iconPath}
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

                      {/* Label: só renderiza quando expandido para não deslocar o centro no fechado */}
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
