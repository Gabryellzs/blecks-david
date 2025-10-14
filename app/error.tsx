"use client"
export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  console.error("[PAGE ERROR]", error)
  return (
    <div style={{ padding: 24 }}>
      <h2>Ops, algo deu errado.</h2>
      <button onClick={() => reset()} style={{ marginTop: 12 }}>Tentar de novo</button>
    </div>
  )
}
