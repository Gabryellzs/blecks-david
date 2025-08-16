import { cn } from "@/lib/utils"

type BlackLogoProps = {
  size?: "small" | "medium" | "large"
  className?: string
}

export function BlackLogo({ size = "medium", className }: BlackLogoProps) {
  // Definir tamanhos baseados na prop size
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  }

  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor" // Isso fará com que a cor seja herdada do texto
      className={cn(sizeClasses[size], "text-foreground", className)}
    >
      <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208-93.3 208-208 208zm0-352c-79.5 0-144 64.47-144 144s64.5 144 144 144 144-64.47 144-144-64.5-144-144-144zm0 240c-52.94 0-96-43.06-96-96s43.06-96 96-96 96 43.06 96 96-43.1 96-96 96zm0-160c-35.28 0-64 28.7-64 64s28.72 64 64 64 64-28.7 64-64-28.7-64-64-64z" />
    </svg>
  )
}
