"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Copy, Plus, Trash2, ArrowLeftRight, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CopyVersion {
  id: string
  title: string
  content: string
}

export default function CopyComparator() {
  const [versions, setVersions] = useState<CopyVersion[]>([
    { id: "1", title: "Versão A", content: "" },
    { id: "2", title: "Versão B", content: "" },
  ])
  const [savedComparisons, setSavedComparisons] = useState<{ id: string; title: string; versions: CopyVersion[] }[]>([])
  const [comparisonTitle, setComparisonTitle] = useState<string>("Minha Comparação")

  const { toast } = useToast()

  // Adicionar nova versão
  const addVersion = () => {
    const newId = (versions.length + 1).toString()
    const letterCode = 65 + versions.length // ASCII para A, B, C...
    const letter = String.fromCharCode(letterCode)

    setVersions([...versions, { id: newId, title: `Versão ${letter}`, content: "" }])
  }

  // Remover versão
  const removeVersion = (id: string) => {
    if (versions.length <= 2) {
      toast({
        title: "Erro",
        description: "É necessário manter pelo menos duas versões para comparação",
        variant: "destructive",
      })
      return
    }

    setVersions(versions.filter((v) => v.id !== id))
  }

  // Atualizar título da versão
  const updateVersionTitle = (id: string, title: string) => {
    setVersions(versions.map((v) => (v.id === id ? { ...v, title } : v)))
  }

  // Atualizar conteúdo da versão
  const updateVersionContent = (id: string, content: string) => {
    setVersions(versions.map((v) => (v.id === id ? { ...v, content } : v)))
  }

  // Copiar conteúdo
  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  // Trocar posições de duas versões
  const swapVersions = (index1: number, index2: number) => {
    const newVersions = [...versions]
    const temp = newVersions[index1]
    newVersions[index1] = newVersions[index2]
    newVersions[index2] = temp
    setVersions(newVersions)
  }

  // Salvar comparação atual
  const saveComparison = () => {
    // Verificar se há conteúdo para salvar
    const hasContent = versions.some((v) => v.content.trim() !== "")
    if (!hasContent) {
      toast({
        title: "Erro",
        description: "Adicione conteúdo em pelo menos uma versão antes de salvar",
        variant: "destructive",
      })
      return
    }

    const newComparison = {
      id: Date.now().toString(),
      title: comparisonTitle || "Comparação sem título",
      versions: [...versions],
    }

    setSavedComparisons([newComparison, ...savedComparisons])

    toast({
      title: "Salvo!",
      description: "Comparação salva com sucesso",
    })
  }

  // Carregar comparação salva
  const loadComparison = (comparisonId: string) => {
    const comparison = savedComparisons.find((c) => c.id === comparisonId)
    if (comparison) {
      setVersions(comparison.versions)
      setComparisonTitle(comparison.title)
    }
  }

  // Excluir comparação salva
  const deleteComparison = (comparisonId: string) => {
    setSavedComparisons(savedComparisons.filter((c) => c.id !== comparisonId))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comparador de Copies</CardTitle>
          <CardDescription>Compare diferentes versões de copy lado a lado para A/B testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={comparisonTitle}
              onChange={(e) => setComparisonTitle(e.target.value)}
              placeholder="Título da comparação"
              className="max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={saveComparison}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {versions.map((version, index) => (
              <Card key={version.id} className="overflow-hidden">
                <CardHeader className="p-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Input
                      value={version.title}
                      onChange={(e) => updateVersionTitle(version.id, e.target.value)}
                      className="h-8 w-32 text-sm font-medium"
                    />
                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => swapVersions(index, index - 1)}
                          className="h-7 w-7 p-0"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          <span className="sr-only">Mover para esquerda</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVersion(version.id)}
                        className="h-7 w-7 p-0 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <Textarea
                      value={version.content}
                      onChange={(e) => updateVersionContent(version.id, e.target.value)}
                      placeholder="Digite o texto desta versão..."
                      className="min-h-[200px] text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyContent(version.content)}
                        disabled={!version.content}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex items-center justify-center min-h-[200px]">
              <Button variant="outline" onClick={addVersion} className="h-16 w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Versão
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {savedComparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparações Salvas</CardTitle>
            <CardDescription>Acesse suas comparações anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedComparisons.map((comparison) => (
                <div
                  key={comparison.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{comparison.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {comparison.versions.length} versões •{" "}
                      {new Date(Number.parseInt(comparison.id)).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadComparison(comparison.id)}>
                      Carregar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteComparison(comparison.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
