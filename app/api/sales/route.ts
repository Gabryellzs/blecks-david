import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("user_id")
  const gatewayId = searchParams.get("gateway_id") // opcional
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
  }

  let query = supabase.from("sales").select("*").eq("user_id", userId)

  if (gatewayId && gatewayId !== "Todos os gateways") {
    query = query.eq("gateway_id", gatewayId)
  }

  if (startDate) {
    query = query.gte("created_at", startDate)
  }
  if (endDate) {
    query = query.lte("created_at", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar vendas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
