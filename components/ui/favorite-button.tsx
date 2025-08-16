"use client"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  isFavorite: boolean
  onClick: () => void
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function FavoriteButton({ isFavorite, onClick, className, size = "icon" }: FavoriteButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size}
      className={cn("rounded-full", className)}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-all",
          isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
        )}
      />
    </Button>
  )
}
