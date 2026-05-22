import type { MouseEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import type { Expediente, Parte, TipoParticipacion } from '../../types'
import { EstadoBadge } from './EstadoBadge'

function findParte(partes: Parte[], tipo: TipoParticipacion): string {
  return partes.find(p => p.tipoParticipacion === tipo)?.nombre ?? '—'
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${Math.max(minutes, 1)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

interface ExpedienteRowProps {
  expediente: Expediente
}

export function ExpedienteRow({ expediente }: ExpedienteRowProps) {
  const navigate = useNavigate()
  const demandante = findParte(expediente.partes, 'DEMANDANTE')
  const demandado = findParte(expediente.partes, 'DEMANDADO')

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Dejar que el browser maneje cmd/ctrl/shift/middle click → abre standalone
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
    e.preventDefault()
    navigate({ to: '/expedientes', search: { caso: expediente.id } })
  }

  return (
    <Link
      to="/expedientes/$expedienteId"
      params={{ expedienteId: String(expediente.id) }}
      onClick={handleClick}
      className="flex items-center gap-4 px-3 py-3 text-sm hover:bg-bg-subtle transition-colors"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <FileText size={15} className="shrink-0 text-fg-tertiary" />
        <div className="min-w-0">
          <p className="font-medium text-fg-primary truncate tabular-nums">
            {expediente.radicado}
          </p>
          <p className="text-xs text-fg-tertiary truncate">{expediente.titulo}</p>
        </div>
      </div>

      <div className="hidden md:block w-44 text-fg-body truncate">{demandante}</div>

      <div className="hidden md:block w-44 text-fg-body truncate">{demandado}</div>

      <div className="hidden sm:block w-24 text-fg-body">
        {capitalize(expediente.especialidad)}
      </div>

      <div className="hidden lg:block w-44 text-xs text-fg-tertiary truncate">
        {expediente.despacho ?? '—'}
      </div>

      <div className="w-28">
        <EstadoBadge estado={expediente.estado} />
      </div>

      <div className="w-16 text-right text-xs text-fg-tertiary tabular-nums">
        {formatRelative(expediente.createdAt)}
      </div>
    </Link>
  )
}
