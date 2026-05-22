import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeader } from '../../components/layout/PageHeader'

function TareasPage() {
  return (
    <PageContainer>
      <PageHeader title="Tareas" subtitle="Pendientes y vencimientos próximos." />
      <div className="flex items-center justify-center py-16 border-t border-border">
        <p className="text-sm text-fg-secondary">Próximamente.</p>
      </div>
    </PageContainer>
  )
}

export const Route = createFileRoute('/tareas/')({
  component: TareasPage,
})
