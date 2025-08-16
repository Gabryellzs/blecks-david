import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PlatformConfigManager } from "@/lib/platform-config-manager"

export async function GET(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    // Obter token válido do Facebook usando o PlatformConfigManager
    const accessToken = await PlatformConfigManager.getValidToken(user.id, 'facebook')

    if (!accessToken) {
      console.error("Token de acesso do Facebook não encontrado para o usuário")
      return NextResponse.json(
        { error: "Token de acesso do Facebook não encontrado. Por favor, reconecte sua conta." },
        { status: 400 },
      )
    }

    // Chamar a Graph API para listar contas de anúncio
    const response = await fetch(`https://graph.facebook.com/v23.0/me/adaccounts?access_token=${accessToken}`, {
      method: "GET",
    })
    const data = await response.json()

    if (data.error) {
      console.error("Erro ao buscar contas de anúncio do Facebook:", data.error)
      
      // Se o erro for de token inválido, sugerir reconexão
      if (data.error.code === 190 || data.error.code === 104) {
        return NextResponse.json(
          { error: "Token do Facebook expirado. Por favor, reconecte sua conta." },
          { status: 401 }
        )
      }
      
      return NextResponse.json({ error: data.error.message }, { status: response.status })
    }

    return NextResponse.json(data.data)
  } catch (error: any) {
    console.error("Erro inesperado ao buscar contas de anúncio do Facebook:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
