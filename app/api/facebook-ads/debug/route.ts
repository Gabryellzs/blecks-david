import { NextResponse } from "next/server"
import { getFacebookAdAccounts, getFacebookCampaignsWithInsights } from "@/lib/facebook-ads-service"

export async function GET() {
  try {
    // 1. Buscar as contas do usuário
    const accounts = await getFacebookAdAccounts()

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta encontrada." },
        { status: 400 }
      )
    }

    const results: any[] = []

    // 2. Para cada BM, buscar campanhas + insights
    for (const acc of accounts) {
      const campaigns = await getFacebookCampaignsWithInsights(
        acc.id,
        undefined,
        "maximum" // pega tudo
      )

      results.push({
        ad_account: acc.id,
        campaigns,
      })
    }

    // 3. Retornar a resposta completa
    return NextResponse.json({ accounts: results })
  } catch (err: any) {
    console.error("ERROR Facebook Debug:", err)
    return NextResponse.json(
      { error: err.message || "Erro desconhecido." },
      { status: 500 }
    )
  }
}
