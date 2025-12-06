"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useCategories() {
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
        .from("categories")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Erro ao carregar categorias:", error)
      } else if (data) {
        setList(data)
      }

      setLoaded(true)
    }

    load()
  }, [])

  async function addCategory(name: string, color: string) {
    if (!userId || !name.trim()) return

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name,
        color,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao adicionar categoria:", error)
      return
    }

    setList((prev) => [...prev, data])
  }

  async function deleteCategory(id: string) {
    if (!userId) return

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao deletar categoria:", error)
      return
    }

    setList((prev) => prev.filter((c: any) => c.id !== id))
  }

  return { loaded, list, addCategory, deleteCategory }
}
