"use client"

import { useMemo, useState } from "react"
import { Edit, Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

type Tag = {
  id: string
  name: string
  color: string
}

type Category = {
  id: string
  name: string
  color: string
}

type Note = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  favorite: boolean
}

interface NotesTabProps {
  notes: Note[]
  addNote: (title: string, content: string, category: string, tags: string[]) => Promise<void> | void
  updateNote: (note: Note) => Promise<void> | void
  deleteNote: (id: string) => Promise<void> | void
  toggleFavorite: (id: string) => Promise<void> | void
  tags: Tag[]
  categories: Category[]
}

const NotesTab = ({
  notes,
  addNote,
  updateNote,
  deleteNote,
  toggleFavorite,
  tags,
  categories,
}: NotesTabProps) => {
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Dialog novo
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
  })

  // Dialog edição
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  const filteredAndSortedNotes = useMemo(() => {
    return [...notes]
      .filter((note) => {
        const matchesSearch =
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = selectedCategory === "all" || note.category === selectedCategory

        const matchesTags =
          selectedTags.length === 0 || selectedTags.some((tagId) => note.tags?.includes(tagId))

        return matchesSearch && matchesCategory && matchesTags
      })
      .sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
          case "title":
            comparison = a.title.localeCompare(b.title)
            break
          case "category": {
            const categoryA = categories.find((cat) => cat.id === a.category)?.name || ""
            const categoryB = categories.find((cat) => cat.id === b.category)?.name || ""
            comparison = categoryA.localeCompare(categoryB)
            break
          }
          case "date":
          default:
            comparison =
              new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
            break
        }

        return sortOrder === "asc" ? comparison : -comparison
      })
  }, [notes, searchTerm, selectedCategory, selectedTags, sortBy, sortOrder, categories])

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e o conteúdo da anotação.",
        variant: "destructive",
      })
      return
    }

    const categoryId = newNote.category || categories[0]?.id || ""

    await addNote(newNote.title, newNote.content, categoryId, newNote.tags)

    setNewNote({ title: "", content: "", category: "", tags: [] })
    setIsNewDialogOpen(false)

    toast({
      title: "Anotação adicionada",
      description: "Sua anotação foi adicionada com sucesso.",
    })
  }

  const handleUpdateNote = async () => {
    if (!editingNote) return

    await updateNote(editingNote)
    setEditingNote(null)

    toast({
      title: "Anotação atualizada",
      description: "Sua anotação foi atualizada com sucesso.",
    })
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho + botões */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Anotações do Dia a Dia</h2>
        <div className="flex gap-2">
          {/* Você pode criar diálogo de categoria separado se quiser */}
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Anotação
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar anotações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-filter">Categoria</Label>
              <select
                id="category-filter"
                className="w-full p-2 border rounded-md bg-background"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-by">Ordenar por</Label>
              <select
                id="sort-by"
                className="w-full p-2 border rounded-md bg-background"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "title" | "category")}
              >
                <option value="date">Data</option>
                <option value="title">Título</option>
                <option value="category">Categoria</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-order">Ordem</Label>
              <select
                id="sort-order"
                className="w-full p-2 border rounded-md bg-background"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notas */}
      {filteredAndSortedNotes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {notes.length === 0
              ? "Você ainda não tem anotações. Crie sua primeira anotação!"
              : "Nenhuma anotação encontrada com os filtros aplicados."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedNotes.map((note) => {
            const category = categories.find((cat) => cat.id === note.category)
            const noteTags = note.tags
              ?.map((tagId) => tags.find((tag) => tag.id === tagId))
              .filter(Boolean) as Tag[]

            return (
              <Card key={note.id} className={note.favorite ? "border-yellow-500/50 bg-yellow-500/5" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {category && (
                          <Badge variant="outline" className={`${category.color} text-white border-none`}>
                            {category.name}
                          </Badge>
                        )}
                        {noteTags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className={`${tag.color} text-white`}>
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(note.id)}
                        className={note.favorite ? "text-yellow-500" : "text-muted-foreground"}
                      >
                        ⭐
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingNote(note)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                  <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                    <span>Criado: {new Date(note.created_at).toLocaleDateString()}</span>
                    <span>Atualizado: {new Date(note.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Diálogo: nova anotação */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Anotação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Título</Label>
              <Input
                id="note-title"
                placeholder="Título da anotação"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-category">Categoria</Label>
              <select
                id="note-category"
                className="w-full p-2 border rounded-md bg-background"
                value={newNote.category}
                onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-content">Conteúdo</Label>
              <Textarea
                id="note-content"
                placeholder="Escreva sua anotação aqui..."
                className="min-h-[200px]"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={newNote.tags.includes(tag.id) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      newNote.tags.includes(tag.id) ? `${tag.color} text-white` : ""
                    }`}
                    onClick={() => {
                      const exists = newNote.tags.includes(tag.id)
                      const updatedTags = exists
                        ? newNote.tags.filter((t) => t !== tag.id)
                        : [...newNote.tags, tag.id]
                      setNewNote({ ...newNote, tags: updatedTags })
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddNote}>Adicionar Anotação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: editar anotação */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Anotação</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-note-title">Título</Label>
                <Input
                  id="edit-note-title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note-category">Categoria</Label>
                <select
                  id="edit-note-category"
                  className="w-full p-2 border rounded-md bg-background"
                  value={editingNote.category}
                  onChange={(e) => setEditingNote({ ...editingNote, category: e.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note-content">Conteúdo</Label>
                <Textarea
                  id="edit-note-content"
                  className="min-h-[200px]"
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={editingNote.tags.includes(tag.id) ? "default" : "outline"}
                      className={`cursor-pointer ${
                        editingNote.tags.includes(tag.id) ? `${tag.color} text-white` : ""
                      }`}
                      onClick={() => {
                        const exists = editingNote.tags.includes(tag.id)
                        const updatedTags = exists
                          ? editingNote.tags.filter((t) => t !== tag.id)
                          : [...editingNote.tags, tag.id]
                        setEditingNote({ ...editingNote, tags: updatedTags })
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingNote(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateNote}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NotesTab
