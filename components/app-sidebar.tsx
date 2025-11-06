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
  size?: number
  offsetX?: number
  offsetY?: number
}

// ---------------- Helpers ----------------
const STORAGE_KEY = "blecks:sidebar:isExpanded"

// Regras de largura responsiva (funciona em qualquer monitor)
// Colapsado: entre 56px e 88px, seguindo ~5% da viewport
// Expandido: entre 220px e 320px, seguindo ~18% da viewport
const COLLAPSED_WIDTH = "clamp(56px, 5vw, 88px)"
const EXPANDED_WIDTH  = "clamp(220px, 18vw, 320px)"

// Breakpoints para comportamento inicial automático
const AUTO_COLLAPSE_MAX = 1024  // <=1024px começa colapsado
const AUTO_EXPAND_MIN   = 1440  // >=1440px começa expandido

function getInitialExpanded(): boolean {
  if (typeof window === "undefined") return false
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === "true" || saved === "false") return saved === "true"
  const w = window.innerWidth
  if (w >= AUTO_EXPAND_MIN) return true
  if (w <= AUTO_COLLAPSE_MAX) return false
  return true // padrão “meio termo”: expande
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const router = useRouter()
  const pathname = usePathname()

  // Define CSS var --sb-w dinamicamente (usada para margin-left do conteúdo e posição do toggle)
  const sidebarWidth = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH

  useEffect(() => {
    const initial = getInitialExpanded()
    setIsExpanded(initial)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, String(isExpanded))
  }, [isExpanded])

  // Ajusta automaticamente ao redimensionar (ex.: o usuário move a janela para outro monitor)
  useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = debounce(() => {
      // só auto-ajusta se o usuário ainda não mexeu manualmente na sessão atual
      // (heurística: se o valor atual é igual ao derivado de largura, não “luta” contra o usuário)
      const w = window.innerWidth
      const inferred = w >= AUTO_EXPAND_MIN ? true : w <= AUTO_COLLAPSE_MAX ? false : true
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const userPref = saved === "true" || saved === "false" ? saved === "true" : null
      if (userPref === null) {
        setIsExpanded(inferred)
      }
      // Se preferir forçar sempre, troque por: setIsExpanded(inferred)
    }, 180)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const ICON_BASE = "/icons-siderbar"

  const menuItems: MenuItem[] = useMemo(() => ([
    { id: "results-dashboard", title: "Dashboard De Gateways", iconPath: `${ICON_BASE}/dashboard-gateways.png`, href: "/dashboard/gateways", size: 31, offsetX: 2 },
    { id: "billing-analysis", title: "Análise De Faturamento", iconPath: `${ICON_BASE}/Análise De Faturamento.png`, href: "/dashboard/billing-analysis", size: 31 },
    { id: "ads-dashboard", title: "Dashboard ADS", iconPath: `${ICON_BASE}/Dashboard ADS.png`, href: "/dashboard/ads", size: 55, offsetX: 1 },
    { id: "dashboard", title: "Dashboard", iconPath: `${ICON_BASE}/dashboard.png`, href: "/dashboard", size: 30 },
    { id: "diary", title: "Diário Semanal", iconPath: `${ICON_BASE}/Diario-Semanal.png`, href: "/dashboard/diary", size: 37, offsetX: -1 },
    { id: "productivity", title: "Produtividade", iconPath: `${ICON_BASE}/productivity.png`, href: "/dashboard/productivity", size: 37 },
    { id: "calendar", title: "Calendário", iconPath: `${ICON_BASE}/calendario.png`, href: "/dashboard/calendar", size: 41 },
    { id: "mindmap", title: "Mapa Mental", iconPath: `${ICON_BASE}/mapa-mental.png`, href: "/dashboard/mindmap", size: 40, offsetY: -1 },
    { id: "ai", title: "IA's", iconPath: `${ICON_BASE}/ias.png`, href: "/dashboard/ai", size: 32, offsetX: 1 },
    { id: "copywriting", title: "Copywriting", iconPath: `${ICON_BASE}/copywriting.png`, href: "/dashboard/copywriting", size: 30, offsetX: 1 },
    { id: "oferta", title: "Oferta Escalada", iconPath: `${ICON_BASE}/oferta.png`, href: "/dashboard/oferta", size: 29, offsetX: 1 },
    { id: "finances", title: "Financeiro", iconPath: `${ICON_BASE}/financeiro.png`, href: "/dashboard/finances", size: 30 },
    { id: "editor-paginas", title: "Suporte", iconPath: `${ICON_BASE}/suporte.png`, href: "/dashboard/support", size: 31 },
  ]), [])

  const handleNavigation = useCallback((href: string) => router.push(href), [router])
  const toggleSidebar = useCallback(() => setIsExpanded(v => !v), [])

  const SidebarToggleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {isExpanded ? (
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )

  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar }}>
      <div
        className="flex h-screen"
        // Define uma CSS var com a largura atual do sidebar
        style={{ ["--sb-w" as any]: sidebarWidth }}
      >
        {/* Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full z-40 transition-[width] duration-300 ease-in-out
            bg-background border-border border-r flex flex-col
          `}
          style={{ width: "var(--sb-w)" }}
        >
          {/* Header (compacto) */}
          <div className="px-3 pt-2 pb-1">
            <div className="relative h-[56px]">
              <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[70px] h-[67px]">
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
                  absolute top-1/2 -translate-y-1/2 left-[58px]
                  text-lg font-bold text-foreground tracking-wide whitespace-nowrap
                  transition-all duration-300 ease-out
                  ${isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
                  overflow-hidden pointer-events-none
                `}
                style={{
                  maxWidth: isExpanded ? "calc(var(--sb-w) - 80px)" : 0
                }}
              >
                BLECK's
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="px-3 mt-9">
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
                        w-full h-10 text-sm flex items-center
                        ${isExpanded ? "justify-start pl-3 pr-3" : "justify-center px-0"}
                        ${active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground text-foreground"}
                      `}
                    >
                      {/* Ícone 3D */}
                      {item.iconPath ? (
                        <span
                          className="relative inline-flex items-center justify-center shrink-0 transition-transform duration-300"
                          style={{
                            width: size,
                            height: size,
                            transform: isExpanded ? `translate(${x}px, ${y}px)` : `translate(0px, -2px)`,
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
                            transform: isExpanded ? `translate(${x}px, ${y}px)` : `translate(0px, -2px)`,
                          }}
                        />
                      ) : null}

                      {/* Label */}
                      {isExpanded && (
                        <span
                          className="ml-3 overflow-hidden transition-all duration-200"
                          style={{ maxWidth: `calc(var(--sb-w) - 80px)` }}
                        >
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
          className="flex-1 flex flex-col overflow-hidden bg-background transition-[margin-left] duration-300"
          style={{ marginLeft: "var(--sb-w)" }}
        >
          {children}
        </div>

        {/* Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="fixed top-16 z-50 transition-[left] duration-300 h-7 w-7 rounded-full p-0 bg-background hover:bg-accent border-2 border-border hover:border-accent text-foreground hover:text-accent-foreground shadow-lg hover:shadow-xl flex items-center justify-center"
          aria-label="Toggle Sidebar"
          style={{
            // posiciona o botão sempre “colado” no fim do sidebar, independente do tamanho/monitor
            left: `calc(var(--sb-w) - 15px)`,
          }}
        >
          <SidebarToggleIcon />
        </Button>
      </div>
    </SidebarContext.Provider>
  )
}
