import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useExpediente } from '../../hooks/useExpediente'
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
      <div className="flex flex-col gap-4 p-6 animate-pulse">
        <div className="h-4 w-48 bg-bg-muted rounded" />
        <div className="h-7 w-72 bg-bg-muted rounded" />
        <div className="h-4 w-40 bg-bg-muted rounded" />
      </div>
    )
  }

  if (isError || !expediente) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-fg-secondary">No se pudo cargar el expediente.</p>
      </div>
    )
  }

  const nombreDemandante =
    expediente.partes.find(p => p.tipoParticipacion === 'DEMANDANTE')?.nombre ?? expediente.titulo

  const subtitulo = [
    capitalize(expediente.especialidad),
    expediente.despacho,
  ].filter(Boolean).join(' · ')

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-fg-tertiary mb-3">
            <Link to="/expedientes" className="hover:text-fg-secondary transition-colors">
              Expedientes
            </Link>
            <ChevronRight size={12} />
            <span className="text-fg-secondary truncate">{nombreDemandante}</span>
          </nav>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-fg-primary">{nombreDemandante}</h1>
              {subtitulo && (
                <p className="text-sm text-fg-secondary mt-0.5">{subtitulo}</p>
              )}
            </div>
            <EstadoBadge estado={expediente.estado} />
          </div>
        </div>

        {/* Resumen */}
        <div className="flex-1 overflow-auto p-6">
          <ResumenIACard resumen={expediente.resumen} />
        </div>
      </div>

      {/* Sidebar */}
      <InfoSidebar expediente={expediente} />
    </div>
  )
}
