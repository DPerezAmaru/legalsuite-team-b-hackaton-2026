import { useState, forwardRef } from 'react'
import { Link } from '@tanstack/react-router'
import { CaretDown, CaretRight, CheckCircle, Check } from '@phosphor-icons/react'
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
  archivoOrigen?: string
  isActiveFile?: boolean
  isSelected?: boolean
  defaultOpen?: boolean
  createdExpedienteId?: number
  onFormChange: (form: DocumentoFormState) => void
  onSelectFile?: () => void
  onToggleSelect?: () => void
}

export const ProcesoCard = forwardRef<HTMLDivElement, ProcesoCardProps>(function ProcesoCard({
  numero,
  form,
  archivoOrigen,
  isActiveFile = false,
  isSelected = true,
  defaultOpen = false,
  createdExpedienteId,
  onFormChange,
  onSelectFile,
  onToggleSelect,
}, ref) {
  const [open, setOpen] = useState(defaultOpen)
  const [resuelveExpanded, setResuelveExpanded] = useState(false)
  const RESUELVE_LIMIT = 300

  const update = <K extends keyof DocumentoFormState>(key: K, value: DocumentoFormState[K]) =>
    onFormChange({ ...form, [key]: value })

  const updatePartes = (partes: Parte[]) => onFormChange({ ...form, partes })

  const isCreated = createdExpedienteId !== undefined

  return (
    <div
      ref={ref}
      className={`border rounded-xl bg-bg-base overflow-hidden transition-colors ${isActiveFile ? 'border-fg-secondary' : 'border-border'}`}
    >
      <div className="flex items-stretch">
        {onToggleSelect && (
          <div className="flex items-center pl-3.5 pr-1 shrink-0">
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={onToggleSelect}
              disabled={isCreated}
              className={[
                'w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isSelected
                  ? 'bg-cta-bg border-cta-bg'
                  : 'bg-bg-base border-border hover:border-border-strong',
              ].join(' ')}
            >
              {isSelected && <Check size={10} weight="bold" className="text-cta-text" />}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); onSelectFile?.() }}
          className="flex-1 flex items-center gap-2 px-3.5 py-3 text-left hover:bg-bg-subtle transition-colors min-w-0"
        >
          {open
            ? <CaretDown className="text-fg-tertiary shrink-0" />
            : <CaretRight className="text-fg-tertiary shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
            {archivoOrigen && (
              <p className="text-[10px] text-fg-tertiary truncate mt-0.5">{archivoOrigen}</p>
            )}
          </div>
        </button>
      </div>

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

          {form.resuelve && (
            <div className="px-4 py-3 border-t border-border bg-bg-subtle">
              <p className="text-[10px] uppercase tracking-wide text-fg-tertiary mb-1">Resuelve</p>
              <p className="text-xs text-fg-body leading-relaxed whitespace-pre-line">
                {resuelveExpanded || form.resuelve.length <= RESUELVE_LIMIT
                  ? form.resuelve
                  : `${form.resuelve.slice(0, RESUELVE_LIMIT).trimEnd()}…`}
              </p>
              {form.resuelve.length > RESUELVE_LIMIT && (
                <button
                  type="button"
                  onClick={() => setResuelveExpanded(e => !e)}
                  className="mt-1.5 text-[10px] text-fg-secondary hover:text-fg-primary transition-colors"
                >
                  {resuelveExpanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>
          )}

          {isCreated && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-end">
              <Link
                to="/expedientes/$expedienteId"
                params={{ expedienteId: String(createdExpedienteId) }}
                className="px-3.5 py-2 text-xs font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors"
              >
                Ver expediente
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
