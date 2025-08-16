"use client"

import { useState, useRef, useEffect } from "react"
import { Edit, Plus, Save, Trash, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useFavorites } from "@/hooks/use-favorites"
import { FavoriteButton } from "@/components/ui/favorite-button"

// Interface para as anotações
interface Note {
  id: string
  title: string
  content: string
  date: string
  color?: string
  createdAt?: string
}

export default function NotesView() {
  // Estado para as anotações
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", [])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedColor, setSelectedColor] = useState("")

  // Estado para edição
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editColor, setEditColor] = useState("")

  // Estado para filtro, pesquisa e ordenação
  const [filterBy, setFilterBy] = useState<"all" | "favorites">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Sistema de favoritos
  const { favorites, isFavorite, toggleFavorite } = useFavorites<Note>({ storageKey: "notes" })

  // Cores para as notas
  const noteColors = [
    { name: "Default", value: "" },
    { name: "Vermelho", value: "bg-red-50 dark:bg-red-900/20" },
    { name: "Verde", value: "bg-green-50 dark:bg-green-900/20" },
    { name: "Azul", value: "bg-blue-50 dark:bg-blue-900/20" },
    { name: "Amarelo", value: "bg-yellow-50 dark:bg-yellow-900/20" },
    { name: "Roxo", value: "bg-purple-50 dark:bg-purple-900/20" },
    { name: "Rosa", value: "bg-pink-50 dark:bg-pink-900/20" },
  ]

  // Referência para o textarea de conteúdo
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Função para adicionar nota
  const addNote = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e o conteúdo da nota.",
        variant: "destructive",
      })
      return
    }

    const now = new Date()
    const formattedDate = `${now.toLocaleDateString()} (${now.toLocaleTimeString()})`

    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      date: formattedDate,
      color: selectedColor,
      createdAt: now.toISOString(),
    }

    setNotes([newNote, ...notes])
    setTitle("")
    setContent("")
    setSelectedColor("")

    toast({
      title: "Nota adicionada",
      description: "Sua nota foi adicionada com sucesso.",
    })
  }

  // Funções para edição de notas
  const startEditing = (note: Note) => {
    setIsEditing(true)
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditColor(note.color || "")
  }

  const saveEdit = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e o conteúdo da nota.",
        variant: "destructive",
      })
      return
    }

    if (editingId) {
      const now = new Date()
      const formattedDate = `${now.toLocaleDateString()} (${now.toLocaleTimeString()} - Editado)`

      setNotes(
        notes.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: editTitle.trim(),
                content: editContent.trim(),
                date: formattedDate,
                color: editColor,
                createdAt: now.toISOString(),
              }
            : note,
        ),
      )

      setIsEditing(false)
      setEditingId(null)
      setEditTitle("")
      setEditContent("")
      setEditColor("")

      toast({
        title: "Nota atualizada",
        description: "Sua nota foi atualizada com sucesso.",
      })
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditingId(null)
    setEditTitle("")
    setEditContent("")
    setEditColor("")
  }

  // Função para excluir nota
  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))

    toast({
      title: "Nota excluída",
      description: "Sua nota foi excluída com sucesso.",
    })
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
  }

  // Filtragem e ordenação das notas
  const filteredNotes = notes
    .filter((note) => {
      // Filtrar por favoritos
      if (filterBy === "favorites" && !isFavorite(note.id)) {
        return false
      }

      // Filtrar por termo de pesquisa
      if (
        searchTerm &&
        !note.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !note.content.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Ordenar por título ou data
      if (sortBy === "title") {
        return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      } else {
        // Por padrão, ordenar por data
        const dateA = new Date(a.date.split(" (")[0].split("/").reverse().join("-"))
        const dateB = new Date(b.date.split(" (")[0].split("/").reverse().join("-"))
        return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      }
    })

  // Focar no textarea quando começar a editar
  useEffect(() => {
    if (isEditing && contentTextareaRef.current) {
      contentTextareaRef.current.focus()
    }
  }, [isEditing])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Anotações do Dia a Dia</h1>

      {/* Seção de Filtros e Ordenação */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Pesquisar notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={filterBy === "all" ? "default" : "outline"} onClick={() => setFilterBy("all")} size="sm">
            Todas
          </Button>
          <Button
            variant={filterBy === "favorites" ? "default" : "outline"}
            onClick={() => setFilterBy("favorites")}
            size="sm"
          >
            Favoritas
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc")
            }}
            size="sm"
          >
            {sortOrder === "asc" ? "Mais Antigas" : "Mais Recentes"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSortBy(sortBy === "date" ? "title" : "date")
            }}
            size="sm"
          >
            Ordenar por: {sortBy === "date" ? "Data" : "Título"}
          </Button>
        </div>
      </div>

      {/* Formulário para adicionar nota */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Input
            placeholder="Título da nota"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-medium"
            disabled={isEditing}
          />
          <Textarea
            placeholder="Conteúdo da nota..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
            disabled={isEditing}
          />
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Cor:</span>
            {noteColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setSelectedColor(color.value)}
                className={`h-6 w-6 rounded-full border ${
                  color.value || "bg-card border-border"
                } ${selectedColor === color.value ? "ring-2 ring-primary ring-offset-2" : ""}`}
                aria-label={color.name}
                disabled={isEditing}
              />
            ))}
            <div className="ml-auto">
              <Button onClick={addNote} disabled={isEditing}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Nota
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notas */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {filterBy === "favorites"
            ? "Você ainda não tem notas favoritas."
            : searchTerm
              ? "Nenhuma nota encontrada para a pesquisa."
              : "Você ainda não tem notas. Crie sua primeira nota acima!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className={`overflow-hidden ${note.color}`}>
              <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-base">{note.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{formatDate(note.createdAt)}</CardDescription>
                </div>
                <FavoriteButton
                  item={{
                    id: note.id,
                    type: "note",
                    title: note.title,
                    description: note.content,
                    path: `/notes/${note.id}`,
                  }}
                />
              </CardHeader>
              <CardContent className="p-0">
                {editingId === note.id ? (
                  /* Modo de Edição */
                  <div className="p-4 space-y-4">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-medium" />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[100px]"
                      ref={contentTextareaRef}
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-muted-foreground">Cor:</span>
                      {noteColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEditColor(color.value)}
                          className={`h-6 w-6 rounded-full border ${
                            color.value || "bg-card border-border"
                          } ${editColor === color.value ? "ring-2 ring-primary ring-offset-2" : ""}`}
                          aria-label={color.name}
                        />
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Modo de Visualização */
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl font-semibold">{note.title}</h2>
                      <div className="flex">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditing(note)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteNote(note.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap break-words">{note.content}</div>
                    <div className="mt-4 text-xs text-muted-foreground">{note.date}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
