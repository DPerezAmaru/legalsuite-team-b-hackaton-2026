import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle, Check, CircleNotch, ArrowRight, Sparkle } from '@phosphor-icons/react'
import type { ExpedienteCreadoConTareas, TareaSugerida } from '../../types'
import { useCrearTareasBulk } from '../../hooks/useCrearTareasBulk'

const PRIORIDAD_STYLES: Record<TareaSugerida['prioridad'], string> = {
  ALTA:  'bg-red-50 text-red-600',
  MEDIA: 'bg-amber-50 text-amber-600',
  BAJA:  'bg-bg-muted text-fg-secondary',
}

let _tareaIdCounter = 1

interface TareasResumenProps {
  expedientes: ExpedienteCreadoConTareas[]
}

async function fetchTareasIA(expedientes: ExpedienteCreadoConTareas[]): Promise<Map<number, TareaSugerida[]>> {
  const expedientesInfo = expedientes
    .map(exp => `- ID ${exp.expedienteId}: "${exp.titulo}" (${exp.especialidad})`)
    .join('\n')

  const prompt =
    `Acaban de crearse los siguientes expedientes judiciales en el sistema:\n${expedientesInfo}\n\n` +
    `Para cada expediente, sugerí exactamente 3 tareas judiciales concretas y prioritarias según su especialidad y contexto.\n` +
    `Respondé ÚNICAMENTE con un JSON array válido, sin texto adicional antes ni después:\n` +
    `[{"expedienteId":1,"tareas":[{"texto":"...","prioridad":"ALTA"},{"texto":"...","prioridad":"MEDIA"},{"texto":"...","prioridad":"BAJA"}]}]\n` +
    `Prioridades válidas: ALTA, MEDIA, BAJA.`

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modoAsistente: false, historial: [] }),
  })

  if (!res.ok) throw new Error(`Error ${res.status}`)

  const json = await res.json()
  const datos = json.datos

  if (!Array.isArray(datos)) throw new Error('datos is not an array')

  const map = new Map<number, TareaSugerida[]>()
  for (const item of datos as Array<{ titulo: string; prioridad: 'ALTA' | 'MEDIA' | 'BAJA'; expedienteId: number }>) {
    if (!map.has(item.expedienteId)) map.set(item.expedienteId, [])
    map.get(item.expedienteId)!.push({
      id: _tareaIdCounter++,
      texto: item.titulo,
      prioridad: item.prioridad,
    })
  }
  return map
}

export function TareasResumen({ expedientes }: TareasResumenProps) {
  const [tareasMap, setTareasMap] = useState<Map<number, TareaSugerida[]>>(new Map())
  const [isLoadingTareas, setIsLoadingTareas] = useState(true)
  const [selected, setSelected] = useState<Map<number, Set<number>>>(new Map())
  const [done, setDone] = useState(false)
  const { mutateAsync: crearTareas, isPending } = useCrearTareasBulk()

  useEffect(() => {
    fetchTareasIA(expedientes)
      .then(map => {
        setTareasMap(map)
        const sel = new Map<number, Set<number>>()
        for (const [expId, tareas] of map) {
          sel.set(expId, new Set(tareas.map(t => t.id)))
        }
        setSelected(sel)
      })
      .catch(() => { /* silent: user can skip */ })
      .finally(() => setIsLoadingTareas(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTarea(expedienteId: number, tareaId: number) {
    setSelected(prev => {
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
      .map(exp => {
        const tareas = tareasMap.get(exp.expedienteId) ?? []
        const ids = selected.get(exp.expedienteId) ?? new Set()
        return {
          expedienteId: exp.expedienteId,
          tareas: tareas
            .filter(t => ids.has(t.id))
            .map(({ texto, prioridad }) => ({ texto, prioridad })),
        }
      })
      .filter(p => p.tareas.length > 0)

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
              {expedientes.length === 1 ? '1 expediente creado' : `${expedientes.length} expedientes creados`}
            </p>
            <p className="text-xs text-fg-secondary mt-0.5">
              {isLoadingTareas
                ? 'La IA está generando tareas sugeridas…'
                : 'Revisá las tareas sugeridas por la IA y confirmá las que querés crear.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {expedientes.map(exp => {
            const tareas = tareasMap.get(exp.expedienteId) ?? []
            return (
              <div key={exp.expedienteId} className="border border-border rounded-xl bg-bg-base overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-bg-subtle flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg-primary truncate">{exp.titulo}</p>
                    {exp.radicado && (
                      <p className="text-xs text-fg-tertiary font-mono mt-0.5">{exp.radicado}</p>
                    )}
                  </div>
                  <Link
                    to="/expedientes/$expedienteId"
                    params={{ expedienteId: String(exp.expedienteId) }}
                    className="text-xs text-fg-secondary hover:text-fg-primary transition-colors shrink-0"
                  >
                    Ver expediente →
                  </Link>
                </div>

                {isLoadingTareas ? (
                  <div className="space-y-0 divide-y divide-border">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                        <div className="w-4 h-4 rounded border border-border bg-bg-muted shrink-0" />
                        <div className="flex-1 h-3 bg-bg-muted rounded" />
                        <div className="w-10 h-4 bg-bg-muted rounded" />
                      </div>
                    ))}
                    <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-ai-text bg-ai-tint">
                      <Sparkle size={12} className="animate-pulse shrink-0" />
                      Generando tareas con IA…
                    </div>
                  </div>
                ) : tareas.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-fg-tertiary italic">
                    No se pudieron generar tareas. Podés crearlas desde el expediente.
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {tareas.map(tarea => {
                      const isSelected = selected.get(exp.expedienteId)?.has(tarea.id) ?? false
                      return (
                        <li key={tarea.id}>
                          <button
                            type="button"
                            onClick={() => toggleTarea(exp.expedienteId, tarea.id)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-bg-subtle transition-colors"
                          >
                            <div className={[
                              'mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0',
                              isSelected ? 'bg-cta-bg border-cta-bg' : 'bg-bg-base border-border',
                            ].join(' ')}>
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
                )}
              </div>
            )
          })}
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
            disabled={isLoadingTareas || totalSeleccionadas === 0 || isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <><CircleNotch className="animate-spin" size={14} /> Creando tareas…</>
            ) : isLoadingTareas ? (
              <><CircleNotch className="animate-spin" size={14} /> Generando sugerencias…</>
            ) : (
              `Confirmar ${totalSeleccionadas} tarea${totalSeleccionadas !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
