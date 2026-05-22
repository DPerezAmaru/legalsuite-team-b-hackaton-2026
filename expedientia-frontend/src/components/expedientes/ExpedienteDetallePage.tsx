import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useExpediente } from '../../hooks/useExpediente'
import { PageContainer } from '../layout/PageContainer'
import { PageHeader } from '../layout/PageHeader'
import { EstadoBadge } from './EstadoBadge'
import { ResumenIACard } from './ResumenIACard'
import { InfoSidebar } from './InfoSidebar'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

interface ExpedienteDetallePageProps {
  expedienteId: number
}

export function ExpedienteDetallePage({ expedienteId }: ExpedienteDetallePageProps) {
  const { data: expediente, isLoading, isError } = useExpediente(expedienteId)

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-4 w-48 bg-bg-muted rounded" />
          <div className="h-8 w-72 bg-bg-muted rounded" />
          <div className="h-4 w-40 bg-bg-muted rounded" />
        </div>
      </PageContainer>
    )
  }

  if (isError || !expediente) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-fg-secondary">No se pudo cargar el expediente.</p>
        </div>
      </PageContainer>
    )
  }

  const nombreDemandante =
    expediente.partes.find(p => p.tipoParticipacion === 'DEMANDANTE')?.nombre ??
    expediente.titulo

  const subtitulo = [capitalize(expediente.especialidad), expediente.despacho]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 overflow-auto">
        <PageContainer>
          <nav className="flex items-center gap-1 text-xs text-fg-tertiary mb-4">
            <Link to="/expedientes" className="hover:text-fg-secondary transition-colors">
              Expedientes
            </Link>
            <ChevronRight size={12} />
            <span className="text-fg-secondary truncate">{nombreDemandante}</span>
          </nav>

          <PageHeader
            title={nombreDemandante}
            subtitle={subtitulo || undefined}
            meta={<EstadoBadge estado={expediente.estado} />}
          />

          <ResumenIACard resumen={expediente.resumen} />
        </PageContainer>
      </div>

      <InfoSidebar expediente={expediente} />
    </div>
  )
}
