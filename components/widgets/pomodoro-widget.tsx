"use client"

import { useState, useEffect, useRef } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useNotification } from "@/components/notification-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PomodoroWidget() {
  const { addNotification } = useNotification()

  // Estado para o timer Pomodoro
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25)
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useLocalStorage<number>("pomodoro-count", 0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Funções para o timer Pomodoro
  const startPomodoro = () => {
    setIsRunning(true)
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setPomodoroSeconds((prevSeconds) => {
        if (prevSeconds === 0) {
          setPomodoroMinutes((prevMinutes) => {
            if (prevMinutes === 0) {
              // Timer acabou
              if (timerRef.current) clearInterval(timerRef.current)
              setIsRunning(false)

              // Alternar entre trabalho e pausa
              if (!isBreak) {
                setPomodoroCount((prev) => prev + 1)
                const isLongBreak = (pomodoroCount + 1) % 4 === 0 // A cada 4 pomodoros, pausa longa
                setPomodoroMinutes(isLongBreak ? 15 : 5)
                setIsBreak(true)

                // Enviar notificação quando o tempo de trabalho acabar
                addNotification({
                  title: "Pomodoro Concluído!",
                  message: isLongBreak
                    ? "Hora de fazer uma pausa longa de 15 minutos!"
                    : "Hora de fazer uma pausa de 5 minutos!",
                  type: "alert",
                })
              } else {
                setPomodoroMinutes(25)
                setIsBreak(false)

                // Enviar notificação quando a pausa acabar
                addNotification({
                  title: "Pausa Concluída!",
                  message: "Hora de voltar ao trabalho por 25 minutos.",
                  type: "alert",
                })
              }

              return 0
            }
            return prevMinutes - 1
          })
          return 59
        }
        return prevSeconds - 1
      })
    }, 1000)
  }

  const pausePomodoro = () => {
    setIsRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const resetPomodoro = () => {
    pausePomodoro()
    setPomodoroMinutes(25)
    setPomodoroSeconds(0)
    setIsBreak(false)
    setPomodoroCount(0) // Resetar a contagem de pomodoros também
  }

  // Limpar o intervalo quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // Função para formatar o tempo do Pomodoro
  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="max-w-md mx-auto shadow-none border-none">
      <CardHeader className="text-center pb-2">
        <CardTitle>{isBreak ? "Pausa" : "Foco"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="text-6xl font-bold tabular-nums">{formatTime(pomodoroMinutes, pomodoroSeconds)}</div>

        <div className="flex gap-4">
          {!isRunning ? (
            <Button onClick={startPomodoro} className="w-28">
              Iniciar
            </Button>
          ) : (
            <Button onClick={pausePomodoro} variant="outline" className="w-28">
              Pausar
            </Button>
          )}
          <Button onClick={resetPomodoro} variant="outline" className="w-28">
            Reiniciar
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Ciclos completados: {pomodoroCount}</p>
          <p className="mt-1">
            {isBreak ? `Pausa de ${pomodoroMinutes} minutos` : "25 minutos de foco, seguidos por 5 minutos de pausa"}
          </p>
          <p className="mt-4 text-xs">A cada 4 ciclos de Pomodoro, você terá uma pausa longa de 15 minutos.</p>
        </div>
      </CardContent>
    </Card>
  )
}
