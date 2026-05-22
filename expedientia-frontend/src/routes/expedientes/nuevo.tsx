import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeader } from '../../components/layout/PageHeader'

function NuevoExpedientePage() {
  return (
    <PageContainer>
      <nav className="flex items-center gap-1 text-xs text-fg-tertiary mb-4">
        <Link to="/expedientes" className="hover:text-fg-secondary transition-colors">
          Expedientes
        </Link>
        <ChevronRight size={12} />
        <span className="text-fg-secondary">Nuevo</span>
      </nav>

      <PageHeader
        title="Nuevo expediente"
        subtitle="Cargá la información inicial del caso."
      />

      <div className="flex items-center justify-center py-16 border-t border-border">
        <p className="text-sm text-fg-secondary">Formulario próximamente.</p>
      </div>
    </PageContainer>
  )
}

export const Route = createFileRoute('/expedientes/nuevo')({
  component: NuevoExpedientePage,
})
