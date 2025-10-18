import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    // Obter informações da configuração atual
    const configInfo = await PlatformConfigManager.getConfigInfo(user.id, 'facebook')

    if (!configInfo) {
      return NextResponse.json(
        { error: "Configuração do Facebook não encontrada" },
        { status: 400 }
      )
    }

    // Verificar se o token está próximo de expirar (7 dias antes)
    if (configInfo.daysUntilExpiry && configInfo.daysUntilExpiry > 7) {
      return NextResponse.json({
        message: "Token ainda válido",
        expiresAt: configInfo.expiresAt
      })
    }

    // Obter token atual para renovação
    const currentToken = await PlatformConfigManager.getValidToken(user.id, 'facebook')
    
    if (!currentToken) {
      return NextResponse.json(
        { error: "Token do Facebook não encontrado" },
        { status: 400 }
      )
    }

    // Renovar o token usando o PlatformConfigManager
    const newToken = await PlatformConfigManager.refreshToken(user.id, 'facebook', currentToken)

    if (!newToken) {
      return NextResponse.json(
        { error: "Falha ao renovar token do Facebook" },
        { status: 400 }
      )
    }

    // Obter informações atualizadas
    const updatedConfigInfo = await PlatformConfigManager.getConfigInfo(user.id, 'facebook')

    console.log("Token do Facebook renovado com sucesso para usuário:", user.id)
    return NextResponse.json({
      message: "Token renovado com sucesso",
      expiresAt: updatedConfigInfo?.expiresAt
    })
  } catch (error: any) {
    console.error("Erro inesperado ao renovar token:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 