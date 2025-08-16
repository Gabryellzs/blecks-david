import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão disponíveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("DEBUG: Supabase URL:", supabaseUrl ? "Configurada" : "NÃO CONFIGURADA")
console.log("DEBUG: Supabase Anon Key:", supabaseAnonKey ? "Configurada" : "NÃO CONFIGURADA")

let supabaseInstance: ReturnType<typeof createClient> | any

// Função para criar cliente mock quando as variáveis não estão disponíveis
const createMockClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({
      data: { user: null },
      error: new Error("Cliente mock - variáveis de ambiente não configuradas"),
    }),
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: new Error("Cliente mock - variáveis de ambiente não configuradas"),
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: new Error("Cliente mock - variáveis de ambiente não configuradas"),
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    updateUser: async () => ({
      data: { user: null },
      error: new Error("Cliente mock - variáveis de ambiente não configuradas"),
    }),
    resetPasswordForEmail: async () => ({
      data: null,
      error: new Error("Cliente mock - variáveis de ambiente não configuradas"),
    }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: new Error("Cliente mock - variáveis de ambiente não configuradas") }),
        limit: () => ({ data: [], error: null }),
      }),
      order: () => ({
        limit: () => ({ data: [], error: null }),
      }),
      limit: () => ({ data: [], error: null }),
    }),
    insert: async () => ({ data: [], error: new Error("Cliente mock - variáveis de ambiente não configuradas") }),
    update: async () => ({ data: [], error: new Error("Cliente mock - variáveis de ambiente não configuradas") }),
    delete: async () => ({ data: [], error: new Error("Cliente mock - variáveis de ambiente não configuradas") }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: new Error("Cliente mock - variáveis de ambiente não configuradas") }),
      download: async () => ({ data: null, error: new Error("Cliente mock - variáveis de ambiente não configuradas") }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
})

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "" || supabaseAnonKey === "") {
  console.warn("Variáveis de ambiente do Supabase não configuradas. Usando cliente mock para preview.")
  supabaseInstance = createMockClient()
} else {
  try {
    // Criar cliente Supabase com configurações adequadas
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "supabase_auth_token_client",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
      global: {
        headers: {
          "x-client-info": "productivity-dashboard@1.0.0",
        },
      },
    })
    console.log("DEBUG: Cliente Supabase real criado com sucesso")
  } catch (error) {
    console.error("Erro ao criar cliente Supabase:", error)
    supabaseInstance = createMockClient()
  }
}

export const supabase = supabaseInstance

// Função para verificar a conexão
export async function testSupabaseConnection() {
  try {
    // Verificar se o cliente não é o mock antes de tentar a conexão real
    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "" && supabaseAnonKey !== "") {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Erro na conexão Supabase:", error)
        return false
      }
      console.log("DEBUG: Conexão Supabase OK")
      return true
    } else {
      console.warn("DEBUG: Usando cliente mock - conexão não testada")
      return false
    }
  } catch (error) {
    console.error("Erro ao testar conexão Supabase:", error)
    return false
  }
}

// Função para verificar se está usando cliente mock
export function isUsingMockClient() {
  return !supabaseUrl || !supabaseAnonKey || supabaseUrl === "" || supabaseAnonKey === ""
}

// Testar conexão na inicialização apenas no browser
if (typeof window !== "undefined") {
  testSupabaseConnection()
}
