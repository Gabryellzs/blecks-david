"use client"

import { useState, useEffect } from "react"
import { checkSessionStatus, supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { redirectToDashboard, clearAuthCache, logAuthEvent } from "@/lib/auth-redirect"

export function AuthDiagnostics() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function checkAuth() {
    setLoading(true)
    setError(null)

    try {
      const result = await checkSessionStatus()

      // Se foi redirecionado, não atualizar o estado
      if (result.redirected) return

      setSessionInfo(result)
      logAuthEvent("Diagnóstico de autenticação executado", result)
    } catch (err: any) {
      setError(err.message || "Erro ao verificar autenticação")
      logAuthEvent("Erro no diagnóstico de autenticação", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  async function handleRefreshToken() {
    setLoading(true)
    try {
      if (!supabase) {
        throw new Error("Cliente Supabase não inicializado")
      }

      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        throw error
      }

      logAuthEvent("Token renovado manualmente", { success: true })
      await checkAuth()
    } catch (err: any) {
      setError(err.message || "Erro ao renovar token")
      logAuthEvent("Erro ao renovar token manualmente", err)

      // Se for erro de refresh token, redirecionar para login
      if (err.message?.includes("refresh_token_not_found") || err.code === "refresh_token_not_found") {
        window.location.href = "/login?error=session_expired"
        return
      }
    } finally {
      setLoading(false)
    }
  }

  function handleClearCache() {
    clearAuthCache()
    logAuthEvent("Cache de autenticação limpo manualmente")
    window.location.reload()
  }

  function handleForceRedirect() {
    logAuthEvent("Redirecionamento forçado manualmente")
    redirectToDashboard()
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">Diagnóstico de Autenticação</h2>

      {loading ? (
        <div className="flex items-center justify-center p-4">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          <span>Verificando autenticação...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : sessionInfo?.isAuthenticated ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Autenticado</AlertTitle>
          <AlertDescription>
            Você está autenticado. Sessão válida até {new Date(sessionInfo.session?.expires_at * 1000).toLocaleString()}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não autenticado</AlertTitle>
          <AlertDescription>Você não está autenticado ou sua sessão expirou.</AlertDescription>
        </Alert>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={checkAuth} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Verificar novamente
        </Button>
        <Button size="sm" variant="outline" onClick={handleRefreshToken} disabled={loading}>
          Renovar token
        </Button>
        <Button size="sm" variant="outline" onClick={handleClearCache} disabled={loading}>
          Limpar cache
        </Button>
        {sessionInfo?.isAuthenticated && (
          <Button size="sm" variant="default" onClick={handleForceRedirect}>
            Ir para Dashboard
          </Button>
        )}
      </div>

      {sessionInfo && (
        <div className="mt-4">
          <details>
            <summary className="cursor-pointer text-sm font-medium">Detalhes da sessão</summary>
            <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
