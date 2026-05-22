import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeader } from '../../components/layout/PageHeader'

function HistorialPage() {
  return (
    <PageContainer>
      <PageHeader title="Historial" subtitle="Consultas y acciones recientes." />
      <div className="flex items-center justify-center py-16 border-t border-border">
        <p className="text-sm text-fg-secondary">Próximamente.</p>
      </div>
    </PageContainer>
  )
}

export const Route = createFileRoute('/historial/')({
  component: HistorialPage,
})
