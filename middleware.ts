import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Rotas que não precisam de autenticação
const publicRoutes = ["/login", "/register", "/reset-password", "/update-password", "/", "/debug"]

// Rotas que são apenas para administradores
const adminRoutes = ["/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`DEBUG: [MIDDLEWARE] Checking route: ${pathname}`)

  // Verificar se é uma rota pública
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    console.log(`DEBUG: [MIDDLEWARE] Public route, allowing access: ${pathname}`)
    return NextResponse.next()
  }

  // Verificar se é uma rota de API
  if (pathname.startsWith("/api")) {
    console.log(`DEBUG: [MIDDLEWARE] API route, allowing access: ${pathname}`)
    return NextResponse.next()
  }

  // Verificar se é uma rota de assets
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json)$/)) {
    return NextResponse.next()
  }

  // Obter credenciais do Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseKey) {
    console.error("[MIDDLEWARE] Variáveis de ambiente do Supabase não configuradas")
    // Em vez de redirecionar, permitir acesso e deixar o cliente lidar com isso
    return NextResponse.next()
  }

  try {
    // Criar um cliente Supabase para o middleware
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Tentar obter a sessão
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    console.warn(`[MIDDLEWARE] Session: ${session?.user.email}`)

    // Se houver erro, PERMITIR acesso e deixar o cliente lidar
    if (error) {
      console.warn(`[MIDDLEWARE] Session error, but allowing access: ${error.message}`)
      return NextResponse.next()
    }

    // Se não houver sessão, AINDA ASSIM permitir acesso
    // O cliente que vai lidar com redirecionamento se necessário
    if (!session) {
      console.log(`[MIDDLEWARE] No session found, but allowing access to: ${pathname}`)
      return NextResponse.next()
    }

    console.log(`DEBUG: [MIDDLEWARE] Session found for user: ${session.user.email}`)

    // Verificar se é uma rota de admin
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      try {
        const { data: userData } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

        if (!userData || userData.role !== "admin") {
          console.log(`[MIDDLEWARE] Non-admin user trying to access admin route, redirecting to dashboard`)
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } catch (adminError) {
        console.warn(`[MIDDLEWARE] Error checking admin status, allowing access: ${adminError}`)
      }
    }

    return NextResponse.next()
  } catch (middlewareError) {
    console.error(`[MIDDLEWARE] Unexpected error, allowing access: ${middlewareError}`)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
