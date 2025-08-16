"use client"

import { BarChart, Calendar, Clock, PieChart, Wallet, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FinanceSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function FinanceSidebar({
  activeView,
  onViewChange,
  isCollapsed = false,
  onToggleCollapse,
}: FinanceSidebarProps) {
  const menuItems = [
    { id: "overview", label: "Visão Geral", icon: BarChart },
    { id: "daily", label: "Diário", icon: Calendar },
    { id: "weekly", label: "Semanal", icon: Clock },
    { id: "monthly", label: "Mensal", icon: PieChart },
    { id: "accounting", label: "Contabilidade", icon: FileSpreadsheet },
    { id: "annual", label: "Dados Salvos", icon: BarChart },
  ]

  return (
    <div
      className={cn(
        "h-full border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-56",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Financeiro
          </h2>
        )}
        {isCollapsed && <Wallet className="h-5 w-5 mx-auto" />}
        <Button
          variant="outline"
          size="icon"
          className="ml-auto h-8 w-8 rounded-md border bg-background"
          onClick={onToggleCollapse}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              activeView === item.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isCollapsed && "justify-center px-0",
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4" />
            {!isCollapsed && item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
