import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Supabase URL or Service Role Key is not set. Supabase Admin client will not be fully functional.")
}

export const supabaseAdmin = createClient(
  supabaseUrl || "http://localhost:54321", // Fallback for local development if not set
  supabaseServiceRoleKey || "YOUR_SUPABASE_SERVICE_ROLE_KEY", // Fallback for local development if not set
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
