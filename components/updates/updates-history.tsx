"use client"

import { useState, useEffect } from "react"
import { useUpdates } from "@/hooks/use-updates"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Info, AlertCircle, RefreshCw } from "lucide-react"
import { UpdateDetailsDialog } from "@/components/updates/update-details-dialog"
import type { AppUpdate } from "@/lib/update-types"

export function UpdatesHistory() {
  const { updates, loading, error, loadAllUpdates, markUpdateAsSeen } = useUpdates()
  const [selectedUpdate, setSelectedUpdate] = useState<AppUpdate | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Carregar atualizações ao montar o componente
  useEffect(() => {
    loadAllUpdates()
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Histórico de Atualizações</h2>
        <Button onClick={loadAllUpdates} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error && <div className="bg-red-100 text-red-800 p-3 rounded-md">{error}</div>}

      {updates.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">Nenhuma atualização encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id} className="overflow-hidden">
              <div
                className={`h-1 ${
                  update.importance === "critical"
                    ? "bg-red-500"
                    : update.importance === "high"
                      ? "bg-amber-500"
                      : update.importance === "medium"
                        ? "bg-blue-500"
                        : "bg-green-500"
                }`}
              />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {renderImportanceIcon(update.importance)}
                    <CardTitle className="text-lg">{update.title}</CardTitle>
                  </div>
                  <Badge variant="outline">{update.version}</Badge>
                </div>
                <CardDescription>
                  {new Date(update.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm line-clamp-2">{update.description}</p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUpdate(update)
                    setDetailsOpen(true)
                  }}
                >
                  Ver detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <UpdateDetailsDialog
        update={selectedUpdate}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onMarkAsSeen={markUpdateAsSeen}
      />
    </div>
  )
}
