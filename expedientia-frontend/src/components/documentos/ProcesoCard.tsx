import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CaretDown, CaretRight, CircleNotch, CheckCircle } from '@phosphor-icons/react'
import { ExtraccionField } from './ExtraccionField'
import { PartesEditor } from './PartesEditor'
import type {
  DocumentoFormState,
  Parte,
  Especialidad,
  EstadoExpediente,
} from '../../types'

const ESPECIALIDADES: readonly Especialidad[] = [
  'CIVIL', 'PENAL', 'LABORAL', 'ADMINISTRATIVO', 'FAMILIA',
]
const ESTADOS: readonly EstadoExpediente[] = ['ACTIVO', 'CERRADO', 'ARCHIVADO']

interface ProcesoCardProps {
  numero: number
  form: DocumentoFormState
  defaultOpen?: boolean
  createdExpedienteId?: number
  isCreating: boolean
  onFormChange: (form: DocumentoFormState) => void
  onCrear: () => void
}

export function ProcesoCard({
  numero,
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

  const updatePartes = (partes: Parte[]) => onFormChange({ ...form, partes })

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
          ? <CaretDown className="text-fg-tertiary shrink-0" />
          : <CaretRight className="text-fg-tertiary shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-fg-primary">Proceso {numero}</span>
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-bg-muted text-fg-secondary">
              {form.especialidad}
            </span>
            {isCreated && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-cta-bg/10 text-cta-bg">
                <CheckCircle /> Creado
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
          </div>

          <PartesEditor partes={form.partes} onChange={updatePartes} />

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
                {isCreating && <CircleNotch className="animate-spin" />}
                {isCreating ? 'Creando...' : 'Crear expediente'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
