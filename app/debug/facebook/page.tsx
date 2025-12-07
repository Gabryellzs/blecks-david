"use client"

import React, { useEffect, useState } from "react"
import {
  getFacebookAdAccounts,
  getFacebookCampaignsWithInsights,
} from "@/lib/facebook-ads-service"

type DebugState =
  | { loading: true; error: null; data: null }
  | { loading: false; error: string | null; data: any }

export default function FacebookDebugPage() {
  const [state, setState] = useState<DebugState>({
    loading: true,
    error: null,
    data: null,
  })

  const [preset, setPreset] = useState<"maximum" | "today" | "last_7d" | "last_30d">("maximum")

  async function load() {
    try {
      setState({ loading: true, error: null, data: null })

      // 1. Buscar contas do Facebook
      const accounts = await getFacebookAdAccounts()

      if (!accounts || accounts.length === 0) {
        setState({
          loading: false,
          error: "Nenhuma conta de anúncio encontrada.",
          data: null,
        })
        return
      }

      const result: any[] = []

      // 2. Para cada conta, pegar campanhas + insights
      for (const acc of accounts) {
        const campaigns = await getFacebookCampaignsWithInsights(
          acc.id,
          undefined,
          preset // "maximum" | "today" | "last_7d" | etc
        )

        result.push({
          ad_account: acc.id,
          ad_account_name: (acc as any).name ?? null,
          campaigns,
        })
      }

      setState({
        loading: false,
        error: null,
        data: {
          preset,
          accounts: result,
        },
      })
    } catch (err: any) {
      console.error("Facebook debug error:", err)
      setState({
        loading: false,
        error: err?.message || "Erro desconhecido",
        data: null,
      })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-xl font-bold mb-4">Debug Facebook Ads (Campanhas + Insights)</h1>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Período:</span>
          <select
            value={preset}
            onChange={(e) =>
              setPreset(e.target.value as "maximum" | "today" | "last_7d" | "last_30d")
            }
            className="bg-black/60 border border-white/20 text-sm px-2 py-1 rounded-md"
          >
            <option value="maximum">Maximum (tudo)</option>
            <option value="today">Hoje</option>
            <option value="last_7d">Últimos 7 dias</option>
            <option value="last_30d">Últimos 30 dias</option>
          </select>
        </div>

        <button
          onClick={load}
          className="text-sm px-3 py-1 rounded-md border border-emerald-400 text-emerald-300 hover:bg-emerald-500/10 transition"
        >
          Recarregar
        </button>
      </div>

      {state.loading && <div className="mb-2 text-sm text-white/70">Carregando...</div>}
      {state.error && (
        <div className="mb-2 text-sm text-red-400">Erro: {state.error}</div>
      )}

      <div className="mt-2 border border-white/10 rounded-lg p-3 bg-black/40 max-h-[80vh] overflow-auto">
        <pre className="text-xs whitespace-pre-wrap break-all">
          {state.data ? JSON.stringify(state.data, null, 2) : "// sem dados"}
        </pre>
      </div>
    </div>
  )
}
