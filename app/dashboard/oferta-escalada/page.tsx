"use client"

import Dashboard from "@/components/dashboard"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

export default function OfertaEscaladaPage() {
  return <Dashboard initialActiveView="oferta-escalada" />
}
