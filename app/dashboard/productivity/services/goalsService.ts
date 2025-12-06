import { supabase } from "@/lib/supabaseClient"

export async function getWeeklyGoals(userId: string) {
  const { data, error } = await supabase
    .from("weekly_goals")
    .select("*")
    .eq("user_id", userId)

  if (error) throw error
  return data
}

export async function createWeeklyGoal(userId: string, title: string, dailyChecks: any) {
  const { data, error } = await supabase
    .from("weekly_goals")
    .insert({
      user_id: userId,
      title,
      daily_checks: dailyChecks,
      progress: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWeeklyGoal(id: string, updates: any) {
  const { error } = await supabase.from("weekly_goals").update(updates).eq("id", id)
  if (error) throw error
}

export async function deleteWeeklyGoal(id: string) {
  const { error } = await supabase.from("weekly_goals").delete().eq("id", id)
  if (error) throw error
}
