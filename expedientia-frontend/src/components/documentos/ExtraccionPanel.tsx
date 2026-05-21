import { Info, Loader2 } from 'lucide-react'
import { ExtraccionField } from './ExtraccionField'
import type { DocumentoFormState, Parte, TipoParticipacion, Especialidad } from '../../types'

const ESPECIALIDADES: readonly Especialidad[] = [
  'CIVIL', 'PENAL', 'LABORAL', 'ADMINISTRATIVO', 'FAMILIA',
]

const ESPECIALIDAD_LABEL: Record<Especialidad, string> = {
  CIVIL: 'civil',
  PENAL: 'penal',
  LABORAL: 'laboral',
  ADMINISTRATIVO: 'administrativo',
  FAMILIA: 'familia',
}

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

interface ExtraccionPanelProps {
  form: DocumentoFormState
  onFormChange: (form: DocumentoFormState) => void
  onCrear: () => void
  onRevisarManualmente: () => void
  isCreating: boolean
}

export function ExtraccionPanel({
  form,
  onFormChange,
  onCrear,
  onRevisarManualmente,
  isCreating,
}: ExtraccionPanelProps) {
  const update = <K extends keyof DocumentoFormState>(key: K, value: DocumentoFormState[K]) =>
    onFormChange({ ...form, [key]: value })

  const updateParte = (tipo: TipoParticipacion, nombre: string) =>
    onFormChange({ ...form, partes: setParte(form.partes, tipo, nombre) })

  const bannerText = `Detecté un proceso ${ESPECIALIDAD_LABEL[form.especialidad]}. Revise los campos y, si todo está bien, cree el expediente.`

  const canCreate = form.radicado.trim().length > 0 && form.titulo.trim().length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* AI banner */}
        <div className="mx-4 mt-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-ai-tint border border-ai-border">
          <Info size={14} className="text-ai-text mt-0.5 shrink-0" />
          <p className="text-xs text-ai-text leading-relaxed">{bannerText}</p>
        </div>

        {/* Campos */}
        <div className="mt-3 px-1 pb-4 space-y-0.5">
          <ExtraccionField
            label="Radicado"
            value={form.radicado}
            onChange={(v) => update('radicado', v)}
          />
          <ExtraccionField
            label="Título"
            value={form.titulo}
            onChange={(v) => update('titulo', v)}
          />
          <ExtraccionField
            label="Especialidad"
            value={form.especialidad}
            onChange={(v) => update('especialidad', v as Especialidad)}
            options={ESPECIALIDADES}
          />
          <ExtraccionField
            label="Juzgado"
            value={form.despacho}
            onChange={(v) => update('despacho', v)}
          />
          <ExtraccionField
            label="Ciudad"
            value={form.ciudad}
            onChange={(v) => update('ciudad', v)}
          />
          <ExtraccionField
            label="Fecha inicio"
            value={form.fechaInicio ?? ''}
            onChange={(v) => update('fechaInicio', v || undefined)}
          />
          <ExtraccionField
            label="Demandante"
            value={getParte(form.partes, 'DEMANDANTE')}
            onChange={(v) => updateParte('DEMANDANTE', v)}
          />
          <ExtraccionField
            label="Demandado"
            value={getParte(form.partes, 'DEMANDADO')}
            onChange={(v) => updateParte('DEMANDADO', v)}
          />
          <ExtraccionField
            label="Apoderado"
            value={getParte(form.partes, 'APODERADO')}
            onChange={(v) => updateParte('APODERADO', v)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3.5 border-t border-border flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={onRevisarManualmente}
          className="px-3.5 py-2 text-xs font-medium text-fg-body border border-border rounded-lg hover:bg-bg-subtle hover:border-border-strong transition-colors"
        >
          Revisar manualmente
        </button>
        <button
          type="button"
          onClick={onCrear}
          disabled={!canCreate || isCreating}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isCreating && <Loader2 size={12} className="animate-spin" />}
          {isCreating ? 'Creando...' : 'Crear expediente'}
        </button>
      </div>
    </div>
  )
}
