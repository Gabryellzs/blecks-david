"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Copy, Trash2, ArrowLeftRight, Save, Sparkles, RefreshCw, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CopyVersion {
  id: string
  title: string
  content: string
}

type Comparison = { id: string; title: string; versions: CopyVersion[] }

// ========== utils: tokenização e diff por palavras ==========
function tokenize(text: string) {
  return text.split(/(\s+|[.,!?:;()"“”'’\-–—])/).filter(Boolean)
}

function diffWords(a: string, b: string) {
  const A = tokenize(a)
  const B = tokenize(b)
  const n = A.length
  const m = B.length
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const parts: Array<{ text: string; type: "equal" | "added" | "removed" }> = []
  let i = 0,
    j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      parts.push({ text: A[i], type: "equal" })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      parts.push({ text: A[i], type: "removed" })
      i++
    } else {
      parts.push({ text: B[j], type: "added" })
      j++
    }
  }
  while (i < n) parts.push({ text: A[i++], type: "removed" })
  while (j < m) parts.push({ text: B[j++], type: "added" })
  return parts
}

// ========== heurística local (fallback) ==========
function heuristicImprove(text: string) {
  if (!text.trim()) return ""
  let out = text.trim()

  // título se não houver
  if (!/^#\s/m.test(out)) {
    const first = out.split(/[\.\!\?]\s/)[0] || "Apresente o principal benefício"
    out = `# ${first.replace(/\.$/, "")}\n\n${out}`
  }
  // bullets de benefícios
  if (!/\n\s*[-•]/.test(out)) {
    out += `\n\n**Benefícios principais**\n- Ganhe resultados medíveis em 7 dias\n- Processo simples, passo a passo\n- Suporte dedicado quando precisar`
  }
  // CTA
  if (!/(clique|comece|garanta|assine|fale|experimente)/i.test(out)) {
    out += `\n\n**Próximo passo:** Clique para começar agora.`
  }
  // números específicos
  out = out.replace(/\b(melhor|rápido|muito|grande)\b/gi, (m) => `${m} (ex.: 3x mais em 14 dias)`)

  return out
}

// ========== insights simples ==========
function extractInsights(base: string, improved: string) {
  const list: string[] = []
  if (/#/.test(improved) && !/#/.test(base)) list.push("Título adicionado destacando o benefício.")
  if (/\n\s*[-•]/.test(improved) && !/\n\s*[-•]/.test(base)) list.push("Benefícios organizados em bullets.")
  if (/(clique|comece|garanta|assine|fale|experimente)/i.test(improved) && !/(clique|comece|garanta|assine|fale|experimente)/i.test(base))
    list.push("CTA claro incluído.")
  if (/\b\d+ ?(x|dias|semanas|%|horas)\b/i.test(improved) && !/\b\d+ ?(x|dias|semanas|%|horas)\b/i.test(base))
    list.push("Números específicos aumentam credibilidade.")
  return list
}

export default function CopyComparator() {
  // começa com apenas 1 card (Versão A)
  const [versions, setVersions] = useState<CopyVersion[]>([{ id: "1", title: "Versão A", content: "" }])
  const [savedComparisons, setSavedComparisons] = useState<Comparison[]>([])
  const [comparisonTitle, setComparisonTitle] = useState<string>("Minha Comparação")
  const [isImproving, setIsImproving] = useState(false)

  const { toast } = useToast()

  const base = versions[0]?.content || ""
  const improved = versions[1]?.content || ""
  const hasImproved = versions.length > 1 && improved.trim() !== ""

  const parts = useMemo(() => (hasImproved ? diffWords(base, improved) : []), [base, improved, hasImproved])
  const insights = useMemo(() => (hasImproved ? extractInsights(base, improved) : []), [base, improved, hasImproved])

  const updateVersionContent = (id: string, content: string) =>
    setVersions((prev) => prev.map((v) => (v.id === id ? { ...v, content } : v)))

  const updateVersionTitle = (id: string, title: string) =>
    setVersions((prev) => prev.map((v) => (v.id === id ? { ...v, title } : v)))

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" })
  }

  const removeImproved = () => {
    // remove a versão B e deixa somente a A
    setVersions((prev) => prev.slice(0, 1))
    toast({ title: "Versão melhorada removida" })
  }

  const swapAB = () => {
    if (!hasImproved) return
    setVersions((prev) => {
      const copy = [...prev]
      ;[copy[0], copy[1]] = [copy[1], copy[0]]
      // renomeia títulos para manter sentido
      copy[0] = { ...copy[0], title: "Versão A" }
      copy[1] = { ...copy[1], title: "Versão Melhorada" }
      return copy
    })
  }

  const saveComparison = () => {
    const hasContent = versions.some((v) => v.content.trim() !== "")
    if (!hasContent) {
      toast({ title: "Erro", description: "Adicione conteúdo antes de salvar.", variant: "destructive" })
      return
    }
    const newComparison: Comparison = {
      id: Date.now().toString(),
      title: comparisonTitle || "Comparação sem título",
      versions: [...versions],
    }
    setSavedComparisons((prev) => [newComparison, ...prev])
    toast({ title: "Salvo!", description: "Comparação salva com sucesso" })
  }

  const loadComparison = (id: string) => {
    const c = savedComparisons.find((x) => x.id === id)
    if (c) {
      setVersions(c.versions)
      setComparisonTitle(c.title)
    }
  }

  const deleteComparison = (id: string) => {
    setSavedComparisons((prev) => prev.filter((x) => x.id !== id))
  }

  // ========= gerar versão melhorada =========
  const handleImprove = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast({ title: "Cole sua copy na Versão A primeiro.", variant: "destructive" })
        return
      }
      setIsImproving(true)
      let improvedText = ""
      try {
        const res = await fetch("/api/improve-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
        if (!res.ok) throw new Error("API indisponível")
        const data = await res.json()
        improvedText = (data?.text || "").trim()
      } catch {
        improvedText = heuristicImprove(text)
      } finally {
        setIsImproving(false)
      }

      setVersions((prev) => {
        if (prev.length === 1) {
          return [
            prev[0],
            { id: "2", title: "Versão Melhorada", content: improvedText || " " }, // garante render
          ]
        }
        // se já existir B, só atualiza
        return prev.map((v, i) => (i === 1 ? { ...v, title: "Versão Melhorada", content: improvedText } : v))
      })

      toast({ title: "Versão melhorada gerada" })
    },
    [toast],
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comparador de Copies</CardTitle>
          <CardDescription>Comece pela Versão A. Gere a melhorada quando quiser comparar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de ações */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              value={comparisonTitle}
              onChange={(e) => setComparisonTitle(e.target.value)}
              placeholder="Título da comparação"
              className="sm:max-w-xs"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveComparison}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button size="sm" onClick={() => handleImprove(base)} disabled={isImproving}>
                {isImproving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar versão melhorada
                  </>
                )}
              </Button>
              {hasImproved && (
                <>
                  <Button variant="outline" size="sm" onClick={swapAB} title="Trocar A ↔ B">
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Trocar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={removeImproved} title="Remover Versão B">
                    <X className="h-4 w-4 mr-2" />
                    Remover B
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Cards: começa com 1; mostra o 2 só após gerar */}
          <div className={`grid grid-cols-1 ${hasImproved ? "md:grid-cols-2" : ""} gap-4`}>
            {/* Versão A */}
            <Card className="overflow-hidden">
              <CardHeader className="p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <Input
                    value={versions[0].title}
                    onChange={(e) => updateVersionTitle(versions[0].id, e.target.value)}
                    className="h-8 w-40 text-sm font-medium"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <Textarea
                    value={versions[0].content}
                    onChange={(e) => updateVersionContent(versions[0].id, e.target.value)}
                    placeholder='Digite ou cole sua copy aqui...'
                    className="min-h-[220px] text-sm"
                  />
                  <div className="flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      Dica: cole sua copy e clique em “Gerar versão melhorada”.
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyContent(versions[0].content)}
                      disabled={!versions[0].content.trim()}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Versão B (só aparece após gerar) */}
            {hasImproved && (
              <Card className="overflow-hidden">
                <CardHeader className="p-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Input
                      value={versions[1].title}
                      onChange={(e) => updateVersionTitle(versions[1].id, e.target.value)}
                      className="h-8 w-48 text-sm font-medium"
                    />
                    <Button variant="ghost" size="sm" onClick={removeImproved} className="h-7 w-7 p-0" title="Remover">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <Textarea
                      value={versions[1].content}
                      onChange={(e) => updateVersionContent(versions[1].id, e.target.value)}
                      placeholder="Versão melhorada gerada..."
                      className="min-h-[220px] text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyContent(versions[1].content)}
                        disabled={!versions[1].content.trim()}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Destaques das melhorias */}
      {hasImproved && (
        <Card>
          <CardHeader>
            <CardTitle>Destaques de Melhorias</CardTitle>
            <CardDescription>Adições em destaque; removidos riscados (opcional).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border p-3 text-sm leading-7">
              {parts.map((p, i) =>
                p.type === "added" ? (
                  <mark key={i} className="rounded px-0.5 py-0.5 bg-emerald-600/20 text-emerald-300">
                    {p.text}
                  </mark>
                ) : p.type === "removed" ? (
                  <span key={i} className="opacity-50 line-through">
                    {p.text}
                  </span>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </div>

            {insights.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Insights detectados:</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {insights.map((x, k) => (
                    <li key={k}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico de comparações */}
      {savedComparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparações Salvas</CardTitle>
            <CardDescription>Acesse suas comparações anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedComparisons.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.versions.length} versão(ões) • {new Date(Number.parseInt(c.id)).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadComparison(c.id)}>
                      Carregar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteComparison(c.id)}>
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
