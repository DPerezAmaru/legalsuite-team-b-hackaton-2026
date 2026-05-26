import { PageContainer } from '../layout/PageContainer'
import { PageHeader } from '../layout/PageHeader'

export function HistorialPage() {
  return (
    <PageContainer>
      <PageHeader title="Historial" subtitle="Consultas y acciones recientes." />
      <div className="flex items-center justify-center py-16 border-t border-border">
        <p className="text-sm text-fg-secondary">Próximamente.</p>
      </div>
    </PageContainer>
  )
}
