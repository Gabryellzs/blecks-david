"use client"

import { useState, useMemo } from "react"
import { Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

type Block = {
  id: string
  hour: string
  title: string
  description?: string
  tags?: string[]
}

type Tag = {
  id: string
  name: string
  color: string
}

interface BlocksSidebarProps {
  blocks: Block[]
  addBlock: (hour: string, title: string, description: string, tags: string[]) => Promise<void> | void
  deleteBlock: (id: string) => Promise<void> | void
  tags: Tag[]
  addTag: (name: string, color: string) => Promise<void> | void
  deleteTag: (id: string) => Promise<void> | void
}

const TAG_COLORS = [
  { name: "Vermelho", value: "bg-red-500" },
  { name: "Laranja", value: "bg-orange-500" },
  { name: "Amarelo", value: "bg-yellow-500" },
  { name: "Verde", value: "bg-green-500" },
  { name: "Azul", value: "bg-blue-500" },
  { name: "Roxo", value: "bg-purple-500" },
  { name: "Rosa", value: "bg-pink-500" },
  { name: "Cinza", value: "bg-gray-500" },
]

const BlocksSidebar = ({
  blocks,
  addBlock,
  deleteBlock,
  tags,
  addTag,
}: BlocksSidebarProps) => {
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)

  const [newBlock, setNewBlock] = useState({
    hour: "08:00",
    title: "",
    description: "",
    tags: [] as string[],
  })

  const [newTag, setNewTag] = useState({
    name: "",
    color: "bg-blue-500",
  })

  const sortedBlocks = useMemo(
    () =>
      [...blocks].sort((a, b) =>
        (a.hour || "").localeCompare(b.hour || ""),
      ),
    [blocks],
  )

  const handleAddBlock = async () => {
    if (!newBlock.hour || !newBlock.title.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o horário e o título.",
        variant: "destructive",
      })
      return
    }

    let formattedHour = newBlock.hour
    if (!formattedHour.match(/^\d{1,2}:\d{2}$/)) {
      toast({
        title: "Erro",
        description: "O formato do horário deve ser HH:MM.",
        variant: "destructive",
      })
      return
    }

    const [hours, minutes] = formattedHour.split(":")
    formattedHour = `${hours.padStart(2, "0")}:${minutes}`

    await addBlock(formattedHour, newBlock.title, newBlock.description, newBlock.tags)

    setNewBlock({ hour: "08:00", title: "", description: "", tags: [] })
    setIsBlockDialogOpen(false)

    toast({
      title: "Bloco adicionado",
      description: "Seu bloco de tempo foi adicionado com sucesso.",
    })
  }

  const handleAddTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para a tag.",
        variant: "destructive",
      })
      return
    }

    await addTag(newTag.name, newTag.color)
    setNewTag({ name: "", color: "bg-blue-500" })
    setIsTagDialogOpen(false)

    toast({
      title: "Tag adicionada",
      description: "Sua tag foi adicionada com sucesso.",
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Blocos de Tempo</h2>
        <Button size="sm" variant="outline" onClick={() => setIsBlockDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      {/* Lista */}
      {sortedBlocks.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground text-sm">
            Você ainda não criou blocos de tempo.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedBlocks.map((block) => (
            <Card key={block.id}>
              <CardContent className="p-3 flex justify-between items-start gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{block.hour}</div>
                  <div className="font-medium text-sm">{block.title}</div>
                  {block.description && (
                    <div className="text-xs text-muted-foreground mt-1">{block.description}</div>
                  )}
                  {block.tags && block.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {block.tags
                        .map((tagId) => tags.find((t) => t.id === tagId))
                        .filter(Boolean)
                        .map((tag) => (
                          <Badge key={tag!.id} variant="outline" className={`${tag!.color} text-white`}>
                            {tag!.name}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteBlock(block.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botão de criar tag */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">Tags rápidas:</span>
        {tags.map((tag) => (
          <Badge key={tag.id} variant="outline" className={`${tag.color} text-white`}>
            {tag.name}
          </Badge>
        ))}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          type="button"
          onClick={() => setIsTagDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Diálogo para novo bloco */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Bloco de Tempo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block-hour">Horário</Label>
                <Input
                  id="block-hour"
                  placeholder="08:00"
                  value={newBlock.hour}
                  onChange={(e) => setNewBlock({ ...newBlock, hour: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="block-title">Título</Label>
                <Input
                  id="block-title"
                  placeholder="Ex: Estudar tráfego"
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-description">Descrição</Label>
              <Textarea
                id="block-description"
                placeholder="Detalhes do compromisso (opcional)"
                value={newBlock.description}
                onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={newBlock.tags.includes(tag.id) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      newBlock.tags.includes(tag.id) ? `${tag.color} text-white` : ""
                    }`}
                    onClick={() => {
                      const exists = newBlock.tags.includes(tag.id)
                      const updatedTags = exists
                        ? newBlock.tags.filter((t) => t !== tag.id)
                        : [...newBlock.tags, tag.id]
                      setNewBlock({ ...newBlock, tags: updatedTags })
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  type="button"
                  onClick={() => setIsTagDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddBlock}>Adicionar Bloco</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para nova tag */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome da Tag</Label>
              <Input
                id="tag-name"
                placeholder="Ex: Urgente, Importante"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor da Tag</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <div
                    key={color.value}
                    className={`w-8 h-8 rounded cursor-pointer border-2 ${color.value} ${
                      newTag.color === color.value ? "border-black" : "border-transparent"
                    }`}
                    onClick={() => setNewTag({ ...newTag, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTag}>Adicionar Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BlocksSidebar
