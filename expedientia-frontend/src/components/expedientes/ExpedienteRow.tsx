import { Link } from '@tanstack/react-router'
import type { Expediente } from '../../types'
import { EstadoBadge } from './EstadoBadge'

function demandante(expediente: Expediente): string {
  const parte = expediente.partes.find(p => p.tipoParticipacion === 'DEMANDANTE')
  return parte?.nombre ?? expediente.titulo
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

interface ExpedienteRowProps {
  expediente: Expediente
}

export function ExpedienteRow({ expediente }: ExpedienteRowProps) {
  const nombre = demandante(expediente)

  const metadata = [capitalize(expediente.especialidad), expediente.radicado]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      to="/expedientes/$expedienteId"
      params={{ expedienteId: String(expediente.id) }}
      className="group block -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 hover:bg-bg-subtle transition-colors"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[15px] font-medium text-fg-primary truncate group-hover:text-fg-primary">
          {nombre}
        </h3>
        <span className="text-xs text-fg-tertiary shrink-0 tabular-nums">
          {formatRelative(expediente.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-fg-secondary truncate">{metadata}</p>
        <span className="text-fg-tertiary text-xs">·</span>
        <EstadoBadge estado={expediente.estado} />
      </div>
    </Link>
  )
}
