import type { ReactNode } from 'react'
import type { Expediente } from '../../types'
import { EstadoBadge } from './EstadoBadge'
import { ResumenIACard } from './ResumenIACard'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function formatFecha(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface ExpedienteContentProps {
  expediente: Expediente
  headerExtras?: ReactNode
}

export function ExpedienteContent({ expediente, headerExtras }: ExpedienteContentProps) {
  const demandante =
    expediente.partes.find(p => p.tipoParticipacion === 'DEMANDANTE')?.nombre ?? null
  const demandado =
    expediente.partes.find(p => p.tipoParticipacion === 'DEMANDADO')?.nombre ?? null
  const apoderado =
    expediente.partes.find(p => p.tipoParticipacion === 'APODERADO')?.nombre ?? null

  const subtitulo = [capitalize(expediente.especialidad), expediente.despacho]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-fg-primary tracking-tight truncate">
            {demandante ?? expediente.titulo}
          </h1>
          {subtitulo && (
            <p className="mt-1 text-sm text-fg-secondary">{subtitulo}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <EstadoBadge estado={expediente.estado} />
          {headerExtras}
        </div>
      </header>

      <ResumenIACard resumen={expediente.resumen} />

      <section>
        <h2 className="text-sm font-semibold text-fg-primary mb-3">
          Información del caso
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Radicado" value={expediente.radicado} mono />
          <Field label="Especialidad" value={capitalize(expediente.especialidad)} />
          <Field label="Demandante" value={demandante} />
          <Field label="Demandado" value={demandado} />
          <Field label="Apoderado" value={apoderado} />
          <Field label="Fecha de inicio" value={formatFecha(expediente.fechaInicio)} />
          <Field label="Ciudad" value={expediente.ciudad} />
          <Field label="Despacho" value={expediente.despacho} />
        </dl>
      </section>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string | null | undefined
  mono?: boolean
}

function Field({ label, value, mono = false }: FieldProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fg-tertiary">{label}</dt>
      <dd
        className={`text-sm text-fg-body mt-0.5 truncate ${mono ? 'tabular-nums' : ''}`.trim()}
      >
        {value ?? '—'}
      </dd>
    </div>
  )
}
