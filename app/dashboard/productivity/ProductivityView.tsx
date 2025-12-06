"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Hooks do Supabase
import { useGoals } from "./_hooks/useGoals"
import { useHabits } from "./_hooks/useHabits"
import { useBlocks } from "./_hooks/useBlocks"
import { useNotes } from "./_hooks/useNotes"
import { useTags } from "./_hooks/useTags"
import { useCategories } from "./_hooks/useCategories"

// Abas (componentes de UI)
import GoalsTab from "./tabs/GoalsTab"
import HabitsTab from "./tabs/HabitsTab"
import NotesTab from "./tabs/NotesTab"
import BlocksSidebar from "./tabs/BlocksSidebar"

const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

export default function ProductivityView() {
  // ----- Relógio -----
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const formatCurrentTime = () =>
    currentTime.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    })

  const getCurrentDay = () => {
    const today = new Date().getDay()
    return diasDaSemana[today === 0 ? 6 : today - 1]
  }
  const currentDay = getCurrentDay()

  // ----- Hooks (dados vindo do Supabase, por usuário) -----
  const goals = useGoals()
  const habits = useHabits()
  const blocks = useBlocks()
  const notes = useNotes()
  const tags = useTags()
  const categories = useCategories()

  const loadingAny =
    !goals.loaded ||
    !habits.loaded ||
    !blocks.loaded ||
    !notes.loaded ||
    !tags.loaded ||
    !categories.loaded

  if (loadingAny) {
    return (
      <div className="flex items-center justify-center w-full h-[60vh]">
        <span className="text-muted-foreground">Carregando suas informações...</span>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Organização / Produtividade</h1>
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{formatCurrentTime()} (Brasília)</span>
        </div>
      </div>

      {/* Layout com abas + coluna lateral de blocos */}
      <Tabs defaultValue="goals" className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Coluna principal */}
          <div className="flex-1">
            <TabsList className="flex flex-wrap w-full overflow-x-auto gap-1 p-1 justify-between">
              <TabsTrigger className="flex-1 min-w-[80px] text-xs sm:text-sm whitespace-nowrap" value="goals">
                Metas
              </TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[80px] text-xs sm:text-sm whitespace-nowrap" value="habits">
                Hábitos
              </TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[80px] text-xs sm:text-sm whitespace-nowrap" value="notes">
                Notas
              </TabsTrigger>
            </TabsList>

            {/* Metas da semana */}
            <TabsContent value="goals" className="mt-4">
              <GoalsTab
                diasDaSemana={diasDaSemana}
                currentDay={currentDay}
                goals={goals.list}
                addGoal={goals.addGoal}
                toggleDay={goals.toggleDay}
                deleteGoal={goals.deleteGoal}
              />
            </TabsContent>

            {/* Hábitos */}
            <TabsContent value="habits" className="mt-4">
              <HabitsTab
                habits={habits.list}
                addHabit={habits.addHabit}
                toggleHabit={habits.toggleHabit}
                deleteHabit={habits.deleteHabit}
              />
            </TabsContent>

            {/* Anotações */}
            <TabsContent value="notes" className="mt-4">
              <NotesTab
                notes={notes.list}
                addNote={notes.addNote}
                updateNote={notes.updateNote}
                deleteNote={notes.deleteNote}
                toggleFavorite={notes.toggleFavorite}
                tags={tags.list}
                categories={categories.list}
              />
            </TabsContent>
          </div>

          {/* Coluna lateral de blocos de tempo */}
          <div className="w-full md:w-[360px] shrink-0">
            <BlocksSidebar
              blocks={blocks.list}
              addBlock={blocks.addBlock}
              deleteBlock={blocks.deleteBlock}
              tags={tags.list}
              addTag={tags.addTag}
              deleteTag={tags.deleteTag}
            />
          </div>
        </div>
      </Tabs>
    </div>
  )
}
