import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle, Check, CircleNotch, ArrowRight } from '@phosphor-icons/react'
import type { ExpedienteCreadoConTareas, TareaSugerida } from '../../types'
import { useCrearTareasBulk } from '../../hooks/useCrearTareasBulk'

const PRIORIDAD_STYLES: Record<TareaSugerida['prioridad'], string> = {
  ALTA:  'bg-red-50 text-red-600',
  MEDIA: 'bg-amber-50 text-amber-600',
  BAJA:  'bg-bg-muted text-fg-secondary',
}

interface TareasResumenProps {
  expedientes: ExpedienteCreadoConTareas[]
}

export function TareasResumen({ expedientes }: TareasResumenProps) {
  // selectedTareas: Map<expedienteId, Set<tareaId>>
  const [selected, setSelected] = useState<Map<number, Set<number>>>(() => {
    const map = new Map<number, Set<number>>()
    for (const exp of expedientes) {
      map.set(exp.expedienteId, new Set(exp.tareasSugeridas.map((t) => t.id)))
    }
    return map
  })
  const [done, setDone] = useState(false)
  const { mutateAsync: crearTareas, isPending } = useCrearTareasBulk()

  function toggleTarea(expedienteId: number, tareaId: number) {
    setSelected((prev) => {
      const next = new Map(prev)
      const set = new Set(next.get(expedienteId) ?? [])
      if (set.has(tareaId)) set.delete(tareaId)
      else set.add(tareaId)
      next.set(expedienteId, set)
      return next
    })
  }

  const totalSeleccionadas = [...selected.values()].reduce((sum, s) => sum + s.size, 0)

  async function handleConfirmar() {
    const payload = expedientes
      .map((exp) => {
        const ids = selected.get(exp.expedienteId) ?? new Set()
        return {
          expedienteId: exp.expedienteId,
          tareas: exp.tareasSugeridas
            .filter((t) => ids.has(t.id))
            .map(({ texto, prioridad }) => ({ texto, prioridad })),
        }
      })
      .filter((p) => p.tareas.length > 0)

    await crearTareas(payload)
    setDone(true)
  }

  if (done) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
        <CheckCircle className="text-cta-bg" size={40} />
        <div>
          <p className="text-lg font-semibold text-fg-primary">Todo listo</p>
          <p className="text-sm text-fg-secondary mt-1">
            Los expedientes y sus tareas fueron creados correctamente.
          </p>
        </div>
        <Link
          to="/expedientes"
          className="flex items-center gap-1.5 mt-2 px-4 py-2 text-sm font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors"
        >
          Ir a expedientes <ArrowRight />
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        <div className="flex items-start gap-3 p-4 rounded-xl border border-cta-bg/30 bg-cta-bg/5">
          <CheckCircle className="text-cta-bg shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-fg-primary">
              {expedientes.length === 1
                ? '1 expediente creado'
                : `${expedientes.length} expedientes creados`}
            </p>
            <p className="text-xs text-fg-secondary mt-0.5">
              Revisá las tareas sugeridas por la IA y confirmá las que querés crear.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {expedientes.map((exp) => (
            <div key={exp.expedienteId} className="border border-border rounded-xl bg-bg-base overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-bg-subtle flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg-primary truncate">{exp.titulo}</p>
                  <p className="text-xs text-fg-tertiary font-mono mt-0.5">{exp.radicado}</p>
                </div>
                <Link
                  to="/expedientes/$expedienteId"
                  params={{ expedienteId: String(exp.expedienteId) }}
                  className="text-xs text-fg-secondary hover:text-fg-primary transition-colors shrink-0"
                >
                  Ver expediente →
                </Link>
              </div>

              <ul className="divide-y divide-border">
                {exp.tareasSugeridas.map((tarea) => {
                  const isSelected = selected.get(exp.expedienteId)?.has(tarea.id) ?? false
                  return (
                    <li key={tarea.id}>
                      <button
                        type="button"
                        onClick={() => toggleTarea(exp.expedienteId, tarea.id)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-bg-subtle transition-colors"
                      >
                        <div
                          className={[
                            'mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0',
                            isSelected
                              ? 'bg-cta-bg border-cta-bg'
                              : 'bg-bg-base border-border',
                          ].join(' ')}
                        >
                          {isSelected && <Check size={10} weight="bold" className="text-cta-text" />}
                        </div>
                        <span className="flex-1 text-sm text-fg-body">{tarea.texto}</span>
                        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${PRIORIDAD_STYLES[tarea.prioridad]}`}>
                          {tarea.prioridad}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            to="/expedientes"
            className="text-sm text-fg-secondary hover:text-fg-primary transition-colors"
          >
            Saltar, ir a expedientes
          </Link>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={totalSeleccionadas === 0 || isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending
              ? <><CircleNotch className="animate-spin" />Creando tareas...</>
              : `Confirmar ${totalSeleccionadas} tarea${totalSeleccionadas !== 1 ? 's' : ''}`}
          </button>
        </div>

      </div>
    </div>
  )
}
