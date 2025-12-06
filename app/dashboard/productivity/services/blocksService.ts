import { supabase } from "@/lib/supabaseClient"

export async function getTimeBlocks(userId: string) {
  const { data, error } = await supabase
    .from("time_blocks")
    .select("*")
    .eq("user_id", userId)
    .order("hour")

  if (error) throw error
  return data
}

export async function createTimeBlock(userId: string, block: any) {
  const { data, error } = await supabase
    .from("time_blocks")
    .insert({
      ...block,
      user_id: userId,
      notified: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTimeBlock(id: string, updates: any) {
  const { error } = await supabase.from("time_blocks").update(updates).eq("id", id)
  if (error) throw error
}

export async function deleteTimeBlock(id: string) {
  const { error } = await supabase.from("time_blocks").delete().eq("id", id)
  if (error) throw error
}
