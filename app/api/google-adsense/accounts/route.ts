import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: NextRequest) {
  try {
    console.log("🚨 === ROTA /api/google-adsense/accounts CHAMADA ===")

    // Verificar autenticação via cookies
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error("❌ Usuário não autenticado:", error)
      return NextResponse.redirect(new URL("/api/auth/force-resync", request.url))
    }

    console.log("✅ Usuário autenticado:", user.id)

    // Obter token válido do Google AdSense
    const token = await PlatformConfigManager.getValidToken(user.id, 'google_adsense')

    if (!token) {
      console.error("❌ Token do Google AdSense não encontrado")
      return NextResponse.json(
        { error: "Token do Google AdSense não encontrado" },
        { status: 401 }
      )
    }

    // Fazer requisição para a API do Google AdSense
    const response = await fetch(
      `https://adsense.googleapis.com/v2/accounts?access_token=${token}`,
      { method: "GET" }
    )

    if (!response.ok) {
      console.error("❌ Erro na resposta da API do Google AdSense:", response.status)
      return NextResponse.json(
        { error: "Erro ao obter dados do Google AdSense" },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.error) {
      console.error("❌ Erro na resposta do Google AdSense:", data.error)
      return NextResponse.json(
        { error: data.error.message || "Erro na API do Google AdSense" },
        { status: 400 }
      )
    }

    console.log("✅ Dados do Google AdSense obtidos com sucesso")
    return NextResponse.json(data)

  } catch (error: any) {
    console.error("❌ Erro inesperado na rota /api/google-adsense/accounts:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 