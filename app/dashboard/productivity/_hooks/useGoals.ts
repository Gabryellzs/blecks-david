"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useGoals() {
  const [list, setList] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Carrega user + metas
  useEffect(() => {
    async function load() {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        console.warn("Sem usuário logado ou erro ao pegar usuário:", userError)
        setLoaded(true)
        return
      }

      const uid = userData.user.id
      setUserId(uid)

      const { data, error } = await supabase
        .from("weekly_goals")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Erro ao carregar metas:", error)
      } else if (data) {
        setList(data)
      }

      setLoaded(true)
    }

    load()
  }, [])

  async function addGoal(title: string) {
    if (!userId || !title.trim()) return

    const dailyChecks = {
      Segunda: false,
      Terça: false,
      Quarta: false,
      Quinta: false,
      Sexta: false,
      Sábado: false,
      Domingo: false,
    }

    const { data, error } = await supabase
      .from("weekly_goals")
      .insert({
        user_id: userId,
        title,
        progress: 0,
        daily_checks: dailyChecks,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao adicionar meta:", error)
      return
    }

    setList((prev) => [...prev, data])
  }

  async function toggleDay(id: string, day: string, value: boolean) {
    if (!userId) return
    const goal = list.find((g: any) => g.id === id)
    if (!goal) return

    const updatedChecks = { ...(goal.daily_checks || {}), [day]: value }
    const total = Object.values(updatedChecks).filter(Boolean).length
    const progress = Math.round((total / 7) * 100)

    const { error } = await supabase
      .from("weekly_goals")
      .update({ daily_checks: updatedChecks, progress })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao atualizar meta:", error)
      return
    }

    setList((prev) =>
      prev.map((g: any) =>
        g.id === id ? { ...g, daily_checks: updatedChecks, progress } : g,
      ),
    )
  }

  async function deleteGoal(id: string) {
    if (!userId) return

    const { error } = await supabase
      .from("weekly_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro ao deletar meta:", error)
      return
    }

    setList((prev) => prev.filter((g: any) => g.id !== id))
  }

  return { loaded, list, addGoal, toggleDay, deleteGoal }
}
