"use client"

import * as React from "react"
import Image from "next/image"

// Fallbacks em SVG (só usados se a imagem PNG não existir)
const FallbackSVGs: Record<string, React.FC<{ className?: string }>> = {
  "revenue-analysis": ({ className = "h-6 w-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16L11 12L15 16L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 10H21V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="16" r="1.5" fill="currentColor" />
      <circle cx="11" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="16" r="1.5" fill="currentColor" />
      <circle cx="21" cy="10" r="1.5" fill="currentColor" />
    </svg>
  ),
  "notebook-diary": ({ className = "h-6 w-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M4 4H20C20.8 4 21.5 4.7 21.5 5.5V18.5C21.5 19.3 20.8 20 20 20H4C3.2 20 2.5 19.3 2.5 18.5V5.5C2.5 4.7 3.2 4 4 4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" />
      <path d="M2.5 10H21.5" stroke="currentColor" strokeWidth="2" />
      <path d="M7 14H7.01M12 14H12.01M17 14H17.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "ai-brain": ({ className = "h-6 w-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C7 2 3 6 3 12C3 18 7 22 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 2C17 2 21 6 21 12C21 18 17 22 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M9 15C9 15 10 17 12 17C14 17 15 15 15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "calendar": ({ className = "h-6 w-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" />
      <rect x="7" y="14" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="11" y="14" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="15" y="14" width="2" height="2" rx="0.5" fill="currentColor" />
    </svg>
  ),
}

type IconInput = string | React.ComponentType<{ className?: string }>

export function FeatureIcon({
  icon,
  className = "h-8 w-8",
  alt = "icon",
}: {
  icon: IconInput
  className?: string
  alt?: string
}) {
  // Se for componente, renderiza direto
  if (typeof icon === "function") {
    const IconComp = icon as React.ComponentType<{ className?: string }>
    return <IconComp className={className} />
  }

  // Se for string, tenta carregar da pasta /public/icons/{icon}.png
  const [useFallback, setUseFallback] = React.useState(false)
  const key = icon.toLowerCase()

  if (!useFallback) {
    return (
      <Image
        src={`/icons/${key}.png`}
        alt={alt}
        width={32}
        height={32}
        className={className}
        onError={() => setUseFallback(true)}
        priority
      />
    )
  }

  // Fallback: usa nosso SVG embutido com o mesmo nome
  const Fallback = FallbackSVGs[key] || FallbackSVGs["revenue-analysis"]
  return <Fallback className={className} />
}
