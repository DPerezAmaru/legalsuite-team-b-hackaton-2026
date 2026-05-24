import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  CaretDown, CaretRight, CheckSquare, PlusCircle, Sparkle,
  PencilSimple, Trash, Check, X,
} from '@phosphor-icons/react'
import type { Tarea, EstadoTarea, Prioridad } from '../../types'
import { useTareas } from '../../hooks/useTareas'
import { useCrearTarea, type CrearTareaPayload } from '../../hooks/useCrearTarea'
import { useActualizarTarea } from '../../hooks/useActualizarTarea'
import { useEliminarTarea } from '../../hooks/useEliminarTarea'
import { Tooltip } from '../ui/Tooltip'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFecha(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PRIORIDAD_LABELS: Record<string, string> = {
  ALTA: '↑ Alta',
  MEDIA: '→ Media',
  BAJA: '↓ Baja',
}

const PRIORIDAD_STYLES: Record<string, string> = {
  ALTA: 'bg-red-100 text-red-800',
  MEDIA: 'bg-amber-100 text-amber-800',
  BAJA: 'bg-bg-muted text-fg-secondary',
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  COMPLETADA: 'Completada',
}

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: 'bg-bg-muted text-fg-secondary',
  EN_PROGRESO: 'bg-blue-100 text-blue-800',
  COMPLETADA: 'bg-green-100 text-green-800',
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function TareaRow({
  tarea,
  onEdit,
  onDelete,
}: {
  tarea: Tarea
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const vencimiento = formatFecha(tarea.fechaVencimiento)

  if (confirmando) {
    return (
      <li className="flex items-center gap-3 px-4 py-3 bg-bg-subtle">
        <p className="text-sm text-fg-secondary flex-1 truncate min-w-0">
          ¿Eliminar <span className="text-fg-primary font-medium">{tarea.titulo}</span>?
        </p>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="text-xs text-fg-secondary hover:text-fg-primary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
        >
          Eliminar
        </button>
      </li>
    )
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3 group hover:bg-bg-subtle transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg-body leading-snug">{tarea.titulo}</p>
        {vencimiento && (
          <p className="text-xs text-fg-tertiary mt-0.5">Vence: {vencimiento}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {tarea.sugeridaPorIa && (
          <Tooltip content="Sugerida por IA">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-ai-tint text-ai-text cursor-default">IA</span>
          </Tooltip>
        )}
        <Tooltip content="Prioridad">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-default ${PRIORIDAD_STYLES[tarea.prioridad] ?? ''}`}>
            {PRIORIDAD_LABELS[tarea.prioridad] ?? tarea.prioridad}
          </span>
        </Tooltip>
        <Tooltip content="Estado">
          <span className={`text-[10px] px-1.5 py-0.5 rounded cursor-default ${ESTADO_STYLES[tarea.estado] ?? ''}`}>
            {ESTADO_LABELS[tarea.estado] ?? tarea.estado}
          </span>
        </Tooltip>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip content="Editar">
            <button
              type="button"
              onClick={onEdit}
              className="p-1 rounded text-fg-tertiary hover:text-fg-primary hover:bg-bg-muted transition-colors"
            >
              <PencilSimple size={15} />
            </button>
          </Tooltip>
          <Tooltip content="Eliminar">
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="p-1 rounded text-fg-tertiary hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash size={15} />
            </button>
          </Tooltip>
        </div>
      </div>
    </li>
  )
}

function EditRow({
  titulo,
  estado,
  prioridad,
  onEstado,
  onPrioridad,
  onConfirm,
  onCancel,
  loading,
}: {
  titulo: string
  estado: EstadoTarea
  prioridad: Prioridad
  onEstado: (v: EstadoTarea) => void
  onPrioridad: (v: Prioridad) => void
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 bg-bg-subtle">
      <p className="text-sm text-fg-secondary truncate flex-1 min-w-0">{titulo}</p>
      <Select value={estado} onChange={e => onEstado(e.target.value as EstadoTarea)}>
        <option value="PENDIENTE">Pendiente</option>
        <option value="EN_PROGRESO">En progreso</option>
        <option value="COMPLETADA">Completada</option>
      </Select>
      <Select value={prioridad} onChange={e => onPrioridad(e.target.value as Prioridad)}>
        <option value="ALTA">Alta</option>
        <option value="MEDIA">Media</option>
        <option value="BAJA">Baja</option>
      </Select>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="p-1.5 rounded bg-cta-bg text-cta-text hover:bg-cta-hover transition-colors disabled:opacity-50 shrink-0"
      >
        <Check size={12} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 rounded text-fg-secondary hover:bg-bg-muted transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </li>
  )
}

function CrearTareaForm({
  expedienteId,
  onCrear,
  onClose,
}: {
  expedienteId: number
  onCrear: (p: CrearTareaPayload) => Promise<unknown>
  onClose: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState<EstadoTarea>('PENDIENTE')
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setLoading(true)
    try {
      await onCrear({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        estado,
        prioridad,
        fechaVencimiento: fechaVencimiento || undefined,
        sugeridaPorIa: false,
        expedienteId,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border px-4 py-4 space-y-4"
    >
      <p className="text-xs font-medium text-fg-secondary">Nueva tarea</p>

      <Input
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        placeholder="Título"
        required
      />

      <Input
        value={descripcion}
        onChange={e => setDescripcion(e.target.value)}
        placeholder="Descripción (opcional)"
      />

      <div className="grid grid-cols-3 gap-4">
        <Select label="Prioridad" value={prioridad} onChange={e => setPrioridad(e.target.value as Prioridad)}>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="BAJA">Baja</option>
        </Select>
        <Select label="Estado" value={estado} onChange={e => setEstado(e.target.value as EstadoTarea)}>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROGRESO">En progreso</option>
          <option value="COMPLETADA">Completada</option>
        </Select>
        <Input
          label="Vencimiento"
          type="date"
          value={fechaVencimiento}
          onChange={e => setFechaVencimiento(e.target.value)}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-fg-secondary hover:text-fg-primary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!titulo.trim() || loading}
          className="text-xs font-medium text-fg-primary border-b border-fg-primary pb-px hover:text-fg-secondary hover:border-fg-secondary transition-colors disabled:opacity-40"
        >
          Crear tarea
        </button>
      </div>
    </form>
  )
}

// ── Tipos y helpers para sugerencias ──────────────────────────────────────

interface TareaSugerida {
  tmpId: number
  titulo: string
  descripcion?: string
  prioridad: Prioridad
}

function parseSugerencias(datos: unknown): TareaSugerida[] {
  if (!Array.isArray(datos)) return []
  return datos.map((item, i) => ({
    tmpId: typeof item?.id === 'number' ? item.id : i,
    titulo: typeof item?.titulo === 'string' ? item.titulo : `Tarea ${i + 1}`,
    descripcion: typeof item?.descripcion === 'string' ? item.descripcion : undefined,
    prioridad: (['ALTA', 'MEDIA', 'BAJA'] as Prioridad[]).includes(item?.prioridad)
      ? item.prioridad
      : 'MEDIA',
  }))
}

// ── Panel de sugerencias IA ────────────────────────────────────────────────

function SugerenciasPanel({
  sugerencias,
  expedienteId,
  onCrear,
  onClose,
}: {
  sugerencias: TareaSugerida[]
  expedienteId: number
  onCrear: (p: CrearTareaPayload) => Promise<unknown>
  onClose: () => void
}) {
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(
    () => new Set(sugerencias.map(s => s.tmpId)),
  )
  const [loading, setLoading] = useState(false)

  function toggle(id: number) {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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
      <p className="text-xs font-medium text-fg-secondary">Sugerencias de la IA — elegí cuáles crear</p>

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
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 cursor-default ${PRIORIDAD_STYLES[s.prioridad] ?? ''}`}>
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

// ── TareasSection principal ────────────────────────────────────────────────

export function TareasSection({ expedienteId }: { expedienteId: number }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editEstado, setEditEstado] = useState<EstadoTarea>('PENDIENTE')
  const [editPrioridad, setEditPrioridad] = useState<Prioridad>('MEDIA')
  const [showForm, setShowForm] = useState(false)
  const [sugerencias, setSugerencias] = useState<TareaSugerida[] | null>(null)
  const [iaLoading, setIaLoading] = useState(false)

  const { data: tareas = [], isLoading } = useTareas(expedienteId)
  const { mutateAsync: crear } = useCrearTarea(expedienteId)
  const { mutateAsync: actualizar, isPending: actualizando } = useActualizarTarea(expedienteId)
  const { mutateAsync: eliminar } = useEliminarTarea(expedienteId)

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
    setIaLoading(true)
    setShowForm(false)
    if (!open) setOpen(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `sugerí tareas para el expediente ${expedienteId}`,
          modoAsistente: false,
          historial: [],
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setSugerencias(parseSugerencias(json.datos))
      }
    } finally {
      setIaLoading(false)
    }
  }

  return (
    <div className="border border-border rounded-xl bg-bg-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex-1 flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-bg-subtle transition-colors"
        >
          {open
            ? <CaretDown className="text-fg-tertiary shrink-0" />
            : <CaretRight className="text-fg-tertiary shrink-0" />}
          <CheckSquare className="text-fg-secondary shrink-0" />
          <span className="flex-1 text-sm font-medium text-fg-primary">Tareas</span>
          {tareas.length > 0 && (
            <span className="text-xs text-fg-tertiary tabular-nums mr-1">{tareas.length}</span>
          )}
        </button>

        <div className="px-2 flex items-center gap-0.5">
          <Tooltip content="Sugerir con IA" >
            <button
              type="button"
              onClick={handleIa}
              disabled={iaLoading}
              className="p-1.5 rounded text-ai-text hover:bg-ai-tint transition-colors disabled:opacity-50"
            >
              <Sparkle size={16} className={iaLoading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
          <Tooltip content="Nueva tarea" >
            <button
              type="button"
              onClick={handleShowForm}
              className="p-1.5 rounded text-fg-secondary hover:bg-bg-muted hover:text-fg-primary transition-colors"
            >
              <PlusCircle size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      {open && (
        <div className="border-t border-border">
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
        </div>
      )}
    </div>
  )
}
