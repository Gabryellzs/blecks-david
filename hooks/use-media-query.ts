"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Definir o valor inicial
    setMatches(media.matches)

    // Definir um listener para mudanças
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Adicionar o listener
    media.addEventListener("change", listener)

    // Limpar o listener quando o componente for desmontado
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [query])

  return matches
}
