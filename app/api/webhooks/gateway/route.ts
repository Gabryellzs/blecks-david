import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("user_id")
  const gatewayId = searchParams.get("gateway") ?? "cakto" // Default para 'cakto' se não especificado

  console.log("🚀 WEBHOOK INICIADO:", {
    userId,
    gatewayId,
    url: req.url,
  })

  if (!userId) {
    console.error("❌ Missing user_id parameter")
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
  }

  let body: any
  try {
    body = await req.json()
    console.log("📦 PAYLOAD RECEBIDO:", JSON.stringify(body, null, 2))
  } catch (error) {
    console.error("❌ Erro ao parsear JSON:", error)
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  try {
    // --- Extração de dados do payload da Cakto ---
    const transactionId = body.data?.id || body.order_id || body.id || `${gatewayId}_${Date.now()}`
    const rawStatus = body.data?.status || body.event // Prioriza data.status, fallback para event
    const eventType = body.event || "sale" // Tipo de evento principal do webhook

    // Mapeamento de status para o nosso padrão
    let finalStatus: "completed" | "pending" | "failed" | "refunded" | "abandoned" | "unknown" = "pending"
    if (rawStatus) {
      const statusLower = rawStatus.toLowerCase()
      if (["completed", "approved", "paid", "success", "payment.success"].includes(statusLower)) {
        finalStatus = "completed"
      } else if (["failed", "error", "declined", "rejected", "payment.failed"].includes(statusLower)) {
        finalStatus = "failed"
      } else if (["cancelled", "canceled", "refunded", "payment.refunded"].includes(statusLower)) {
        finalStatus = "refunded"
      } else if (["pending", "processing", "awaiting_payment"].includes(statusLower)) {
        finalStatus = "pending"
      } else if (
        ["checkout.abandonment", "checkout_abandonment"].includes(statusLower) ||
        eventType.toLowerCase() === "checkout_abandonment"
      ) {
        // Explicitly set to abandoned if rawStatus or eventType indicates abandonment
        finalStatus = "abandoned"
      } else {
        finalStatus = "unknown" // Para status não mapeados
      }
    } else if (eventType.toLowerCase() === "checkout_abandonment") {
      // If rawStatus is empty but eventType is abandonment
      finalStatus = "abandoned"
    }

    const amount = Number.parseFloat(body.data?.amount?.toString() || "0")
    const fees = Number.parseFloat(body.data?.fees?.toString() || "0")
    // Calcula net_amount: comissão do produtor ou amount - fees
    const netAmount = Number.parseFloat(
      body.data?.commissions?.[0]?.totalAmount?.toString() || (amount - fees).toString() || "0",
    )

    const customerName = body.data?.customerName || body.data?.customer?.name || "N/A"
    const customerEmail = body.data?.customerEmail || body.data?.customer?.email || "N/A"
    const customerPhone = body.data?.customerCellphone || body.data?.customer?.phone || null
    const productName = body.data?.product?.name || "N/A"

    const transactionData = {
      user_id: userId,
      gateway_id: gatewayId,
      transaction_id: transactionId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      product_name: productName,
      amount: amount,
      fee: fees, // Usando 'fee' para o schema do banco
      net_amount: netAmount,
      status: finalStatus, // Use the determined finalStatus
      currency: body.data?.currency || "BRL", // Cakto não tem currency no payload de exemplo, mantendo BRL
      payment_method: body.data?.paymentMethodName || body.data?.paymentMethod || "unknown",
      event_type: eventType, // Keep original eventType
      raw_payload: body,
      created_at: new Date().toISOString(), // Definir created_at explicitamente
      updated_at: new Date().toISOString(), // Adicionar updated_at
      updated_by: "webhook", // Adicionado para rastreamento
      fees: fees, // Mapeando para a coluna 'fees' no DB
    }

    console.log("💾 DADOS PARA SALVAR/ATUALIZAR:", JSON.stringify(transactionData, null, 2))
    console.log("🎯 STATUS FINAL QUE SERÁ SALVO:", transactionData.status)
    console.log("👤 Cliente:", {
      name: transactionData.customer_name,
      email: transactionData.customer_email,
      phone: transactionData.customer_phone,
      product: transactionData.product_name,
    })

    // --- Lógica de UPSERT (Atualizar ou Inserir) ---
    // 1. Tentar encontrar uma transação existente com o mesmo transaction_id para este usuário e gateway
    const { data: existingTransactions, error: fetchError } = await supabase
      .from("gateway_transactions")
      .select("id, status")
      .eq("user_id", userId)
      .eq("gateway_id", gatewayId)
      .eq("transaction_id", transactionId)
      .limit(1)

    if (fetchError) {
      console.error("❌ ERRO AO BUSCAR TRANSAÇÃO EXISTENTE:", fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    let resultData: any[] | null = null
    let resultError: any = null

    if (existingTransactions && existingTransactions.length > 0) {
      // Transação existente: ATUALIZAR
      const existingId = existingTransactions[0].id
      console.log(`🔄 Transação existente encontrada (ID: ${existingId}). Atualizando...`)

      const { data, error } = await supabase
        .from("gateway_transactions")
        .update({ ...transactionData, updated_at: new Date().toISOString() }) // Atualizar updated_at
        .eq("id", existingId)
        .select()

      resultData = data
      resultError = error
    } else {
      // Transação não existente: INSERIR
      console.log("➕ Inserindo nova transação...")
      const { data, error } = await supabase.from("gateway_transactions").insert([transactionData]).select()

      resultData = data
      resultError = error
    }

    if (resultError) {
      console.error("❌ ERRO AO SALVAR/ATUALIZAR NO SUPABASE:", resultError)
      return NextResponse.json({ success: false, error: resultError.message }, { status: 500 })
    }

    console.log("✅ TRANSAÇÃO SALVA/ATUALIZADA COM SUCESSO:", resultData?.[0])
    console.log("🔍 STATUS SALVO NO BANCO:", resultData?.[0]?.status)

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      transaction_id: resultData?.[0]?.id,
      gateway: gatewayId,
      amount: transactionData.amount,
      status_received: rawStatus,
      status_saved: finalStatus,
      debug: {
        raw_status: rawStatus,
        mapped_status: finalStatus,
        transaction_id: transactionData.transaction_id,
      },
    })
  } catch (error) {
    console.error("❌ ERRO GERAL:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
