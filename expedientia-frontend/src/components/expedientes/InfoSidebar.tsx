import type { Expediente } from '../../types'

function Campo({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-fg-tertiary">{label}</span>
      <span className="text-sm text-fg-body">{value ?? '—'}</span>
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

interface InfoSidebarProps {
  expediente: Expediente
}

export function InfoSidebar({ expediente }: InfoSidebarProps) {
  const demandante = expediente.partes.find(p => p.tipoParticipacion === 'DEMANDANTE')?.nombre
  const demandado = expediente.partes.find(p => p.tipoParticipacion === 'DEMANDADO')?.nombre
  const apoderado = expediente.partes.find(p => p.tipoParticipacion === 'APODERADO')?.nombre

  const fechaInicio = expediente.fechaInicio
    ? new Date(expediente.fechaInicio).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-bg-base overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-fg-primary mb-4">Información del caso</h3>
        <div className="flex flex-col gap-4">
          <Campo label="Radicado"    value={expediente.radicado} />
          <Campo label="Especialidad" value={capitalize(expediente.especialidad)} />
          <Campo label="Demandante"  value={demandante} />
          <Campo label="Demandado"   value={demandado} />
          <Campo label="Apoderado"   value={apoderado} />
          <Campo label="Fecha inicio" value={fechaInicio} />
          <Campo label="Ciudad"      value={expediente.ciudad} />
          <Campo label="Despacho"    value={expediente.despacho} />
        </div>
      </div>
    </aside>
  )
}
