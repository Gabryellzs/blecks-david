"use client"

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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

interface AppSidebarProps {
  activeView?: string
  onViewChange?: (view: string) => void
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { theme } = useTheme()
  const { state: sidebarState, toggleSidebar } = useSidebar()
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

  // Ícone customizado de barras paralelas (menor)
  const SidebarToggleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="10" y="2" width="2" height="12" rx="1" fill="currentColor" />
    </svg>
  )

  return (
    <div className="relative">
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex flex-col p-4">
          <div className="flex flex-col items-center">
            <div className="mb-2 relative w-[65px] h-[70px]">
              <Image
                src={theme === "dark" ? "/images/sidebar-logo-dark-theme.png" : "/images/sidebar-logo-light-theme.png"}
                alt="BLECK's Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            {sidebarState === "expanded" && <h1 className="text-xl font-bold">BLECK's</h1>}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            {sidebarState === "expanded" && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      onClick={() => handleNavigation(item.href)}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {/* Botão de Toggle Circular menor */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className={`
          absolute top-20 -right-3 z-20 
          h-6 w-6 rounded-full p-0
          ${
            theme === "dark"
              ? "bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-gray-500 text-white hover:text-white"
              : "bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
          }
          transition-all duration-200 ease-in-out
          shadow-lg hover:shadow-xl
          flex items-center justify-center
        `}
        aria-label="Toggle Sidebar"
      >
        <SidebarToggleIcon />
      </Button>
    </div>
  )
}
