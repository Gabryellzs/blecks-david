"use client"

import { useState, useRef, useEffect } from "react"
import { Edit, Plus, Save, Trash, X, Star, Filter, SortAsc, SortDesc } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useFavorites } from "@/hooks/use-favorites"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { cn } from "@/lib/utils"

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
  const { favorites, isFavorite, toggleFavorite } = useFavorites<Note>({
    storageKey: "notes",
  })

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

  // Referência para o textarea de conteúdo (edição)
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
    if (isNaN(date.getTime())) return ""
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Filtragem e ordenação das notas
  const filteredNotes = notes
    .filter((note) => {
      // Filtrar por favoritos
      if (filterBy === "favorites" && !isFavorite(note.id)) return false

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
      if (sortBy === "title") {
        return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      } else {
        // Ordenar por data usando createdAt (mais consistente)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      }
    })

  const totalNotes = notes.length
  const totalFavorites = favorites.length

  // Focar no textarea quando começar a editar
  useEffect(() => {
    if (isEditing && contentTextareaRef.current) {
      contentTextareaRef.current.focus()
    }
  }, [isEditing])

  return (
    <div className="h-full w-full bg-gradient-to-b from-background via-background/80 to-background">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Anotações do Dia a Dia
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Guarde ideias rápidas, lembretes e insights importantes em um só lugar.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <div className="rounded-full border border-border bg-card/60 px-3 py-1.5 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-medium">{totalNotes}</span>
              <span className="text-muted-foreground">notas</span>
            </div>
            <div className="rounded-full border border-border bg-card/60 px-3 py-1.5 flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium">{totalFavorites}</span>
              <span className="text-muted-foreground">favoritas</span>
            </div>
          </div>
        </div>

        {/* Filtros / busca */}
        <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Pesquisar notas por título ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-background/60"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <div className="inline-flex rounded-full border border-border bg-background/60 p-1">
                <Button
                  variant={filterBy === "all" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 rounded-full px-3 text-xs",
                    filterBy === "all" && "shadow-sm",
                  )}
                  onClick={() => setFilterBy("all")}
                >
                  Todas
                </Button>
                <Button
                  variant={filterBy === "favorites" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 rounded-full px-3 text-xs",
                    filterBy === "favorites" && "shadow-sm",
                  )}
                  onClick={() => setFilterBy("favorites")}
                >
                  <Star className="mr-1 h-3 w-3" />
                  Favoritas
                </Button>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-2 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-3.5 w-3.5" />
                  ) : (
                    <SortDesc className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    setSortBy((prev) => (prev === "date" ? "title" : "date"))
                  }
                >
                  <Filter className="mr-1 h-3.5 w-3.5" />
                  {sortBy === "date" ? "Data" : "Título"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário para nova nota */}
        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Nova nota
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Escreva rapidamente o que está na sua cabeça. Depois você pode editar, favoritar ou
              organizar como quiser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,0.35fr),minmax(0,0.65fr)]">
              <Input
                placeholder="Título da nota"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-medium bg-background/70"
                disabled={isEditing}
              />
              <Textarea
                placeholder="Conteúdo da nota..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] bg-background/70"
                disabled={isEditing}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Cor:</span>
                <div className="flex items-center gap-1.5">
                  {noteColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={cn(
                        "h-5 w-5 rounded-full border border-border transition-all",
                        color.value || "bg-card border-border",
                        selectedColor === color.value &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      )}
                      aria-label={color.name}
                      disabled={isEditing}
                    />
                  ))}
                </div>
              </div>

              <div className="ml-auto">
                <Button onClick={addNote} disabled={isEditing}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar nota
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de notas */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
            {filterBy === "favorites"
              ? "Você ainda não tem notas favoritas."
              : searchTerm
                ? "Nenhuma nota encontrada para a pesquisa."
                : "Você ainda não tem notas. Crie sua primeira nota acima!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className={cn(
                  "group relative overflow-hidden border-border/70 bg-card/90 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg",
                  note.color,
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary/0 to-primary/60 opacity-0 group-hover:opacity-100" />

                <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-tight line-clamp-2">
                      {note.title}
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      {note.createdAt ? formatDate(note.createdAt) : note.date}
                    </CardDescription>
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
                    // Modo de edição
                    <div className="space-y-4 p-4 pt-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="font-medium bg-background/70"
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px] bg-background/70"
                        ref={contentTextareaRef}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Cor:</span>
                        {noteColors.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setEditColor(color.value)}
                            className={cn(
                              "h-5 w-5 rounded-full border border-border transition-all",
                              color.value || "bg-card border-border",
                              editColor === color.value &&
                                "ring-2 ring-primary ring-offset-2 ring-offset-background",
                            )}
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
                    // Modo de visualização
                    <div className="space-y-3 p-4 pt-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {note.content}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEditing(note)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="pt-1 text-[11px] text-muted-foreground">
                        {note.date}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
