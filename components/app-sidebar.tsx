"use client"

import type React from "react"
import {
  LayoutDashboard,
  BookOpen,
  CalendarClock,
  PenTool,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useState, createContext, useContext } from "react"

// Context para controlar o estado da sidebar
const SidebarContext = createContext<{
  isExpanded: boolean
  toggleSidebar: () => void
}>({
  isExpanded: false,
  toggleSidebar: () => {},
})

export const useSidebarContext = () => useContext(SidebarContext)

interface AppSidebarProps {
  activeView?: string
  onViewChange?: (view: string) => void
  children: React.ReactNode
}

// Aceita PNG/SVG (iconPath) OU Lucide (icon)
type MenuItem = {
  id: string
  title: string
  href: string
  icon?: LucideIcon
  iconPath?: string
}

export function AppSidebar({ activeView, onViewChange, children }: AppSidebarProps) {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      id: "results-dashboard",
      title: "Dashboard De Gateways",
      iconPath: "/icons-siderbar/dashboard-gateways.png",
      href: "/dashboard/gateways",
    },
    {
      id: "billing-analysis",
      title: "Análise De Faturamento",
      iconPath: "/icons-siderbar/análise-faturamento.png",
      href: "/dashboard/billing-analysis",
    },
    {
      id: "ads-dashboard",
      title: "Dashboard ADS",
      iconPath: "/icons-siderbar/dashboard-ads.png",
      href: "/dashboard/ads",
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      id: "diary",
      title: "Diário Semanal",
      iconPath: "/icons-siderbar/diario-semanal.png",
      href: "/dashboard/diary",
    },
    {
      id: "productivity",
      title: "Produtividade",
      icon: CalendarClock,
      href: "/dashboard/productivity",
    },
    {
      id: "calendar",
      title: "Calendário",
      iconPath: "/icons-siderbar/calendar-icon.png", 
      href: "/dashboard/calendar",
    },
    {
      id: "mindmap",
      title: "Mapa Mental",
      iconPath: "/icons-siderbar/mapa-mental.png",
      href: "/dashboard/mindmap",
    },
    {
      id: "ai",
      title: "IA's",
      iconPath: "/icons-siderbar/ia's.png", 
      href: "/dashboard/ai",
    },
    {
      id: "copywriting",
      title: "Copywriting",
      icon: PenTool,
      href: "/dashboard/copywriting",
    },
    {
      id: "oferta-escalada",
      title: "Oferta Escalada",
      iconPath: "/icons-siderbar/ofertas-escaladas.png",
      href: "/dashboard/oferta-escalada",
    },
    {
      id: "finances",
      title: "Financeiro",
      iconPath: "/icons-siderbar/financeiro.png",
      href: "/dashboard/finances",
    },
    {
      id: "editor-paginas",
      title: "Suporte",
      iconPath: "/icons-siderbar/suporte.png",
      href: "/dashboard/support",
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
        {/* Sidebar Fixa */}
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

              {/* Título: ao lado quando expandida; oculto quando colapsada */}
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

          {/* Menu Items */}
          <div className="px-3 mt-8">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.id} className="relative group">
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full h-11 pl-2.5 pr-3 text-sm
                      justify-start
                      ${
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground text-foreground"
                      }
                    `}
                  >
                    {/* Ícone (24px): PNG/SVG padronizado OU Lucide padronizado */}
                    {item.iconPath ? (
                      <span
                        className={`
                          relative inline-flex items-center justify-center w-6 h-6 shrink-0
                          transition-[filter] duration-300
                          ${theme === "dark" ? "invert brightness-0" : "invert-0 brightness-0"}
                        `}
                        aria-hidden
                      >
                        <Image src={item.iconPath} alt="" fill className="object-contain" />
                      </span>
                    ) : item.icon ? (
                      <item.icon className="w-6 h-6 shrink-0" />
                    ) : null}

                    <span
                      className={`
                        ml-3 overflow-hidden transition-all duration-200
                        ${isExpanded ? "opacity-100 max-w-[220px]" : "opacity-0 max-w-0"}
                      `}
                    >
                      {item.title}
                    </span>
                  </Button>

                  {/* Tooltip quando colapsado */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-border">
                      {item.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo Principal com margem para a sidebar */}
        <div
          className={`
            flex-1 flex flex-col overflow-hidden bg-background transition-all duration-300
            ${isExpanded ? "ml-64" : "ml-16"}
          `}
        >
          {children}
        </div>

        {/* Botão de Toggle */}
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
