import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🚨 === FORÇANDO RESYNC DE SESSÃO ===")
    
    // Redirecionar para login com parâmetro para limpar localStorage
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("force_resync", "true")
    loginUrl.searchParams.set("message", "Sessão expirada. Faça login novamente para continuar.")
    
    return NextResponse.redirect(loginUrl.toString())
  } catch (error: any) {
    console.error("Erro ao forçar resync:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
} 