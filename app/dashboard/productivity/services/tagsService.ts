import { supabase } from "@/lib/supabaseClient"

export async function getTags(userId: string) {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)

  if (error) throw error
  return data
}

export async function createTag(userId: string, tag: any) {
  const { data, error } = await supabase
    .from("tags")
    .insert({
      ...tag,
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id)
  if (error) throw error
}
