"use client"

import Dashboard from "@/components/dashboard"

export default function ProfilePage() {
  // O Dashboard já inclui Sidebar + Header + conteúdo da view de perfil
  return <Dashboard initialActiveView="profile" />
}
