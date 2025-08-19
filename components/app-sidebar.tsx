"use client"

import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  LineChart,
  BookOpen,
  CalendarClock,
  Calendar,
  Network,
  Bot,
  PenTool,
  CreditCard,
  Edit,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface AppSidebarProps {
  activeView?: string
  onViewChange?: (view: string) => void
}

export function AppSidebar(_props: AppSidebarProps) {
  const { theme } = useTheme()
  const { state: sidebarState, toggleSidebar } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { id: "results-dashboard", title: "Dashboard De Gateways", icon: BarChart3, href: "/dashboard/gateways" },
    { id: "billing-analysis",  title: "Análise De Faturamento", icon: TrendingUp, href: "/dashboard/billing-analysis" },
    { id: "ads-dashboard",     title: "Dashboard ADS",          icon: LineChart,  href: "/dashboard/ads" },
    { id: "dashboard",         title: "Dashboard",              icon: LayoutDashboard, href: "/dashboard" },
    { id: "diary",             title: "Diário Semanal",         icon: BookOpen,   href: "/dashboard/diary" },
    { id: "productivity",      title: "Organização / Produtividade", icon: CalendarClock, href: "/dashboard/productivity" },
    { id: "calendar",          title: "Calendário",             icon: Calendar,   href: "/dashboard/calendar" },
    { id: "mindmap",           title: "Mapa Mental",            icon: Network,    href: "/dashboard/mindmap" },
    { id: "ai",                title: "IA's",                   icon: Bot,        href: "/dashboard/ai" },
    { id: "copywriting",       title: "Copywriting",            icon: PenTool,    href: "/dashboard/copywriting" },
    { id: "oferta-escalada",   title: "Oferta Escalada",        icon: TrendingUp, href: "/dashboard/oferta-escalada" },
    { id: "finances",          title: "Financeiro",             icon: CreditCard, href: "/dashboard/finances" },
    { id: "support",           title: "Suporte",                icon: Edit,       href: "/dashboard/support" },
  ]

  const handleNavigation = (href: string) => router.push(href)

  const logoSrc =
    theme === "dark"
      ? "/images/sidebar-logo-dark-theme.png"
      : "/images/sidebar-logo-light-theme.png"

  return (
    <Sidebar collapsible="icon">
      {/* Header com logo */}
      <SidebarHeader className="flex flex-col p-4">
        <div className="flex flex-col items-center">
          <div className="mb-2 relative w-[65px] h-[70px]">
            <Image
              src={logoSrc}
              alt="BLECK's Logo"
              fill
              priority
              style={{ objectFit: "contain" }}
            />
          </div>
          {sidebarState === "expanded" && (
            <h1 className="text-xl font-bold">BLECK&apos;s</h1>
          )}
        </div>
      </SidebarHeader>

      {/* Conteúdo / Menu */}
      <SidebarContent>
        <SidebarGroup>
          {sidebarState === "expanded" && (
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => handleNavigation(item.href)}
                      tooltip={item.title}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer com botão de toggle (dentro do próprio sidebar) */}
      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mx-auto h-8 w-8 rounded-full"
          aria-label={sidebarState === "expanded" ? "Recolher menu" : "Expandir menu"}
        >
          {sidebarState === "expanded" ? (
            <ChevronsLeft className="h-4 w-4" />
          ) : (
            <ChevronsRight className="h-4 w-4" />
          )}
          <span className="sr-only">
            {sidebarState === "expanded" ? "Recolher menu" : "Expandir menu"}
          </span>
        </Button>
      </SidebarFooter>

      {/* Mantém o rail padrão para o modo "icon" */}
      <SidebarRail />
    </Sidebar>
  )
}
