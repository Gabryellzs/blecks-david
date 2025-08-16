import type { NextRequest } from "next/server"

// Referência ao armazenamento de progresso definido em route.ts
declare global {
  var progressStore: Record<string, number>
}

if (!global.progressStore) {
  global.progressStore = {}
}

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("id")

  if (!requestId || !global.progressStore[requestId]) {
    return new Response(`data: ${JSON.stringify({ progress: 0 })}\n\n`, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }

  const progress = global.progressStore[requestId]
  const data = `data: ${JSON.stringify({ progress })}\n\n`

  return new Response(data, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
