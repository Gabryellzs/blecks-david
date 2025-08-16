"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function DebugSupabase() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    const results: any = {}

    try {
      // 1. Testar configuração
      results.config = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurada" : "Não configurada",
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurada" : "Não configurada",
      }

      // 2. Testar sessão
      console.log("🔍 [DEBUG] Testando sessão...")
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      results.session = {
        hasSession: !!sessionData.session,
        hasUser: !!sessionData.session?.user,
        userId: sessionData.session?.user?.id,
        userEmail: sessionData.session?.user?.email,
        error: sessionError?.message,
        fullSession: sessionData.session,
      }

      // 3. Testar conexão com tabela
      console.log("🔍 [DEBUG] Testando conexão com tabela...")
      const { data: countData, error: countError } = await supabase
        .from("gateway_transactions")
        .select("count", { count: "exact" })

      results.tableConnection = {
        success: !countError,
        count: countData,
        error: countError?.message,
      }

      // 4. Testar busca de dados
      console.log("🔍 [DEBUG] Testando busca de dados...")
      const { data: allData, error: dataError } = await supabase.from("gateway_transactions").select("*").limit(5)

      results.dataFetch = {
        success: !dataError,
        count: allData?.length || 0,
        data: allData,
        error: dataError?.message,
      }

      // 5. Se temos userId, testar busca filtrada
      if (sessionData.session?.user?.id) {
        console.log("🔍 [DEBUG] Testando busca filtrada por usuário...")
        const { data: userData, error: userError } = await supabase
          .from("gateway_transactions")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .limit(5)

        results.userDataFetch = {
          success: !userError,
          count: userData?.length || 0,
          data: userData,
          error: userError?.message,
        }
      }

      setDebugInfo(results)
      console.log("🔍 [DEBUG] Resultados completos:", results)
    } catch (error) {
      console.error("❌ [DEBUG] Erro geral:", error)
      results.generalError = error
      setDebugInfo(results)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Supabase</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={testConnection} disabled={isLoading}>
            {isLoading ? "Testando..." : "Testar Conexão"}
          </Button>

          {debugInfo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Configuração:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.config, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold">Sessão:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.session, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold">Conexão com Tabela:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.tableConnection, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold">Busca de Dados:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.dataFetch, null, 2)}
                </pre>
              </div>

              {debugInfo.userDataFetch && (
                <div>
                  <h4 className="font-semibold">Dados do Usuário:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(debugInfo.userDataFetch, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
