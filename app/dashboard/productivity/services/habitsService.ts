import { supabase } from "@/lib/supabaseClient"

export async function getHabits(userId: string) {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)

  if (error) throw error
  return data
}

export async function createHabit(userId: string, title: string) {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: userId,
      title,
      completed: false,
      streak: 0,
      last_completed: null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateHabit(id: string, updates: any) {
  const { error } = await supabase.from("habits").update(updates).eq("id", id)
  if (error) throw error
}

export async function deleteHabit(id: string) {
  const { error } = await supabase.from("habits").delete().eq("id", id)
  if (error) throw error
}
