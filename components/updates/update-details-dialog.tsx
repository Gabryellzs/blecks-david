"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react"
import type { AppUpdate } from "@/lib/update-types"

interface UpdateDetailsDialogProps {
  update: AppUpdate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMarkAsSeen?: (updateId: string) => void
}

export function UpdateDetailsDialog({ update, open, onOpenChange, onMarkAsSeen }: UpdateDetailsDialogProps) {
  const handleClose = () => {
    if (update && onMarkAsSeen) {
      onMarkAsSeen(update.id)
    }
    onOpenChange(false)
  }

  if (!update) return null

  // Renderizar o ícone apropriado para a importância da atualização
  const renderImportanceIcon = (importance: string) => {
    switch (importance) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "medium":
        return <Info className="h-5 w-5 text-blue-500" />
      case "low":
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />
    }
  }

  // Obter a cor do badge com base na importância
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "critical":
        return "bg-red-500 hover:bg-red-600"
      case "high":
        return "bg-amber-500 hover:bg-amber-600"
      case "medium":
        return "bg-blue-500 hover:bg-blue-600"
      case "low":
      default:
        return "bg-green-500 hover:bg-green-600"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {renderImportanceIcon(update.importance)}
            {update.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{update.version}</Badge>
            <Badge className={getImportanceColor(update.importance)}>
              {update.importance.charAt(0).toUpperCase() + update.importance.slice(1)}
            </Badge>
          </div>

          <p className="text-sm">{update.description}</p>

          {update.features && update.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Novidades:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {update.features.map((feature, index) => (
                  <li key={index} className="text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {update.image_url && (
            <div className="mt-4">
              <img
                src={update.image_url || "/placeholder.svg"}
                alt={`Imagem da atualização: ${update.title}`}
                className="rounded-md w-full object-cover"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {new Date(update.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
          <div className="flex gap-2">
            {update.action_url && (
              <Button variant="outline" asChild>
                <a href={update.action_url} target="_blank" rel="noopener noreferrer">
                  {update.action_text || "Saiba mais"}
                </a>
              </Button>
            )}
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
