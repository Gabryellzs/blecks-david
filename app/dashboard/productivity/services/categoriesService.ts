import { supabase } from "@/lib/supabaseClient"

export async function getCategories(userId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)

  if (error) throw error
  return data
}

export async function createCategory(userId: string, category: any) {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...category,
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) throw error
}
