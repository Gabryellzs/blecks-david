"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useTags() {
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
        .from("tags")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Erro ao carregar tags:", error)
      } else if (data) {
        setList(data)
      }

      setLoaded(true)
    }

    load()
  }, [])

  async function addTag(name: string, color: string) {
    if (!userId || !name.trim()) return

    const { data, error } = await supabase
      .from("tags")
      .insert({
        user_id: userId,
        name,
        color,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao adicionar tag:", error)
      return
    }

    setList((prev) => [...prev, data])
  }

  async function deleteTag(id: string) {
    if (!userId) return

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao deletar tag:", error)
      return
    }

    setList((prev) => prev.filter((t: any) => t.id !== id))
  }

  return { loaded, list, addTag, deleteTag }
}
