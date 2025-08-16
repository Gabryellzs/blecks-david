import { createClient } from "@supabase/supabase-js"

// Singleton para garantir que apenas uma instância do cliente seja criada
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Acessar as variáveis de ambiente diretamente aqui
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Função para criar o cliente Supabase
export const createSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance

  console.log("DEBUG: Initializing Supabase client with persistent session.")
  console.log("DEBUG: NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Set" : "Not Set")
  console.log("DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Set" : "Not Set")

  // Verificar se as variáveis de ambiente estão definidas e não vazias
  if (!supabaseUrl || supabaseUrl === "" || !supabaseAnonKey || supabaseAnonKey === "") {
    console.warn("Credenciais do Supabase não encontradas. Usando cliente mock.")

    // Sempre retornar cliente mock quando as variáveis não estão disponíveis
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({
          data: { user: null },
          error: new Error("Cliente mock - configure as variáveis de ambiente"),
        }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: new Error("Cliente mock - configure as variáveis de ambiente"),
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: new Error("Cliente mock - configure as variáveis de ambiente"),
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        updateUser: async () => ({
          data: { user: null },
          error: new Error("Cliente mock - configure as variáveis de ambiente"),
        }),
        resetPasswordForEmail: async () => ({
          data: null,
          error: new Error("Cliente mock - configure as variáveis de ambiente"),
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            limit: () => ({ data: [], error: null }),
          }),
          order: () => ({
            limit: () => ({ data: [], error: null }),
          }),
          limit: () => ({ data: [], error: null }),
        }),
        insert: async () => ({ data: [], error: new Error("Cliente mock - configure as variáveis de ambiente") }),
        update: async () => ({ data: [], error: new Error("Cliente mock - configure as variáveis de ambiente") }),
        delete: async () => ({ data: [], error: new Error("Cliente mock - configure as variáveis de ambiente") }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: new Error("Cliente mock - configure as variáveis de ambiente") }),
          download: async () => ({ data: null, error: new Error("Cliente mock - configure as variáveis de ambiente") }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    } as any
  }

  try {
    // Criar o cliente com configurações de persistência máxima
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // SEMPRE persistir sessão
        autoRefreshToken: true, // SEMPRE renovar token automaticamente
        detectSessionInUrl: true, // Detectar sessão na URL
        storageKey: "supabase_auth_token", // Chave consistente
        // Usar localStorage e sincronizar com cookies
        storage: typeof window !== "undefined" ? {
          getItem: (key: string) => {
            const value = window.localStorage.getItem(key)
            // Sincronizar com cookie se necessário
            if (value && typeof document !== "undefined") {
              document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax`
            }
            return value
          },
          setItem: (key: string, value: string) => {
            window.localStorage.setItem(key, value)
            // Sincronizar com cookie
            if (typeof document !== "undefined") {
              document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax`
            }
          },
          removeItem: (key: string) => {
            window.localStorage.removeItem(key)
            // Remover cookie
            if (typeof document !== "undefined") {
              document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
            }
          }
        } : undefined,
        flowType: "pkce", // Usar PKCE para maior segurança
      },
      global: {
        headers: {
          "x-client-info": "productivity-dashboard",
        },
      },
    })

    console.log("DEBUG: Supabase client created with persistent session enabled.")
    return supabaseInstance
  } catch (error) {
    console.error("Erro ao criar cliente Supabase:", error)
    // Retornar cliente mock em caso de erro
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({}),
    } as any
  }
}

// Exportar o cliente Supabase como singleton
export const supabase = createSupabaseClient()

// Função para verificar o status da sessão SEM redirecionar
export async function checkSessionStatus() {
  console.log("DEBUG: [SESSION] Checking session status...")
  try {
    if (!supabase) {
      console.warn("[SESSION] Cliente Supabase não inicializado")
      return { isAuthenticated: false, session: null, error: new Error("Cliente não inicializado") }
    }

    // Tentar obter a sessão atual
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("[SESSION] Erro ao obter sessão:", error)

      // NUNCA redirecionar automaticamente - apenas retornar o erro
      return { isAuthenticated: false, session: null, error }
    }

    const isAuthenticated = !!data.session
    console.log(`DEBUG: [SESSION] Status: ${isAuthenticated ? "AUTENTICADO" : "NÃO AUTENTICADO"}`)

    if (data.session) {
      console.log(`DEBUG: [SESSION] User ID: ${data.session.user.id}`)
      console.log(`DEBUG: [SESSION] Email: ${data.session.user.email}`)
      console.log(`DEBUG: [SESSION] Expires at: ${new Date(data.session.expires_at * 1000).toLocaleString()}`)
    }

    return {
      isAuthenticated,
      session: data.session,
      error: null,
    }
  } catch (error) {
    console.error("[SESSION] Exceção ao verificar sessão:", error)
    return { isAuthenticated: false, session: null, error }
  }
}

// Função para fazer login
export async function loginWithEmail(email: string, password: string) {
  console.log("DEBUG: [LOGIN] Attempting login...")
  try {
    if (!supabase) {
      return { success: false, error: new Error("Cliente não inicializado") }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[LOGIN] Erro de autenticação:", error)
      return { success: false, error }
    }

    if (!data.session) {
      console.error("[LOGIN] Login sem sessão")
      return { success: false, error: new Error("Não foi possível estabelecer uma sessão") }
    }

    console.log("DEBUG: [LOGIN] Login successful, session established and persisted.")
    return { success: true, session: data.session, user: data.user }
  } catch (error) {
    console.error("[LOGIN] Exceção ao fazer login:", error)
    return { success: false, error }
  }
}

// Função para fazer logout APENAS quando solicitado pelo usuário
export async function logout() {
  console.log("DEBUG: [LOGOUT] User requested logout.")
  try {
    if (!supabase) {
      return { success: true }
    }

    // Fazer logout no servidor
    await supabase.auth.signOut()

    console.log("DEBUG: [LOGOUT] Logout successful.")
    return { success: true }
  } catch (error) {
    console.error("[LOGOUT] Erro ao fazer logout:", error)
    return { success: false, error }
  }
}

// Função para verificar se está usando cliente mock (adicionada para consistência)
export function isUsingMockClient() {
  return !supabaseUrl || !supabaseAnonKey || supabaseUrl === "" || supabaseAnonKey === ""
}
