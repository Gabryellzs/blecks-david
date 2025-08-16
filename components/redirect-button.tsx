"use client"

import { Button } from "@/components/ui/button"

interface RedirectButtonProps {
  destination: string
  className?: string
}

export function RedirectButton({ destination, className }: RedirectButtonProps) {
  const handleRedirect = () => {
    window.location.href = destination
  }

  return (
    <Button onClick={handleRedirect} className={className}>
      Ir para o Dashboard
    </Button>
  )
}
