"use client"

import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/supabase" // usa seu client custom

export default function AuthDebugPage() {
  const [status, setStatus] = useState("loading")
  const [user, setUser] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function check() {
      try {
        const result = await getCurrentUser()

        if (result && result.user) {
          setUser(result.user)
          setStatus("ok")
        } else {
          setStatus("no-session")
        }
      } catch (err: any) {
        setStatus("error")
        setError(err.message || "Erro desconhecido")
      }
    }

    check()
  }, [])

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-bold">Auth Debug (Custom Client)</h1>

      <p>Status: {status}</p>

      {status === "ok" && (
        <pre className="bg-gray-900 text-gray-200 p-4 rounded">
          {JSON.stringify(user, null, 2)}
        </pre>
      )}

      {status === "no-session" && (
        <p>Nenhuma sessão ativa (pelo client custom).</p>
      )}

      {status === "error" && (
        <pre className="bg-red-900 text-red-100 p-3 rounded">
          {error}
        </pre>
      )}
    </div>
  )
}
