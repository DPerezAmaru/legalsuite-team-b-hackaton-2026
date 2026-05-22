import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react'
import { ExtraccionField } from './ExtraccionField'
import type {
  DocumentoFormState,
  Parte,
  TipoParticipacion,
  Especialidad,
  EstadoExpediente,
} from '../../types'

const ESPECIALIDADES: readonly Especialidad[] = [
  'CIVIL', 'PENAL', 'LABORAL', 'ADMINISTRATIVO', 'FAMILIA',
]
const ESTADOS: readonly EstadoExpediente[] = ['ACTIVO', 'CERRADO', 'ARCHIVADO']

function getParte(partes: Parte[], tipo: TipoParticipacion): string {
  return partes.find((p) => p.tipoParticipacion === tipo)?.nombre ?? ''
}

function setParte(partes: Parte[], tipo: TipoParticipacion, nombre: string): Parte[] {
  if (!nombre.trim()) return partes.filter((p) => p.tipoParticipacion !== tipo)
  if (partes.some((p) => p.tipoParticipacion === tipo)) {
    return partes.map((p) => (p.tipoParticipacion === tipo ? { ...p, nombre } : p))
  }
  return [...partes, { nombre, tipoParticipacion: tipo }]
}

interface ProcesoCardProps {
  form: DocumentoFormState
  defaultOpen?: boolean
  createdExpedienteId?: number
  isCreating: boolean
  onFormChange: (form: DocumentoFormState) => void
  onCrear: () => void
}

export function ProcesoCard({
  form,
  defaultOpen = false,
  createdExpedienteId,
  isCreating,
  onFormChange,
  onCrear,
}: ProcesoCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  const update = <K extends keyof DocumentoFormState>(key: K, value: DocumentoFormState[K]) =>
    onFormChange({ ...form, [key]: value })

  const updateParte = (tipo: TipoParticipacion, nombre: string) =>
    onFormChange({ ...form, partes: setParte(form.partes, tipo, nombre) })

  const canCreate = form.radicado.trim().length > 0 && form.titulo.trim().length > 0
  const isCreated = createdExpedienteId !== undefined

  return (
    <div className="border border-border rounded-xl bg-bg-base overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3.5 py-3 text-left hover:bg-bg-subtle transition-colors"
      >
        {open
          ? <ChevronDown size={14} className="text-fg-tertiary shrink-0" />
          : <ChevronRight size={14} className="text-fg-tertiary shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-fg-primary">Proceso {form.numero}</span>
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-bg-muted text-fg-secondary">
              {form.especialidad}
            </span>
            {isCreated && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-cta-bg/10 text-cta-bg">
                <CheckCircle2 size={10} /> Creado
              </span>
            )}
          </div>
          <p className="text-xs text-fg-tertiary truncate mt-0.5">
            {form.radicado || 'sin radicado'}
          </p>
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="px-1 py-2 space-y-0.5">
            <ExtraccionField label="Radicado" value={form.radicado} onChange={(v) => update('radicado', v)} />
            <ExtraccionField label="Título" value={form.titulo} onChange={(v) => update('titulo', v)} />
            <ExtraccionField label="Especialidad" value={form.especialidad} onChange={(v) => update('especialidad', v as Especialidad)} options={ESPECIALIDADES} />
            <ExtraccionField label="Estado" value={form.estado} onChange={(v) => update('estado', v as EstadoExpediente)} options={ESTADOS} />
            <ExtraccionField label="Juzgado" value={form.despacho} onChange={(v) => update('despacho', v)} />
            <ExtraccionField label="Ciudad" value={form.ciudad} onChange={(v) => update('ciudad', v)} />
            <ExtraccionField label="Fecha inicio" value={form.fechaInicio ?? ''} onChange={(v) => update('fechaInicio', v || undefined)} />
            <ExtraccionField label="Demandante" value={getParte(form.partes, 'DEMANDANTE')} onChange={(v) => updateParte('DEMANDANTE', v)} />
            <ExtraccionField label="Demandado" value={getParte(form.partes, 'DEMANDADO')} onChange={(v) => updateParte('DEMANDADO', v)} />
            <ExtraccionField label="Apoderado" value={getParte(form.partes, 'APODERADO')} onChange={(v) => updateParte('APODERADO', v)} />
          </div>

          {form.resumen && (
            <div className="px-4 py-3 border-t border-border bg-bg-subtle">
              <p className="text-[10px] uppercase tracking-wide text-fg-tertiary mb-1">Resumen IA</p>
              <p className="text-xs text-fg-body leading-relaxed">{form.resumen}</p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
            {isCreated ? (
              <Link
                to="/expedientes/$expedienteId"
                params={{ expedienteId: String(createdExpedienteId) }}
                className="px-3.5 py-2 text-xs font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors"
              >
                Ver expediente
              </Link>
            ) : (
              <button
                type="button"
                onClick={onCrear}
                disabled={!canCreate || isCreating}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCreating && <Loader2 size={12} className="animate-spin" />}
                {isCreating ? 'Creando...' : 'Crear expediente'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
