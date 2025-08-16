import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <h1 className="mb-4 text-4xl font-bold">404 - Página não encontrada</h1>
      <p className="mb-6 text-lg">A página que você está procurando não existe ou foi movida.</p>
      <Link href="/dashboard" className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
        Voltar para o Dashboard
      </Link>
    </div>
  )
}
