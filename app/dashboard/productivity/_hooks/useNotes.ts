"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useNotes() {
  const [list, setList] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        setLoaded(true)
        return
      }

      const uid = userData.user.id
      setUserId(uid)

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Erro ao carregar notas:", error)
      } else if (data) {
        setList(data)
      }

      setLoaded(true)
    }

    load()
  }, [])

  async function addNote(
    title: string,
    content: string,
    category: string,
    tags: string[],
  ) {
    if (!userId || !title.trim() || !content.trim()) return

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        title,
        content,
        category,
        tags,
        created_at: now,
        updated_at: now,
        favorite: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao adicionar nota:", error)
      return
    }

    setList((prev) => [data, ...prev])
  }

  async function updateNote(note: any) {
    if (!userId) return
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("notes")
      .update({
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        updated_at: now,
      })
      .eq("id", note.id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao atualizar nota:", error)
      return
    }

    setList((prev) =>
      prev.map((n: any) =>
        n.id === note.id ? { ...note, updated_at: now } : n,
      ),
    )
  }

  async function deleteNote(id: string) {
    if (!userId) return

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao deletar nota:", error)
      return
    }

    setList((prev) => prev.filter((n: any) => n.id !== id))
  }

  async function toggleFavorite(id: string) {
    if (!userId) return
    const note = list.find((n: any) => n.id === id)
    if (!note) return

    const favorite = !note.favorite

    const { error } = await supabase
      .from("notes")
      .update({ favorite })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao favoritar nota:", error)
      return
    }

    setList((prev) =>
      prev.map((n: any) => (n.id === id ? { ...n, favorite } : n)),
    )
  }

  return { loaded, list, addNote, updateNote, deleteNote, toggleFavorite }
}
