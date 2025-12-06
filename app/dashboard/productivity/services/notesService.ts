import { supabase } from "@/lib/supabaseClient"

export async function getNotes(userId: string) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createNote(userId: string, note: any) {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("notes")
    .insert({
      ...note,
      user_id: userId,
      created_at: now,
      updated_at: now,
      favorite: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNote(id: string, updates: any) {
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("notes")
    .update({
      ...updates,
      updated_at: now,
    })
    .eq("id", id)

  if (error) throw error
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id)
  if (error) throw error
}

export async function toggleFavorite(id: string, value: boolean) {
  const { error } = await supabase
    .from("notes")
    .update({ favorite: value })
    .eq("id", id)

  if (error) throw error
}
