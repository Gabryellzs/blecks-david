import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// -------- Helpers --------
type StdStatus = "completed" | "pending" | "failed" | "refunded" | "abandoned" | "unknown"

function pick<T = any>(...vals: T[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v
  return undefined
}

function normalizeStatus(rawStatus?: string, eventType?: string): StdStatus {
  const s = String(rawStatus ?? "").toLowerCase()
  const e = String(eventType ?? "").toLowerCase()

  if (["completed","approved","paid","success","payment.success"].includes(s)) return "completed"
  if (["failed","error","declined","rejected","payment.failed"].includes(s)) return "failed"
  if (["cancelled","canceled","refunded","payment.refunded"].includes(s)) return "refunded"
  if (["pending","processing","awaiting_payment"].includes(s)) return "pending"
  if (["checkout.abandonment","checkout_abandonment","cart_abandoned"].includes(s) || e === "checkout_abandonment") return "abandoned"
  return "unknown"
}

function normalizePayload(gatewayId: string, body: any) {
  // GENÉRICO (fallback) — muitos gateways batem com isso
  const generic = {
    transactionId: pick(body.data?.id, body.order_id, body.id, body.transaction_id),
    rawStatus:     pick(body.data?.status, body.status, body.event, body.type),
    eventType:     pick(body.event, body.type, "sale"),
    amount:        Number(pick(body.data?.amount, body.amount, body.value, 0)) || 0,
    fees:          Number(pick(body.data?.fees, body.fees, 0)) || 0,
    commissions:   pick(body.data?.commissions, body.commissions),
    currency:      pick(body.data?.currency, body.currency, "BRL"),
    paymentMethod: pick(body.data?.paymentMethodName, body.data?.paymentMethod, body.payment_method, "unknown"),
    customerName:  pick(body.data?.customerName, body.data?.customer?.name, body.customer?.name, body.name, "N/A"),
    customerEmail: pick(body.data?.customerEmail, body.data?.customer?.email, body.customer?.email, body.email, "N/A"),
    customerPhone: pick(body.data?.customerCellphone, body.data?.customer?.phone, body.customer?.phone, body.phone, null),
    productName:   pick(body.data?.product?.name, body.product?.name, body.product_name, "N/A"),
  }

  // Ajuste por gateway aqui se o payload real divergir do genérico
  switch (gatewayId) {
    // NOVOS
    case "soutpay":     return { ...generic }
    case "zeroonepay":  return { ...generic }
    case "greenn":      return { ...generic }
    case "logzz":       return { ...generic }
    case "payt":        return { ...generic }
    case "vega":        return { ...generic }
    case "ticto":       return { ...generic }

    // EXISTENTES (mantém fallback)
    case "kirvano":
    case "cakto":
    case "kiwify":
    case "hotmart":
    case "monetizze":
    case "eduzz":
    case "pepper":
    case "braip":
    case "lastlink":
    case "disrupty":
    case "perfectpay":
    case "goatpay":
    case "tribopay":
    case "nuvemshop":
    case "woocommerce":
    case "loja_integrada":
    case "cartpanda":
    default:
      return { ...generic }
  }
}

// -------- Handler --------
export async function POST(
  req: NextRequest,
  ctx: { params: { gateway?: string } }
) {
  const { searchParams } = new URL(req.url)

  const userId = searchParams.get("user_id")
  // gateway pode vir do path /webhooks/[gateway] ou da query ?gateway=
  const gatewayFromPath  = ctx?.params?.gateway
  const gatewayFromQuery = searchParams.get("gateway")
  const gatewayId = (gatewayFromPath || gatewayFromQuery || "cakto").toLowerCase()

  console.log("🚀 WEBHOOK INICIADO:", { userId, gatewayId, url: req.url })

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
    // Normalização por gateway
    const norm = normalizePayload(gatewayId, body)
    const finalStatus = normalizeStatus(norm.rawStatus, norm.eventType)

    // net_amount: tenta comissão (quando existir), senão amount - fees
    const netAmount = Number(
      pick(norm.commissions?.[0]?.totalAmount, norm.amount - norm.fees, 0)
    ) || 0

    const transactionId = norm.transactionId || `${gatewayId}_${Date.now()}`

    const transactionData = {
      user_id: userId,
      gateway_id: gatewayId,
      transaction_id: transactionId,
      customer_name: norm.customerName,
      customer_email: norm.customerEmail,
      customer_phone: norm.customerPhone,
      product_name: norm.productName,
      amount: norm.amount,
      fee: norm.fees,
      net_amount: netAmount,
      status: finalStatus,
      currency: norm.currency || "BRL",
      payment_method: norm.paymentMethod,
      event_type: norm.eventType,
      raw_payload: body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: "webhook",
      fees: norm.fees,
    }

    console.log("💾 DADOS PARA SALVAR/ATUALIZAR:", JSON.stringify(transactionData, null, 2))
    console.log("🎯 STATUS FINAL QUE SERÁ SALVO:", transactionData.status)
    console.log("👤 Cliente:", {
      name: transactionData.customer_name,
      email: transactionData.customer_email,
      phone: transactionData.customer_phone,
      product: transactionData.product_name,
    })

    // Upsert por (user_id, gateway_id, transaction_id)
    const { data: existing, error: fetchError } = await supabase
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

    if (existing && existing.length > 0) {
      const existingId = existing[0].id
      console.log(`🔄 Transação existente encontrada (ID: ${existingId}). Atualizando...`)
      const { data, error } = await supabase
        .from("gateway_transactions")
        .update({ ...transactionData, updated_at: new Date().toISOString() })
        .eq("id", existingId)
        .select()
      resultData = data
      resultError = error
    } else {
      console.log("➕ Inserindo nova transação...")
      const { data, error } = await supabase
        .from("gateway_transactions")
        .insert([transactionData])
        .select()
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
      status_received: norm.rawStatus,
      status_saved: finalStatus,
      debug: {
        raw_status: norm.rawStatus,
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
      { status: 500 }
    )
  }
}
