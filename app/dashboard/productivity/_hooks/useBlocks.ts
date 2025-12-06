"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useBlocks() {
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
        .from("time_blocks")
        .select("*")
        .eq("user_id", uid)
        .order("hour", { ascending: true })

      if (error) {
        console.error("Erro ao carregar blocos:", error)
      } else if (data) {
        setList(data)
      }

      setLoaded(true)
    }

    load()
  }, [])

  async function addBlock(
    hour: string,
    title: string,
    description: string,
    tags: string[],
  ) {
    if (!userId || !title.trim()) return

    const { data, error } = await supabase
      .from("time_blocks")
      .insert({
        user_id: userId,
        hour,
        title,
        description,
        tags,
        notified: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao adicionar bloco:", error)
      return
    }

    setList((prev) => [...prev, data])
  }

  async function deleteBlock(id: string) {
    if (!userId) return

    const { error } = await supabase
      .from("time_blocks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao deletar bloco:", error)
      return
    }

    setList((prev) => prev.filter((b: any) => b.id !== id))
  }

  return { loaded, list, addBlock, deleteBlock }
}
