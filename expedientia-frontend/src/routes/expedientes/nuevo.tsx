import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { CaretRightIcon, SparkleIcon } from '@phosphor-icons/react'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeader } from '../../components/layout/PageHeader'
import { DocumentUploadCard } from '../../components/assistant/DocumentUploadCard'

function NuevoExpedientePage() {
  const navigate = useNavigate()

  return (
    <PageContainer variant="reading">
      <nav className="flex items-center gap-1 text-xs text-fg-tertiary mb-4">
        <Link to="/expedientes" className="hover:text-fg-secondary transition-colors">
          Expedientes
        </Link>
        <CaretRightIcon />
        <span className="text-fg-secondary">Nuevo</span>
      </nav>

      <PageHeader
        title="Nuevo expediente"
        subtitle="¿Cómo querés crear el expediente?"
      />

      <div className="mt-6 space-y-3">
        <DocumentUploadCard />

        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-bg-subtle hover:border-border-strong hover:bg-bg-muted transition-colors text-left"
        >
          <div className="shrink-0 w-8 h-8 rounded-lg bg-bg-muted border border-border flex items-center justify-center">
            <SparkleIcon className="text-fg-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg-primary leading-tight">
              Describilo al asistente
            </p>
            <p className="text-xs text-fg-tertiary mt-0.5">
              Contale los datos del caso y la IA lo crea por vos
            </p>
          </div>
        </button>
      </div>
    </PageContainer>
  )
}

export const Route = createFileRoute('/expedientes/nuevo')({
  component: NuevoExpedientePage,
})
