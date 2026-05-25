import { useState } from 'react'
import { CheckSquareIcon, PlusCircleIcon, SparkleIcon } from '@phosphor-icons/react'
import { AccordionSection } from '../ui/AccordionSection'
import { Tooltip } from '../ui/Tooltip'
import type { Tarea, EstadoTarea, Prioridad } from '../../types'
import { useTareas } from '../../hooks/useTareas'
import { useCrearTarea } from '../../hooks/useCrearTarea'
import { useActualizarTarea } from '../../hooks/useActualizarTarea'
import { useEliminarTarea } from '../../hooks/useEliminarTarea'
import { useAssistenteChat } from '../../hooks/useAssistenteChat'
import { TareaRow } from './tareas/TareaRow'
import { EditRow } from './tareas/EditRow'
import { CrearTareaForm } from './tareas/CrearTareaForm'
import { SugerenciasPanel } from './tareas/SugerenciasPanel'
import { parseSugerencias, type TareaSugerida } from './tareas/sugerencias'

export function TareasSection({ expedienteId }: { expedienteId: number }) {
  const [open, setOpen] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editEstado, setEditEstado] = useState<EstadoTarea>('PENDIENTE')
  const [editPrioridad, setEditPrioridad] = useState<Prioridad>('MEDIA')
  const [showForm, setShowForm] = useState(false)
  const [sugerencias, setSugerencias] = useState<TareaSugerida[] | null>(null)

  const { data: tareas = [], isLoading } = useTareas(expedienteId)
  const { mutateAsync: crear } = useCrearTarea(expedienteId)
  const { mutateAsync: actualizar, isPending: actualizando } = useActualizarTarea(expedienteId)
  const { mutateAsync: eliminar } = useEliminarTarea(expedienteId)
  const { mutateAsync: chat, isPending: iaLoading } = useAssistenteChat()

  function startEdit(tarea: Tarea) {
    setEditingId(tarea.id)
    setEditEstado(tarea.estado)
    setEditPrioridad(tarea.prioridad)
  }

  async function confirmEdit() {
    if (!editingId) return
    await actualizar({ id: editingId, estado: editEstado, prioridad: editPrioridad })
    setEditingId(null)
  }

  function handleShowForm() {
    setShowForm(f => !f)
    setSugerencias(null)
    if (!open) setOpen(true)
  }

  async function handleIa() {
    setShowForm(false)
    if (!open) setOpen(true)
    try {
      const res = await chat({
        prompt: `sugerí tareas para el expediente ${expedienteId}`,
        modoAsistente: false,
        historial: [],
      })
      setSugerencias(parseSugerencias(res.datos))
    } catch {
      // Mismo comportamiento que antes: silenciar fallos para no romper la UX.
    }
  }

  return (
    <AccordionSection
      title="Tareas"
      icon={<CheckSquareIcon className="text-fg-secondary" />}
      badge={
        tareas.length > 0 ? (
          <span className="text-xs text-fg-tertiary tabular-nums mr-1">{tareas.length}</span>
        ) : undefined
      }
      headerExtras={
        <div className="px-2 flex items-center gap-0.5">
          <Tooltip content="Sugerir con IA">
            <button
              type="button"
              onClick={handleIa}
              disabled={iaLoading}
              className="p-1.5 rounded text-ai-text hover:bg-ai-tint transition-colors disabled:opacity-50"
            >
              <SparkleIcon size={16} className={iaLoading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
          <Tooltip content="Nueva tarea">
            <button
              type="button"
              onClick={handleShowForm}
              className="p-1.5 rounded text-fg-secondary hover:bg-bg-muted hover:text-fg-primary transition-colors"
            >
              <PlusCircleIcon size={16} />
            </button>
          </Tooltip>
        </div>
      }
      open={open}
      onOpenChange={setOpen}
    >
      {isLoading ? (
        <div className="px-4 py-6 space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-4 bg-bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : tareas.length === 0 && !showForm ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-fg-tertiary">No hay tareas para este expediente</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {tareas.map(tarea =>
            editingId === tarea.id ? (
              <EditRow
                key={tarea.id}
                titulo={tarea.titulo}
                estado={editEstado}
                prioridad={editPrioridad}
                onEstado={setEditEstado}
                onPrioridad={setEditPrioridad}
                onConfirm={confirmEdit}
                onCancel={() => setEditingId(null)}
                loading={actualizando}
              />
            ) : (
              <TareaRow
                key={tarea.id}
                tarea={tarea}
                onEdit={() => startEdit(tarea)}
                onDelete={() => eliminar(tarea.id)}
              />
            ),
          )}
        </ul>
      )}

      {showForm && (
        <CrearTareaForm
          expedienteId={expedienteId}
          onCrear={crear}
          onClose={() => setShowForm(false)}
        />
      )}

      {sugerencias && (
        <SugerenciasPanel
          sugerencias={sugerencias}
          expedienteId={expedienteId}
          onCrear={crear}
          onClose={() => setSugerencias(null)}
        />
      )}
    </AccordionSection>
  )
}
