"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export default function DebugPage() {
  const pathname = usePathname()
  const [routes, setRoutes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Coleta informações sobre o ambiente
    const collectDebugInfo = async () => {
      try {
        // Lista de rotas conhecidas no aplicativo
        const knownRoutes = ["/", "/login", "/register", "/dashboard", "/reset-password", "/update-password", "/debug"]

        setRoutes(knownRoutes)
      } catch (err: any) {
        setError(err.message || "Erro desconhecido ao coletar informações de debug")
      }
    }

    collectDebugInfo()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Página de Diagnóstico</h1>

      <div className="mb-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <h2 className="mb-2 text-xl font-semibold">Informações da Rota Atual</h2>
        <p>
          <strong>Caminho atual:</strong> {pathname}
        </p>
      </div>

      <div className="mb-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <h2 className="mb-2 text-xl font-semibold">Rotas Conhecidas</h2>
        <ul className="list-inside list-disc">
          {routes.map((route) => (
            <li key={route}>{route}</li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
          <h2 className="mb-2 text-xl font-semibold">Erro</h2>
          <p>{error}</p>
        </div>
      )}

      <div className="mt-6">
        <a href="/dashboard" className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90">
          Voltar para o Dashboard
        </a>
      </div>
    </div>
  )
}
