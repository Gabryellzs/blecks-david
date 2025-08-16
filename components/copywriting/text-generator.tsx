"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function TextGenerator() {
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateCopy = async () => {
    if (!prompt.trim()) {
      setError("Por favor, insira um prompt para gerar o texto")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao gerar texto")
      }

      const data = await response.json()
      setResult(data.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao gerar texto")
      console.error("Erro ao gerar texto:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerador de Texto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Prompt
          </label>
          <Textarea
            id="prompt"
            placeholder="Descreva o texto que você deseja gerar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

        {result && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Resultado</label>
            <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">{result}</div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={generateCopy} disabled={isLoading || !prompt.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            "Gerar Texto"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
