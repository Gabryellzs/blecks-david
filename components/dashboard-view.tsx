"use client"
import type React from "react"

interface DashboardProps {
  userName?: string
}

export default function DashboardView({ userName = "" }: DashboardProps) {
  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
      </h2>
    </div>
  )
}
