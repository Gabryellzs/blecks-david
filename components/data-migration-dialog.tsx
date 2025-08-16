"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { eventService, EVENTS } from "@/lib/event-service"
import { getMigrationService, type MigrationStatus } from "@/lib/migration-service" // Importar a função para obter a instância
import { supabase } from "@/lib/supabaseClient" // Certifique-se de que este é o import correto

export function DataMigrationDialog() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<MigrationStatus>({
    inProgress: false,
    step: "",
    progress: 0,
    error: null,
    completed: false,
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [migrationService, setMigrationService] = useState<any>(null)

  // Use useCallback para handleStartMigration para evitar re-renders desnecessários
  const handleStartMigration = useCallback(async () => {
    console.log("DataMigrationDialog: handleStartMigration called. Current userId:", userId)
    if (!userId) {
      console.error("DataMigrationDialog: Attempted to start migration without authenticated user.")
      setStatus((prev) => ({
        ...prev,
        error: "Usuário não autenticado para migração. Por favor, faça login novamente.",
      }))
      return
    }
    if (migrationService) {
      // Limpar qualquer erro anterior antes de iniciar a migração
      setStatus((prev) => ({ ...prev, error: null, inProgress: true }))
      await migrationService.startMigration(userId)
    } else {
      console.error("DataMigrationDialog: migrationService is not initialized.")
      setStatus((prev) => ({ ...prev, error: "Serviço de migração não inicializado." }))
    }
  }, [userId, migrationService]) // Dependências para useCallback

  useEffect(() => {
    if (typeof window === "undefined") return

    const service = getMigrationService()
    setMigrationService(service)

    const checkAndOpenDialog = async () => {
      console.log("DataMigrationDialog: checkAndOpenDialog called.")
      // Começar com o diálogo fechado e status resetado
      setOpen(false)
      setStatus({ inProgress: false, step: "", progress: 0, error: null, completed: false })

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.warn(
          "DataMigrationDialog: No active user session found (expected if not logged in).",
          userError.message,
        )
        setUserId(null)
        // Não definir um erro no status para o estado não autenticado, apenas manter o diálogo fechado
        return
      }

      const currentUserId = userData?.user?.id || null
      setUserId(currentUserId)
      console.log("DataMigrationDialog: Fetched currentUserId:", currentUserId)

      if (!currentUserId) {
        console.log("DataMigrationDialog: No user authenticated, dialog will remain closed.")
        return
      }

      const currentStatus = service.getStatus()
      console.log("DataMigrationDialog: Current migration service status:", currentStatus)

      if (currentStatus.completed) {
        console.log("DataMigrationDialog: Migration already completed, dialog will remain closed.")
        return
      }

      const hasData = await service.hasDataToMigrate()
      console.log("DataMigrationDialog: Has data to migrate:", hasData)

      if (hasData) {
        setOpen(true)
        // Se estiver abrindo, garantir que o status esteja limpo ou reflita o estado inicial
        setStatus((prev) => ({ ...prev, error: null }))
      } else {
        console.log("DataMigrationDialog: No data to migrate, dialog will remain closed.")
      }
    }

    checkAndOpenDialog()

    const unsubscribe = eventService.subscribe(EVENTS.MIGRATION_STATUS_CHANGED, (data) => {
      console.log("DataMigrationDialog: Migration status changed:", data.status)
      setStatus(data.status)
      if (data.status.completed) {
        setTimeout(() => {
          setOpen(false)
        }, 2000)
      }
    })

    return () => {
      unsubscribe()
    }
  }, []) // Array de dependência vazio significa que ele é executado apenas uma vez na montagem

  // Não renderiza nada no servidor se o serviço ainda não foi inicializado
  if (!migrationService && typeof window === "undefined") {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Migração de Dados</DialogTitle>
          <DialogDescription>
            Detectamos dados salvos no seu navegador. Vamos migrar esses dados para um sistema mais confiável.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {status.inProgress ? (
            <>
              <div className="text-sm text-gray-500">{status.step}</div>
              <Progress value={status.progress} className="h-2" />
            </>
          ) : status.error ? (
            <div className="text-sm text-red-500">Ocorreu um erro durante a migração: {status.error}</div>
          ) : status.completed ? (
            <div className="text-sm text-green-500">Migração concluída com sucesso!</div>
          ) : (
            <div className="text-sm text-gray-500">
              A migração irá transferir seus dados para um sistema mais seguro e confiável. Isso não afetará seus dados
              existentes.
            </div>
          )}
        </div>
        <div className="flex justify-end">
          {!status.inProgress && !status.completed && (
            <Button onClick={handleStartMigration} disabled={status.inProgress || !userId}>
              Iniciar Migração
            </Button>
          )}
          {status.completed && <Button onClick={() => setOpen(false)}>Fechar</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
