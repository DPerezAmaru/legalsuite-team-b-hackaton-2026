import { Link } from '@tanstack/react-router'
import type { Expediente } from '../../types'
import { ExpedienteAvatar } from './ExpedienteAvatar'
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
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

interface ExpedienteRowProps {
  expediente: Expediente
}

export function ExpedienteRow({ expediente }: ExpedienteRowProps) {
  const nombre = demandante(expediente)

  return (
    <Link
      to="/expedientes/$expedienteId"
      params={{ expedienteId: String(expediente.id) }}
      className="flex items-center gap-4 px-6 py-4 hover:bg-bg-subtle transition-colors cursor-pointer"
    >
      <ExpedienteAvatar name={nombre} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg-primary truncate">{nombre}</p>
        <p className="text-xs text-fg-tertiary">{expediente.radicado}</p>
      </div>

      <div className="w-28 hidden sm:block">
        <span className="text-sm text-fg-body">{capitalize(expediente.especialidad)}</span>
      </div>

      <div className="w-24">
        <EstadoBadge estado={expediente.estado} />
      </div>

      <div className="w-20 text-right hidden md:block">
        <span className="text-xs text-fg-tertiary">{formatRelative(expediente.createdAt)}</span>
      </div>
    </Link>
  )
}
