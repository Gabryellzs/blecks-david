import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"
import { savePlatformToken } from "@/lib/savePlatformToken" // ✅ vamos usar a função que salva no Supabase

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
    const configInfo = await PlatformConfigManager.getConfigInfo(user.id, "facebook")

    if (!configInfo) {
      return NextResponse.json(
        { error: "Configuração do Facebook não encontrada" },
        { status: 400 }
      )
    }

    // Verificar se o token ainda é válido
    if (configInfo.daysUntilExpiry && configInfo.daysUntilExpiry > 7) {
      return NextResponse.json({
        message: "Token ainda válido",
        expiresAt: configInfo.expiresAt,
      })
    }

    // Obter token atual
    const currentToken = await PlatformConfigManager.getValidToken(user.id, "facebook")

    if (!currentToken) {
      return NextResponse.json(
        { error: "Token do Facebook não encontrado" },
        { status: 400 }
      )
    }

    // Renovar o token via PlatformConfigManager
    const newToken = await PlatformConfigManager.refreshToken(
      user.id,
      "facebook",
      currentToken
    )

    if (!newToken) {
      return NextResponse.json(
        { error: "Falha ao renovar token do Facebook" },
        { status: 400 }
      )
    }

    // Salvar o token na tabela platform_tokens ✅
    try {
      await savePlatformToken({
        userId: user.id,
        platform: "meta",
        accountId: configInfo.accountId || "act_default",
        accessToken: newToken.access_token,
        refreshToken: newToken.refresh_token,
        expiresAt: newToken.expires_at,
      })
      console.log("✅ Token do Facebook salvo na tabela platform_tokens")
    } catch (err) {
      console.error("⚠️ Erro ao salvar token na platform_tokens:", err)
    }

    // Buscar novamente a config atualizada
    const updatedConfigInfo = await PlatformConfigManager.getConfigInfo(
      user.id,
      "facebook"
    )

    console.log("🔁 Token do Facebook renovado para usuário:", user.id)
    return NextResponse.json({
      message: "Token renovado com sucesso",
      expiresAt: updatedConfigInfo?.expiresAt,
    })
  } catch (error: any) {
    console.error("Erro inesperado ao renovar token:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
