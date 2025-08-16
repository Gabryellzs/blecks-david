"use client"

import { useState } from "react"
import { Check, Edit, Plus, Trash, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"

export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color: string
}

export function CategoryManager() {
  const [categories, setCategories] = useLocalStorage<Category[]>("finance-categories", [
    { id: "1", name: "Vendas de Produtos", type: "income", color: "#10b981" },
    { id: "2", name: "Afiliados", type: "income", color: "#3b82f6" },
    { id: "3", name: "Serviços", type: "income", color: "#8b5cf6" },
    { id: "4", name: "Marketing", type: "expense", color: "#ef4444" },
    { id: "5", name: "Ferramentas", type: "expense", color: "#f59e0b" },
    { id: "6", name: "Hospedagem", type: "expense", color: "#6366f1" },
  ])

  const [newCategory, setNewCategory] = useState<Omit<Category, "id">>({
    name: "",
    type: "expense",
    color: "#000000",
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState<"income" | "expense">("expense")
  const [editColor, setEditColor] = useState("")

  const addCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a categoria.",
        variant: "destructive",
      })
      return
    }

    const newId = Date.now().toString()
    setCategories([...categories, { ...newCategory, id: newId }])
    setNewCategory({
      name: "",
      type: "expense",
      color: "#000000",
    })

    toast({
      title: "Categoria adicionada",
      description: `A categoria "${newCategory.name}" foi adicionada com sucesso.`,
    })
  }

  const startEditing = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditType(category.type)
    setEditColor(category.color)
  }

  const saveEdit = (id: string) => {
    if (!editName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a categoria.",
        variant: "destructive",
      })
      return
    }

    setCategories(
      categories.map((category) =>
        category.id === id ? { ...category, name: editName, type: editType, color: editColor } : category,
      ),
    )

    setEditingId(null)

    toast({
      title: "Categoria atualizada",
      description: `A categoria "${editName}" foi atualizada com sucesso.`,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const deleteCategory = (id: string) => {
    const categoryToDelete = categories.find((c) => c.id === id)

    setCategories(categories.filter((category) => category.id !== id))

    toast({
      title: "Categoria excluída",
      description: `A categoria "${categoryToDelete?.name}" foi excluída com sucesso.`,
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>

      <Card>
        <CardHeader>
          <CardTitle>Nova Categoria</CardTitle>
          <CardDescription>Adicione categorias para organizar suas transações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input
              id="category-name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Ex: Marketing, Vendas, Hospedagem..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <RadioGroup
              value={newCategory.type}
              onValueChange={(value) => setNewCategory({ ...newCategory, type: value as "income" | "expense" })}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="new-income" />
                <Label htmlFor="new-income">Receita</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="new-expense" />
                <Label htmlFor="new-expense">Despesa</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-color">Cor</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="category-color"
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-12 h-10 p-1"
              />
              <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: newCategory.color }}></div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={addCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorias Existentes</CardTitle>
          <CardDescription>Gerencie suas categorias de receitas e despesas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-medium">Receitas</h3>
            <div className="space-y-2">
              {categories.filter((c) => c.type === "income").length > 0 ? (
                categories
                  .filter((c) => c.type === "income")
                  .map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 border rounded-md">
                      {editingId === category.id ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                            <Input
                              type="color"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                          </div>
                          <RadioGroup
                            value={editType}
                            onValueChange={(value) => setEditType(value as "income" | "expense")}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="income" id={`edit-income-${category.id}`} />
                              <Label htmlFor={`edit-income-${category.id}`}>Receita</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="expense" id={`edit-expense-${category.id}`} />
                              <Label htmlFor={`edit-expense-${category.id}`}>Despesa</Label>
                            </div>
                          </RadioGroup>
                          <div className="flex justify-end space-x-2">
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="mr-1 h-4 w-4" />
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={() => saveEdit(category.id)}>
                              <Check className="mr-1 h-4 w-4" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span>{category.name}</span>
                          </div>
                          <div className="flex space-x-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(category)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteCategory(category.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma categoria de receita cadastrada.</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <h3 className="font-medium">Despesas</h3>
            <div className="space-y-2">
              {categories.filter((c) => c.type === "expense").length > 0 ? (
                categories
                  .filter((c) => c.type === "expense")
                  .map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 border rounded-md">
                      {editingId === category.id ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                            <Input
                              type="color"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                          </div>
                          <RadioGroup
                            value={editType}
                            onValueChange={(value) => setEditType(value as "income" | "expense")}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="income" id={`edit-income-${category.id}`} />
                              <Label htmlFor={`edit-income-${category.id}`}>Receita</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="expense" id={`edit-expense-${category.id}`} />
                              <Label htmlFor={`edit-expense-${category.id}`}>Despesa</Label>
                            </div>
                          </RadioGroup>
                          <div className="flex justify-end space-x-2">
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="mr-1 h-4 w-4" />
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={() => saveEdit(category.id)}>
                              <Check className="mr-1 h-4 w-4" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span>{category.name}</span>
                          </div>
                          <div className="flex space-x-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(category)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteCategory(category.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma categoria de despesa cadastrada.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
