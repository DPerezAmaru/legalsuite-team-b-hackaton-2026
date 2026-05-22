import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeader } from '../../components/layout/PageHeader'

function InformesPage() {
  return (
    <PageContainer>
      <PageHeader title="Informes" subtitle="Reportes generados y plantillas." />
      <div className="flex items-center justify-center py-16 border-t border-border">
        <p className="text-sm text-fg-secondary">Próximamente.</p>
      </div>
    </PageContainer>
  )
}

export const Route = createFileRoute('/informes/')({
  component: InformesPage,
})
