"use client"

import { createClient, type Session, type User } from "@supabase/supabase-js"

// ===== CONFIG BÁSICA =====

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// se não tiver env, evita quebrar (mas não autentica de verdade)
const hasEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY

export const supabase = hasEnv
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        persistSession: true,
      },
    })
  : // client “fake” só pra não quebrar import se esquecer as envs
    ({} as ReturnType<typeof createClient>)

// usado pelo seu formulário de login pra avisar se está usando mock
export function isUsingMockClient() {
  return !hasEnv
}

// ===== FUNÇÕES DE AUTENTICAÇÃO =====

export async function loginWithEmail(email: string, password: string) {
  if (!hasEnv) {
    return {
      success: false,
      error: new Error(
        "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      ),
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error }
  }

  return { success: true, data }
}

export async function registerWithEmail(email: string, password: string) {
  if (!hasEnv) {
    return {
      success: false,
      error: new Error(
        "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      ),
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { success: false, error }
  }

  return { success: true, data }
}

// usado pelo debug / guards se ainda existirem
export async function getCurrentUser(): Promise<{
  user: User | null
  error: Error | null
}> {
  if (!hasEnv) {
    return {
      user: null,
      error: new Error("Supabase não configurado."),
    }
  }

  const { data, error } = await supabase.auth.getUser()

  return {
    user: data?.user ?? null,
    error: (error as Error) ?? null,
  }
}

/**
 * ✅ Função que estava faltando
 * Usada em várias páginas (dashboard, billing-analysis, etc)
 * pra checar se há sessão ativa.
 */
export async function checkSessionStatus(): Promise<{
  isAuthenticated: boolean
  session: Session | null
  error: Error | null
}> {
  if (!hasEnv) {
    return {
      isAuthenticated: false,
      session: null,
      error: new Error("Supabase não configurado."),
    }
  }

  const { data, error } = await supabase.auth.getSession()

  return {
    isAuthenticated: !!data?.session,
    session: data?.session ?? null,
    error: (error as Error) ?? null,
  }
}
