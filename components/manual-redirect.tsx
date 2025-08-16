"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface ManualRedirectProps {
  to: string
  label: string
}

export function ManualRedirect({ to, label }: ManualRedirectProps) {
  const handleRedirect = () => {
    // Obter a URL base completa
    const baseUrl = window.location.origin
    const fullUrl = `${baseUrl}${to}`

    // Abrir em uma nova aba para evitar problemas de cache
    window.open(fullUrl, "_blank")
  }

  return (
    <Button onClick={handleRedirect} className="mt-4">
      <ExternalLink className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
