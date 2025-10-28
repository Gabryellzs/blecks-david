import { supabase } from "@/lib/supabase"

export async function savePlatformToken({
  userId,
  platform,
  accountId,
  accessToken,
  refreshToken,
  expiresAt,
  scope,
  meta
}: {
  userId: string
  platform: string
  accountId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: string | Date | null
  scope?: string[]
  meta?: any
}) {
  const { error } = await supabase.from("platform_tokens").upsert(
    [{
      user_id: userId,
      platform,
      account_id: accountId,
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
      expires_at: expiresAt ? new Date(expiresAt as any).toISOString() : null,
      scope: scope ?? [],
      meta: meta ?? {}
    }],
    { onConflict: "user_id,platform,account_id" }
  )

  if (error) {
    console.error("[SUPABASE] Erro ao salvar token:", error)
    throw error
  } else {
    console.log("[SUPABASE] Token salvo:", platform, accountId)
  }
}
