"use client"

import type React from "react"

import { PenTool, type LucideIcon } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useState, createContext, useContext, useEffect, useMemo, useCallback } from "react"

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
  icon?: LucideIcon
  iconPath?: string
  size?: number // tamanho base do ícone (que você já ajustou)
  offsetX?: number // ajuste lateral (esquerda / direita)
  offsetY?: number // ajuste vertical (cima / baixo)
}

// ---------------- Helpers ----------------
const STORAGE_KEY = "blecks:sidebar:isExpanded"

// Larguras responsivas
const COLLAPSED_WIDTH = "clamp(56px, 5vw, 88px)"
const EXPANDED_WIDTH = "clamp(210px, 15vw, 260px)"

// Breakpoints
const AUTO_COLLAPSE_MAX = 1024
const AUTO_EXPAND_MIN = 1440

// Offset lateral da barra “flutuante”
const SIDEBAR_OFFSET_LEFT = "1.75rem"

function getInitialExpanded(): boolean {
  if (typeof window === "undefined") return false
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === "true" || saved === "false") return saved === "true"
  const w = window.innerWidth
  if (w >= AUTO_EXPAND_MIN) return true
  if (w <= AUTO_COLLAPSE_MAX) return false
  return true
}

// Debounce simples p/ resize
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 150) {
  let t: any
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

// ---------------- Component ----------------
export function AppSidebar({ children }: AppSidebarProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  // Altura da tela para escalar os ícones
  const [viewportHeight, setViewportHeight] = useState<number>(() => {
    if (typeof window === "undefined") return 900
    return window.innerHeight || 900
  })

  const router = useRouter()
  const pathname = usePathname()

  const sidebarWidth = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH

  useEffect(() => {
    const initial = getInitialExpanded()
    setIsExpanded(initial)

    if (typeof window !== "undefined") {
      setViewportHeight(window.innerHeight || 900)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, String(isExpanded))
  }, [isExpanded])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = debounce(() => {
      const w = window.innerWidth
      const inferred = w >= AUTO_EXPAND_MIN ? true : w <= AUTO_COLLAPSE_MAX ? false : true
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const userPref = saved === "true" || saved === "false" ? saved === "true" : null
      if (userPref == null) {
        setIsExpanded(inferred)
      }

      // Atualiza altura da tela para escalar ícones
      setViewportHeight(window.innerHeight || 900)
    }, 180)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const ICON_BASE = "/icons-siderbar"

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        id: "results-dashboard",
        title: "Dashboard De Gateways",
        iconPath: `${ICON_BASE}/dashboard-gateways.png`,
        href: "/dashboard/gateways",
        size: 33,
        offsetX: 5,
        offsetY: 0,
      },
      {
        id: "billing-analysis",
        title: "Análise De Faturamento",
        iconPath: `${ICON_BASE}/analise-faturamento.png`,
        href: `/dashboard/billing-analysis`,
        size: 36,
        offsetX: 7,
        offsetY: 0,
      },
      {
        id: "ads-dashboard",
        title: "Dashboard ADS",
        iconPath: `${ICON_BASE}/Dashboard ADS.png`,
        href: "/dashboard/ads",
        size: 36,
        offsetX: 5,
        offsetY: 0,
      },
      {
        id: "dashboard",
        title: "Dashboard",
        iconPath: `${ICON_BASE}/dashboard.png`,
        href: "/dashboard",
        size: 35,
        offsetX: 5,
        offsetY: 0,
      },
      {
        id: "diary",
        title: "Diário Semanal",
        iconPath: `${ICON_BASE}/Diario-Semanal.png`,
        href: "/dashboard/diary",
        size: 35,
        offsetX: 6,
        offsetY: 0,
      },
      {
        id: "productivity",
        title: "Produtividade",
        iconPath: `${ICON_BASE}/productivity.png`,
        href: "/dashboard/productivity",
        size: 42,
        offsetX: 2,
        offsetY: 0,
      },
      {
        id: "calendar",
        title: "Calendário",
        iconPath: `${ICON_BASE}/calendario.png`,
        href: "/dashboard/calendar",
        size: 40,
        offsetX: 1,
        offsetY: 0,
      },
      {
        id: "mindmap",
        title: "Funnel's",
        iconPath: `${ICON_BASE}/mindmap.png`,
        href: "/dashboard/mindmap",
        size: 44,
        offsetX: 2,
        offsetY: 0,
      },
      {
        id: "ai",
        title: "IA's",
        iconPath: `${ICON_BASE}/ias.png`,
        href: "/dashboard/ai",
        size: 40,
        offsetX: 5,
        offsetY: 0,
      },
      {
        id: "copywriting",
        title: "Copywriting",
        iconPath: `${ICON_BASE}/copywriting.png`,
        href: "/dashboard/copywriting",
        size: 35,
        offsetX: 9,
        offsetY: 0,
      },
      {
        id: "oferta-escalada",
        title: "Oferta Escalada",
        iconPath: `${ICON_BASE}/escalada.png`,
        href: "/dashboard/oferta-escalada",
        size: 40,
        offsetX: 4,
        offsetY: 0,
      },
      {
        id: "finances",
        title: "Financeiro",
        iconPath: `${ICON_BASE}/financeiro.png`,
        href: "/dashboard/finances",
        size: 35,
        offsetX: 5,
        offsetY: 0,
      },
      {
        id: "editor-paginas",
        title: "Suporte",
        iconPath: `${ICON_BASE}/suporte.png`,
        href: "/dashboard/support",
        size: 35,
        offsetX: 5,
        offsetY: 0,
      },
    ],
    []
  )

  const handleNavigation = useCallback((href: string) => router.push(href), [router])
  const toggleSidebar = useCallback(() => setIsExpanded((v) => !v), [])

  const SidebarToggleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {isExpanded ? (
        <path
          d="M10 12L6 8L10 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6 4L10 8L6 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )

  // ---------- ESCALA GLOBAL DOS ÍCONES (proporcional à altura da tela) ----------
  const BASE_HEIGHT = 900 // altura de referência
  const vh = viewportHeight || BASE_HEIGHT
  let scaleFactor = vh / BASE_HEIGHT

  // trava pra não ficar exagerado em telas muito grandes/pequenas
  if (scaleFactor < 0.8) scaleFactor = 0.8
  if (scaleFactor > 1.2) scaleFactor = 1.2

  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar }}>
      <div
        className="flex min-h-screen"
        style={{ ["--sb-w" as any]: sidebarWidth }}
      >
        {/* Sidebar FLUTUANTE */}
        <div
          className={`
            fixed z-40
            left-7 top-1/2 -translate-y-1/2
            flex flex-col
            rounded-[32px]
            transition-[width,transform] duration-300 ease-in-out
            backdrop-blur-3xl
            ${
              theme === "dark"
                ? `
                  bg-gradient-to-b from-[#000000] via-[#0d0d0d] to-[#141414]
                  border border-white/10
                  shadow-[0_0_18px_rgba(255,255,255,0.05)]
                  before:content-[''] before:absolute before:inset-0
                  before:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.85),rgba(15,15,15,0.92))]
                  before:pointer-events-none
                `
                : `
                  bg-[rgba(255,255,255,0.45)]
                  border border-black/10
                  shadow-[0_20px_45px_rgba(0,0,0,0.15)]
                  before:content-[''] before:absolute before:inset-0
                  before:bg-[linear-gradient(145deg,rgba(255,255,255,0.6),rgba(255,255,255,0.1))]
                  before:pointer-events-none
                `
            }
          `}
          style={{
            width: "var(--sb-w)",
            height: "92vh",
            maxHeight: "1000px",
            minHeight: "600px",
          }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3">
            <div className="relative h-[72px]">
              <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-[70px] h-[70px]">
                <Image
                  src={
                    theme === "dark"
                      ? "/images/sidebar-logo-dark-theme.png"
                      : "/images/sidebar-logo-light-theme.png"
                  }
                  alt="BLECK's Logo"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>

              <span
                className={`
                  absolute top-1/2 -translate-y-2 left-[58px]
                  text-lg font-bold text-foreground tracking-wide whitespace-nowrap
                  transition-all duration-300 ease-out
                  ${isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
                  overflow-hidden pointer-events-none
                `}
                style={{
                  maxWidth: isExpanded ? "calc(var(--sb-w) - 80px)" : 0,
                }}
              >
                BLECK's
              </span>
            </div>
          </div>

          {/* Menu ajustável à altura da tela (sem scroll) */}
          <div className="flex-1 px-1 pb-4 overflow-visible">
            <div className="mt-2 h-full flex flex-col justify-between pr-1">
              {menuItems.map((item) => {
                const active = pathname === item.href
                const baseSize = item.size ?? 24
                const size = Math.round(baseSize * scaleFactor)
                const x = item.offsetX ?? 0
                const y = item.offsetY ?? 0
                const isMindmap = item.id === "mindmap"

                return (
                  <div
                    key={item.id}
                    className="relative group flex-1 flex items-center"
                  >
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigation(item.href)}
                      className={`
  w-full
  min-h-[32px] max-h-[44px]
  text-xs flex items-center py-0
  ${isExpanded ? "justify-start pl-4 pr-3" : "justify-start pl-4 pr-0"}
  rounded-xl
  transition-colors
  ${
    theme === "dark"
      ? active
        ? "bg-[rgba(0,0,0,0.50)] text-white"
        : "text-white hover:bg-[rgba(0,0,0,0.40)]"
      : active
        ? "bg-[#d9d9d9] text-[#1a1a1a]"
        : "bg-[#f2f2f2] text-[#1a1a1a] hover:bg-[#e5e5e5]"
  }
`}

                    >
                      {/* Ícone PNG */}
                      {item.iconPath ? (
                        <span
                          className="relative inline-flex items-center justify-center shrink-0 transition-transform duration-300"
                          style={{
                            width: size,
                            height: size,
                            transform: `translate(${x}px, ${y}px)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src={item.iconPath}
                            alt={item.title}
                            fill
                            className={`object-contain ${
                              theme === "dark"
                                ? isMindmap
                                  ? ""
                                  : "invert"
                                : isMindmap
                                  ? "invert"
                                  : ""
                            }`}
                            style={{ objectPosition: "center" }}
                          />
                        </span>
                      ) : item.icon ? (
                        <item.icon
                          className={`shrink-0 ${
                            theme === "dark" ? "text-white" : "text-black"
                          }`}
                          style={{
                            width: size,
                            height: size,
                            transform: `translate(${x}px, ${y}px)`,
                          }}
                        />
                      ) : null}

                      {/* Label normal quando expandido */}
                      {isExpanded && (
                        <span
                          className="ml-3 overflow-hidden transition-all duration-200"
                          style={{ maxWidth: `calc(var(--sb-w) - 56px)` }}
                        >
                          {item.title}
                        </span>
                      )}
                    </Button>

                    {/* Tooltip quando colapsado */}
                    {!isExpanded && (
                      <div
                        className="
                          absolute left-full top-1/2 ml-3 -translate-y-1/2
                          rounded-lg border border-border
                          bg-popover text-popover-foreground
                          px-3 py-1 text-xs
                          shadow-lg
                          opacity-0 scale-95
                          group-hover:opacity-100 group-hover:scale-100
                          transition-all duration-150
                          origin-left
                          whitespace-nowrap
                          z-50
                        "
                      >
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
          className="flex-1 flex flex-col overflow-hidden bg-background transition-[margin-left] duration-300"
          style={{
            marginLeft: `calc(var(--sb-w) + ${SIDEBAR_OFFSET_LEFT})`,
          }}
        >
          {children}
        </div>

        {/* Toggle em cima da LINHA entre sidebar e conteúdo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={`
            fixed z-50
            h-8 w-8 rounded-full p-0
            flex items-center justify-center
            backdrop-blur-3xl
            transition-all
            ${
              theme === "dark"
                ? `
                  bg-[rgba(20,20,20,0.9)]
                  border border-white/15
                  text-white
                  shadow-[0_18px_40px_rgba(0,0,0,0.85)]
                  hover:bg-[rgba(25,25,25,0.95)]
                `
                : `
                  bg-[rgba(255,255,255,0.9)]
                  border border-black/10
                  text-slate-900
                  shadow-[0_12px_30px_rgba(15,23,42,0.25)]
                  hover:bg-[rgba(255,255,255,1)]
                `
            }
          `}
          aria-label="Alternar largura do menu"
          style={{
            top: "120px",
            left: `calc(var(--sb-w) + ${SIDEBAR_OFFSET_LEFT} - 16px)`,
          }}
        >
          <SidebarToggleIcon />
        </Button>
      </div>
    </SidebarContext.Provider>
  )
}
