"use client"
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  console.error("[GLOBAL ERROR]", error)
  return (
    <html>
      <body style={{ padding: 24 }}>
        <h2>Erro inesperado</h2>
        <button onClick={() => reset()} style={{ marginTop: 12 }}>Recarregar</button>
      </body>
    </html>
  )
}
