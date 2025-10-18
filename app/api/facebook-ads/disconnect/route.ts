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
    // Remover configuração do Facebook usando o PlatformConfigManager
    const success = await PlatformConfigManager.removeConfig(user.id, 'facebook')
    
    if (!success) {
      return NextResponse.json(
        { error: "Falha ao desconectar conta do Facebook" },
        { status: 500 }
      )
    }

    console.log("Facebook desconectado com sucesso para usuário:", user.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro inesperado ao desconectar Facebook:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 