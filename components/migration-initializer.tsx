"use client"

import { DataMigrationDialog } from "./data-migration-dialog"

export function MigrationInitializer() {
  // Este componente apenas renderiza o diálogo de migração.
  // A lógica de inicialização do serviço de migração está dentro do DataMigrationDialog.
  return <DataMigrationDialog />
}
