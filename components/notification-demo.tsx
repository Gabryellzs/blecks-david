"use client"

import { useState } from "react"
import { Bell, Info, AlertTriangle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useNotification } from "@/components/notification-provider"

export function NotificationDemo() {
  const { addNotification, scheduleNotification } = useNotification()

  const [title, setTitle] = useState("Notificação de Teste")
  const [message, setMessage] = useState("Esta é uma notificação de teste.")
  const [type, setType] = useState<"info" | "warning" | "alert" | "success">("info")
  const [category, setCategory] = useState("system")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")

  const handleSendNotification = () => {
    addNotification({
      title,
      message,
      type,
      category,
      actions: [
        {
          label: "Ver detalhes",
          onClick: () => {
            console.log("Ação de ver detalhes clicada")
          },
        },
      ],
    })
  }

  const handleScheduleNotification = () => {
    if (!scheduleDate || !scheduleTime) return

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`)

    scheduleNotification(
      {
        title: `${title} (Agendada)`,
        message,
        type,
        category,
      },
      scheduledDateTime,
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demonstração de Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notification-title">Título</Label>
          <Input id="notification-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notification-message">Mensagem</Label>
          <Textarea id="notification-message" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <RadioGroup
            value={type}
            onValueChange={(value) => setType(value as "info" | "warning" | "alert" | "success")}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="info" id="info" />
              <Label htmlFor="info" className="flex items-center">
                <Info className="h-4 w-4 mr-1 text-blue-500" />
                Informação
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="warning" id="warning" />
              <Label htmlFor="warning" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                Aviso
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alert" id="alert" />
              <Label htmlFor="alert" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                Alerta
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="success" id="success" />
              <Label htmlFor="success" className="flex items-center">
                <Check className="h-4 w-4 mr-1 text-green-500" />
                Sucesso
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notification-category">Categoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="notification-category">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="task">Tarefa</SelectItem>
              <SelectItem value="reminder">Lembrete</SelectItem>
              <SelectItem value="calendar">Calendário</SelectItem>
              <SelectItem value="message">Mensagem</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSendNotification}>
            <Bell className="h-4 w-4 mr-2" />
            Enviar Notificação
          </Button>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-2">Agendar Notificação</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Data</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Hora</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleScheduleNotification}>
              <Bell className="h-4 w-4 mr-2" />
              Agendar Notificação
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
