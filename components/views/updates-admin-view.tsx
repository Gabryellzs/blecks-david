"use client"

import type React from "react"

import { useState } from "react"
import { useUpdates } from "@/hooks/use-updates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UpdatesAdminView() {
  const { addUpdate, updates, loading, error, deleteUpdate } = useUpdates()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    version: "1.0.0",
    importance: "medium" as "low" | "medium" | "high" | "critical",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addUpdate(formData)
    // Limpar formulário
    setFormData({
      title: "",
      description: "",
      version: "1.0.0",
      importance: "medium",
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Atualizações</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Nova Atualização</CardTitle>
            <CardDescription>
              Adicione uma nova atualização para notificar os usuários sobre mudanças no sistema.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Nova funcionalidade adicionada"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva os detalhes da atualização..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    name="version"
                    value={formData.version}
                    onChange={handleChange}
                    placeholder="1.0.0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="importance">Importância</Label>
                  <Select
                    value={formData.importance}
                    onValueChange={(value) => handleSelectChange("importance", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a importância" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Adicionando..." : "Adicionar Atualização"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atualizações Recentes</CardTitle>
            <CardDescription>Lista das últimas atualizações adicionadas ao sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4">Erro ao carregar atualizações: {error.message}</div>
            ) : updates.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">Nenhuma atualização encontrada.</div>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{update.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{update.description}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteUpdate(update.id)} className="ml-2">
                        Excluir
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">v{update.version}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          update.importance === "critical"
                            ? "bg-red-100 text-red-800"
                            : update.importance === "high"
                              ? "bg-amber-100 text-amber-800"
                              : update.importance === "medium"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                        }`}
                      >
                        {update.importance === "critical"
                          ? "Crítica"
                          : update.importance === "high"
                            ? "Alta"
                            : update.importance === "medium"
                              ? "Média"
                              : "Baixa"}
                      </span>
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        {new Date(update.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
