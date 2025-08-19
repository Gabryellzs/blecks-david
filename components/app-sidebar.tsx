"use client"

import type React from "react"

import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  Network,
  Bot,
  BookOpen,
  CalendarClock,
  PenTool,
  BarChart3,
  Edit,
  LineChart,
  TrendingUp,
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

export function AppSidebar({ activeView, onViewChange, children }: AppSidebarProps) {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    {
      id: "results-dashboard",
      title: "Dashboard De Gateways",
      icon: BarChart3,
      href: "/dashboard/gateways",
    },
    {
      id: "billing-analysis",
      title: "Análise De Faturamento",
      icon: TrendingUp,
      href: "/dashboard/billing-analysis",
    },
    {
      id: "ads-dashboard",
      title: "Dashboard ADS",
      icon: LineChart,
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
      icon: BookOpen,
      href: "/dashboard/diary",
    },
    {
      id: "productivity",
      title: "Organização / Produtividade",
      icon: CalendarClock,
      href: "/dashboard/productivity",
    },
    {
      id: "calendar",
      title: "Calendário",
      icon: Calendar,
      href: "/dashboard/calendar",
    },
    {
      id: "mindmap",
      title: "Mapa Mental",
      icon: Network,
      href: "/dashboard/mindmap",
    },
    {
      id: "ai",
      title: "IA's",
      icon: Bot,
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
      icon: TrendingUp,
      href: "/dashboard/oferta-escalada",
    },
    {
      id: "finances",
      title: "Financeiro",
      icon: CreditCard,
      href: "/dashboard/finances",
    },
    {
      id: "editor-paginas",
      title: "Suporte",
      icon: Edit,
      href: "/dashboard/support",
    },
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

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
          ${theme === "dark" ? "bg-background border-border" : "bg-background border-border"}
          border-r
          ${isExpanded ? "w-64" : "w-16"}
        `}
        >
          {/* Header */}
          <div className="flex flex-col p-4">
            <div className="flex flex-col items-center">
              <div className="mb-2 relative w-[65px] h-[70px]">
                <Image
                  src={
                    theme === "dark" ? "/images/sidebar-logo-dark-theme.png" : "/images/sidebar-logo-light-theme.png"
                  }
                  alt="BLECK's Logo"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              {isExpanded && <h1 className="text-xl font-bold text-foreground">BLECK's</h1>}
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-3">
            {isExpanded && (
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</div>
            )}
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.id} className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full justify-start h-10 px-3
                      ${
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground text-foreground"
                      }
                      ${!isExpanded ? "justify-center px-0" : ""}
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {isExpanded && <span className="ml-3">{item.title}</span>}
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
            fixed top-20 z-50 transition-all duration-300
            h-6 w-6 rounded-full p-0
            ${isExpanded ? "left-60" : "left-12"}
            ${
              theme === "dark"
                ? "bg-background hover:bg-accent border-2 border-border hover:border-accent text-foreground hover:text-accent-foreground"
                : "bg-background hover:bg-accent border-2 border-border hover:border-accent text-foreground hover:text-accent-foreground"
            }
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
