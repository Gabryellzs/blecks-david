import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Erro: Variáveis de ambiente Supabase (URL ou Service Role Key) não configuradas.")
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  })

  try {
    const body = await req.json()

    const userId = req.nextUrl.searchParams.get("user_id")
    const gatewayId = req.nextUrl.searchParams.get("gateway")

    if (!userId) {
      console.error("Erro: user_id não fornecido na URL do webhook.")
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
    }

    // Extrair os campos aninhados do corpo da requisição da Cakto
    const {
      order_id, // Embora não usado na inserção, é bom desestruturar se for relevante para logs/futuro
      status,
      event,
      customer,
      product,
      transaction,
    } = body

    // Verificar se os campos aninhados existem para evitar erros de referência
    if (!customer || !product || !transaction) {
      console.error("Erro: Payload do webhook da Cakto incompleto. Faltam dados de customer, product ou transaction.")
      return NextResponse.json({ error: "Dados do webhook incompletos." }, { status: 400 })
    }

    console.log("🔍 Payload recebido:", body)
console.log("📅 Data da transação:", transaction?.transaction_date)

const { error } = await supabase.from("gateway_transactions").insert([
  {
    user_id: userId,
    gateway_id: gatewayId ?? "cakto",
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    product_name: product.name,
    product_id: product.id,
    amount: transaction.amount,
    fee: transaction.fee,
    net_amount: transaction.net_amount,
    currency: transaction.currency,
    payment_method: transaction.payment_method,
    transaction_id: transaction.id,
    event_type: event,
    raw_payload: body,
  },
])

    if (error) {
      console.error("Erro ao salvar venda:", error)
      if (error.code === "23505" && error.message.includes("transaction_id")) {
        return NextResponse.json({ success: false, error: "Transação com este ID já existe." }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ Webhook Cakto recebido e venda salva com sucesso para user_id:", userId)
    return NextResponse.json({ success: true, saved: true })
  } catch (error: any) {
    console.error("Erro inesperado no webhook:", error)
    return NextResponse.json({ success: false, error: error.message || "Erro desconhecido." }, { status: 500 })
  }
}
