"use client"

import { useEffect } from "react"
import { useUpdates } from "@/hooks/use-updates"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"
import Image from "next/image"

export default function UpdatesHistoryPage() {
  const { updates, loading, error, fetchUpdates, markUpdateAsSeen } = useUpdates()

  useEffect(() => {
    fetchUpdates()
  }, [])

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "critical":
        return <Badge className="bg-red-500">Crítica</Badge>
      case "high":
        return <Badge className="bg-orange-500">Alta</Badge>
      case "medium":
        return <Badge className="bg-blue-500">Média</Badge>
      case "low":
        return <Badge className="bg-green-500">Baixa</Badge>
      default:
        return <Badge>{importance}</Badge>
    }
  }

  // Marcar todas as atualizações como vistas quando o usuário acessa esta página
  useEffect(() => {
    if (updates.length > 0) {
      updates.forEach((update) => {
        markUpdateAsSeen(update.id)
      })
    }
  }, [updates])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Histórico de Atualizações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Atualizações</CardTitle>
          <CardDescription>Veja todas as atualizações e melhorias feitas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500 py-4">Erro ao carregar atualizações: {error.message}</div>
          ) : updates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma atualização encontrada.</div>
          ) : (
            <div className="space-y-6">
              {updates.map((update) => (
                <div key={update.id} className="border rounded-lg p-6 relative hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-medium">{update.title}</h3>
                          <Badge variant="outline">v{update.version}</Badge>
                          {getImportanceBadge(update.importance)}
                        </div>
                        <p className="text-gray-700 mt-2">{update.description}</p>
                      </div>

                      <div className="text-sm text-gray-500 shrink-0">
                        {new Date(update.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {update.image_url && (
                      <div className="mt-2 relative h-64 w-full max-w-2xl overflow-hidden rounded-md">
                        <Image
                          src={update.image_url || "/placeholder.svg"}
                          alt={update.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {update.features && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Novidades:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {Object.entries(update.features).map(([key, value]) => (
                            <li key={key}>{value as string}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {update.action_url && update.action_text && (
                      <div className="mt-4">
                        <Button asChild variant="outline">
                          <a href={update.action_url} target="_blank" rel="noopener noreferrer">
                            {update.action_text} <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
