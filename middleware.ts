// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Prefixos públicos (match por prefixo)
const PUBLIC_PREFIXES = ["/login", "/register", "/reset-password", "/update-password", "/debug"]
// Rotas públicas que devem casar EXATAMENTE
const PUBLIC_EXACT = ["/"]

const ADMIN_PREFIXES = ["/admin"]

function isPublicRoute(pathname: string) {
  // match exato para as rotas exatas (inclui "/")
  if (PUBLIC_EXACT.includes(pathname)) return true

  // match por prefixo, mas garantindo borda de segmento para evitar colisões tipo "/login-xyz"
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function isAdminRoute(pathname: string) {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log(`DEBUG: [MIDDLEWARE] Checking route: ${pathname}`)

  // Rotas de assets e _next
  if (
    pathname.startsWith("/_next") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json|woff2?|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Rotas públicas liberadas (home incluída por EXATO "/")
  if (isPublicRoute(pathname)) {
    console.log(`DEBUG: [MIDDLEWARE] Public route, allowing access: ${pathname}`)
    return NextResponse.next()
  }

  // Rotas de API liberadas
  if (pathname.startsWith("/api")) {
    console.log(`DEBUG: [MIDDLEWARE] API route, allowing access: ${pathname}`)
    return NextResponse.next()
  }

  // Variáveis do Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseKey) {
    console.error("[MIDDLEWARE] Supabase env not set. Allowing access and letting client handle.")
    return NextResponse.next()
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.warn(`[MIDDLEWARE] Session error, allowing: ${error.message}`)
      return NextResponse.next()
    }

    // Sem sessão: permitir (cliente decide redirecionar se quiser),
    // mas **NUNCA** vamos redirecionar a home aqui.
    if (!session) {
      console.log(`[MIDDLEWARE] No session. Allowing access to: ${pathname}`)
      return NextResponse.next()
    }

    console.log(`DEBUG: [MIDDLEWARE] Session found for user: ${session.user.email}`)

    // Check admin somente se rota de admin
    if (isAdminRoute(pathname)) {
      try {
        const { data: userData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (!userData || userData.role !== "admin") {
          console.log(`[MIDDLEWARE] Non-admin to admin route -> redirect /dashboard`)
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } catch (adminError) {
        console.warn(`[MIDDLEWARE] Admin check error, allowing access: ${adminError}`)
      }
    }

    return NextResponse.next()
  } catch (err) {
    console.error(`[MIDDLEWARE] Unexpected error, allowing access: ${err}`)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
