"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useUpdates } from "@/hooks/use-updates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, Upload, X } from "lucide-react"
import { uploadImage } from "@/lib/blob-utils"
import Image from "next/image"

export default function UpdatesAdminPage() {
  const { updates, loading, error, addUpdate, deleteUpdate } = useUpdates()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [version, setVersion] = useState("")
  const [importance, setImportance] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [actionUrl, setActionUrl] = useState("")
  const [actionText, setActionText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addUpdate({
        title,
        description,
        version,
        importance,
        image_url: imageUrl,
        action_url: actionUrl || undefined,
        action_text: actionText || undefined,
      })

      // Limpar formulário
      setTitle("")
      setDescription("")
      setVersion("")
      setImportance("medium")
      setImageUrl(null)
      setActionUrl("")
      setActionText("")
    } catch (error) {
      console.error("Erro ao adicionar atualização:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta atualização?")) {
      await deleteUpdate(id)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const result = await uploadImage(file)
      if (result.success && result.url) {
        setImageUrl(result.url)
      } else {
        alert(`Erro ao fazer upload da imagem: ${result.error}`)
      }
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      alert("Erro ao fazer upload da imagem. Tente novamente.")
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Gerenciar Atualizações</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Nova Atualização</CardTitle>
            <CardDescription>
              Crie uma nova atualização para notificar os usuários sobre mudanças no sistema.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Título
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ex: Nova funcionalidade de calendário"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Descreva os detalhes da atualização"
                  rows={4}
                />
              </div>

              <div>
                <label htmlFor="version" className="block text-sm font-medium mb-1">
                  Versão
                </label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  required
                  placeholder="Ex: 1.2.0"
                />
              </div>

              <div>
                <label htmlFor="importance" className="block text-sm font-medium mb-1">
                  Importância
                </label>
                <Select value={importance} onValueChange={(value: any) => setImportance(value)}>
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

              <div>
                <label className="block text-sm font-medium mb-1">Imagem (opcional)</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {!imageUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" /> Enviar imagem
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="relative w-full">
                      <div className="relative h-40 w-full overflow-hidden rounded-md border">
                        <Image
                          src={imageUrl || "/placeholder.svg"}
                          alt="Imagem da atualização"
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="actionUrl" className="block text-sm font-medium mb-1">
                  URL de Ação (opcional)
                </label>
                <Input
                  id="actionUrl"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="Ex: https://exemplo.com/nova-funcionalidade"
                />
              </div>

              <div>
                <label htmlFor="actionText" className="block text-sm font-medium mb-1">
                  Texto do Botão de Ação (opcional)
                </label>
                <Input
                  id="actionText"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="Ex: Ver nova funcionalidade"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adicionando...
                  </>
                ) : (
                  "Adicionar Atualização"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atualizações Existentes</CardTitle>
            <CardDescription>Gerencie as atualizações existentes no sistema.</CardDescription>
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
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="border rounded-lg p-4 relative hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="w-full">
                        <h3 className="font-medium">{update.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{update.description}</p>

                        {update.image_url && (
                          <div className="mt-2 relative h-24 w-full max-w-xs overflow-hidden rounded-md">
                            <Image
                              src={update.image_url || "/placeholder.svg"}
                              alt={update.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">v{update.version}</Badge>
                          {getImportanceBadge(update.importance)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(update.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{new Date(update.created_at).toLocaleString()}</div>
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
