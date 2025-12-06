"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useHabits() {
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
        .from("habits")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Erro ao carregar hábitos:", error)
      } else if (data) {
        setList(data)
      }

      setLoaded(true)
    }

    load()
  }, [])

  async function addHabit(title: string) {
    if (!userId || !title.trim()) return

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: userId,
        title,
        completed: false,
        streak: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao adicionar hábito:", error)
      return
    }

    setList((prev) => [...prev, data])
  }

  async function toggleHabit(id: string) {
    if (!userId) return
    const habit = list.find((h: any) => h.id === id)
    if (!habit) return

    const today = new Date().toISOString().split("T")[0]
    const completed = !habit.completed
    const streak = completed ? habit.streak + 1 : Math.max(0, habit.streak - 1)

    const { error } = await supabase
      .from("habits")
      .update({ completed, streak, last_completed: today })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao atualizar hábito:", error)
      return
    }

    setList((prev) =>
      prev.map((h: any) =>
        h.id === id ? { ...h, completed, streak, last_completed: today } : h,
      ),
    )
  }

  async function deleteHabit(id: string) {
    if (!userId) return

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao deletar hábito:", error)
      return
    }

    setList((prev) => prev.filter((h: any) => h.id !== id))
  }

  return { loaded, list, addHabit, toggleHabit, deleteHabit }
}
