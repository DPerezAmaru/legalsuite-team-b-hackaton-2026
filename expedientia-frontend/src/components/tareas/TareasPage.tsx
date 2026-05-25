import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  MagnifyingGlassIcon, PencilSimpleIcon, TrashIcon, CheckIcon, XIcon,
} from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TareaSchema } from '../../types'
import type { EstadoTarea, Prioridad, Tarea } from '../../types'
import { useTodasTareas } from '../../hooks/useTodasTareas'
import { useExpedientes } from '../../hooks/useExpedientes'
import { PageContainer } from '../layout/PageContainer'
import { PageHeader } from '../layout/PageHeader'
import { PageToolbar } from '../layout/PageToolbar'
import { Select } from '../ui/Select'
import { Tooltip } from '../ui/Tooltip'

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

type FilterTab = 'todas' | EstadoTarea

// ── API ────────────────────────────────────────────────────────────────────

async function patchTarea(payload: { id: number; estado?: EstadoTarea; prioridad?: Prioridad }) {
  const { id, ...body } = payload
  const res = await fetch(`/api/tareas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return TareaSchema.parse(await res.json())
}

async function deleteTarea(id: number) {
  const res = await fetch(`/api/tareas/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

// ── TareaRow ───────────────────────────────────────────────────────────────

function TareaRow({
  tarea,
  expedienteNombre,
  onEdit,
  onDelete,
}: {
  tarea: Tarea
  expedienteNombre: string | null
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const vencimiento = formatFecha(tarea.fechaVencimiento)

  if (confirmando) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-bg-subtle text-sm">
        <p className="flex-1 min-w-0 text-fg-secondary truncate">
          ¿Eliminar <span className="text-fg-primary font-medium">{tarea.titulo}</span>?
        </p>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="text-xs text-fg-secondary hover:text-fg-primary transition-colors shrink-0"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors shrink-0"
        >
          Eliminar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 text-sm group hover:bg-bg-subtle transition-colors">
      {/* Título */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-fg-primary truncate">{tarea.titulo}</p>
        {vencimiento && (
          <p className="text-xs text-fg-tertiary mt-0.5">Vence: {vencimiento}</p>
        )}
      </div>

      {/* Expediente */}
      <div className="hidden @2xl/table:block shrink-0">
        {tarea.expedienteId != null ? (
          <Link
            to="/expedientes/$expedienteId"
            params={{ expedienteId: String(tarea.expedienteId) }}
            className="text-xs text-fg-secondary hover:text-fg-primary hover:underline transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {expedienteNombre ?? `Expediente #${tarea.expedienteId}`}
          </Link>
        ) : (
          <span className="text-xs text-fg-tertiary">—</span>
        )}
      </div>

      {/* Badges */}
      <div className="w-40 flex items-center gap-1.5 shrink-0">
        {tarea.sugeridaPorIa && (
          <Tooltip content="Sugerida por IA">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-ai-tint text-ai-text cursor-default">IA</span>
          </Tooltip>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-default ${PRIORIDAD_STYLES[tarea.prioridad] ?? ''}`}>
          {PRIORIDAD_LABELS[tarea.prioridad] ?? tarea.prioridad}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded cursor-default ${ESTADO_STYLES[tarea.estado] ?? ''}`}>
          {ESTADO_LABELS[tarea.estado] ?? tarea.estado}
        </span>
      </div>

      {/* Acciones */}
      <div className="w-14 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Tooltip content="Editar">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded text-fg-tertiary hover:text-fg-primary hover:bg-bg-muted transition-colors"
          >
            <PencilSimpleIcon size={14} />
          </button>
        </Tooltip>
        <Tooltip content="Eliminar">
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="p-1.5 rounded text-fg-tertiary hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <TrashIcon size={14} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

// ── EditRow ────────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 px-4 py-3 bg-bg-subtle text-sm">
      <p className="flex-1 min-w-0 text-fg-secondary truncate">{titulo}</p>
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
        <CheckIcon size={12} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 rounded text-fg-secondary hover:bg-bg-muted transition-colors shrink-0"
      >
        <XIcon size={12} />
      </button>
    </div>
  )
}

// ── TareasPage ─────────────────────────────────────────────────────────────

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'PENDIENTE', label: 'Pendientes' },
  { id: 'EN_PROGRESO', label: 'En progreso' },
  { id: 'COMPLETADA', label: 'Completadas' },
]

export function TareasPage() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<FilterTab>('todas')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editEstado, setEditEstado] = useState<EstadoTarea>('PENDIENTE')
  const [editPrioridad, setEditPrioridad] = useState<Prioridad>('MEDIA')

  const { data: tareas = [], isLoading, isError } = useTodasTareas()
  const { data: expedientes = [] } = useExpedientes()
  const qc = useQueryClient()

  const expedienteMap = new Map(expedientes.map(e => [e.id, e.titulo]))

  const { mutateAsync: actualizar, isPending: actualizando } = useMutation({
    mutationFn: patchTarea,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas'] }),
  })

  const { mutateAsync: eliminar } = useMutation({
    mutationFn: deleteTarea,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas'] }),
  })

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

  const counts: Record<FilterTab, number> = {
    todas: tareas.length,
    PENDIENTE: tareas.filter(t => t.estado === 'PENDIENTE').length,
    EN_PROGRESO: tareas.filter(t => t.estado === 'EN_PROGRESO').length,
    COMPLETADA: tareas.filter(t => t.estado === 'COMPLETADA').length,
  }

  const visible = tareas.filter(t => {
    if (tab !== 'todas' && t.estado !== tab) return false
    if (!search) return true
    return t.titulo.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <PageContainer>
      <PageHeader
        title="Tareas"
        subtitle="Pendientes y vencimientos próximos."
        meta={
          !isLoading && (
            <span className="text-xs font-medium bg-bg-muted text-fg-secondary px-2 py-0.5 rounded-full">
              {tareas.length}
            </span>
          )
        }
      />

      <PageToolbar
        search={
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
            <input
              type="text"
              placeholder="Buscar tareas"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-subtle border border-border rounded-lg text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-border-strong"
            />
          </div>
        }
        filters={
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  tab === t.id
                    ? 'bg-bg-muted text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-secondary hover:bg-bg-subtle'
                }`}
              >
                {t.label}
                <span className="text-[10px] text-fg-tertiary">{counts[t.id]}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="@container/table">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-fg-tertiary font-medium border-b border-border">
          <span className="flex-1">Tarea</span>
          <span className="hidden @2xl/table:block shrink-0">Expediente</span>
          <span className="w-40 shrink-0">Estado / Prioridad</span>
          <span className="w-14 shrink-0" />
        </div>

        <div className="divide-y divide-border">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 bg-bg-muted rounded" />
                  <div className="h-2.5 w-24 bg-bg-muted rounded" />
                </div>
                <div className="hidden @2xl/table:block w-52 h-3 bg-bg-muted rounded" />
                <div className="flex gap-1.5">
                  <div className="h-4 w-14 bg-bg-muted rounded" />
                  <div className="h-4 w-16 bg-bg-muted rounded" />
                </div>
                <div className="w-14" />
              </div>
            ))}

          {isError && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-fg-secondary">No se pudieron cargar las tareas.</p>
            </div>
          )}

          {!isLoading && !isError && visible.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-fg-secondary">No hay tareas para mostrar.</p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            visible.map(tarea =>
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
                  expedienteNombre={
                    tarea.expedienteId != null
                      ? (expedienteMap.get(tarea.expedienteId) ?? null)
                      : null
                  }
                  onEdit={() => startEdit(tarea)}
                  onDelete={() => eliminar(tarea.id)}
                />
              ),
            )}
        </div>
      </div>
    </PageContainer>
  )
}
