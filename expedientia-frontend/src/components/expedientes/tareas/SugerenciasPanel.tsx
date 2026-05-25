import { useState } from 'react'
import { Tooltip } from '../../ui/Tooltip'
import type { CrearTareaPayload } from '../../../hooks/useCrearTarea'
import type { TareaSugerida } from './sugerencias'
import { PRIORIDAD_LABELS, PRIORIDAD_STYLES } from './labels'

interface SugerenciasPanelProps {
  sugerencias: TareaSugerida[]
  expedienteId: number
  onCrear: (p: CrearTareaPayload) => Promise<unknown>
  onClose: () => void
}

export function SugerenciasPanel({
  sugerencias,
  expedienteId,
  onCrear,
  onClose,
}: SugerenciasPanelProps) {
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(
    () => new Set(sugerencias.map(s => s.tmpId)),
  )
  const [loading, setLoading] = useState(false)

  function toggle(id: number) {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCrear() {
    const elegidas = sugerencias.filter(s => seleccionadas.has(s.tmpId))
    if (!elegidas.length) return
    setLoading(true)
    try {
      await Promise.all(
        elegidas.map(s =>
          onCrear({
            titulo: s.titulo,
            descripcion: s.descripcion,
            estado: 'PENDIENTE',
            prioridad: s.prioridad,
            sugeridaPorIa: true,
            expedienteId,
          }),
        ),
      )
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t border-border px-4 py-4 space-y-3">
      <p className="text-xs font-medium text-fg-secondary">
        Sugerencias de la IA — elegí cuáles crear
      </p>

      <ul className="space-y-2">
        {sugerencias.map(s => (
          <li key={s.tmpId}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={seleccionadas.has(s.tmpId)}
                onChange={() => toggle(s.tmpId)}
                className="mt-0.5 shrink-0 accent-fg-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-fg-body leading-snug group-hover:text-fg-primary transition-colors">
                  {s.titulo}
                </p>
                {s.descripcion && (
                  <p className="text-xs text-fg-tertiary mt-0.5">{s.descripcion}</p>
                )}
              </div>
              <Tooltip content="Prioridad">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 cursor-default ${PRIORIDAD_STYLES[s.prioridad] ?? ''}`}
                >
                  {PRIORIDAD_LABELS[s.prioridad] ?? s.prioridad}
                </span>
              </Tooltip>
            </label>
          </li>
        ))}
      </ul>

      <div className="flex gap-3 justify-end pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-fg-secondary hover:text-fg-primary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleCrear}
          disabled={seleccionadas.size === 0 || loading}
          className="text-xs font-medium text-fg-primary border-b border-fg-primary pb-px hover:text-fg-secondary hover:border-fg-secondary transition-colors disabled:opacity-40"
        >
          Crear {seleccionadas.size > 0 ? `(${seleccionadas.size})` : ''}
        </button>
      </div>
    </div>
  )
}
