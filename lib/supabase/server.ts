import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient as createClientDirect } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export function createClient() {
  const cookieStore = cookies()

  // Verificar se há sessão nos cookies
  const authTokenCookie = cookieStore.get("supabase_auth_token")?.value

  if (!authTokenCookie) {
    // Se não há cookies, usar Service Role Key para operações que precisam de autenticação
    return createClientDirect(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // Tentar extrair o token do JSON
  let accessToken = null
  try {
    const tokenData = JSON.parse(authTokenCookie)
    accessToken = tokenData.access_token
  } catch (error) {
    console.error("Erro ao parsear token do cookie:", error)
  }

  if (!accessToken) {
    // Se não conseguiu extrair o token, usar Service Role Key
    return createClientDirect(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // Criar cliente com o token extraído
  return createClientDirect(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  )
}
