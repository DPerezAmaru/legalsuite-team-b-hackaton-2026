import { Link } from '@tanstack/react-router'
import {
  BriefcaseIcon,
  CheckSquareIcon,
  ClockIcon,
  LightbulbIcon,
  ScalesIcon,
  UserIcon,
  WarningIcon,
} from '@phosphor-icons/react'
import type {
  AccionChat,
  Expediente,
  Parte,
  ProcesoSugerido,
  Tarea,
} from '../../types'

interface MessageDatosProps {
  accion: AccionChat | string
  datos: unknown
}

export function MessageDatos({ accion, datos }: MessageDatosProps) {
  if (datos == null) return null

  switch (accion) {
    case 'LISTAR_EXPEDIENTES':
    case 'BUSCAR_EXPEDIENTES':
      return <ExpedientesList expedientes={asArray<Expediente>(datos)} />

    case 'CREAR_EXPEDIENTES_MASIVO':
      return <ExpedientesList expedientes={asArray<Expediente>(datos)} variant="creados" />

    case 'OBTENER_EXPEDIENTE':
    case 'RESUMEN_EXPEDIENTE':
    case 'ELIMINAR_EXPEDIENTE':
      return <ExpedienteCard expediente={asObject<Expediente>(datos)} />

    case 'ASISTENTE_CREACION':
      return <ExpedientePreview proceso={asObject<ProcesoSugerido & { id?: number }>(datos)} />

    case 'LISTAR_TAREAS':
    case 'LISTAR_TODAS_TAREAS':
    case 'CREAR_TAREAS_EXPEDIENTE':
      return <TareasList tareas={asArray<Tarea>(datos)} />

    case 'ELIMINAR_TAREA': {
      const t = asObject<Tarea>(datos)
      return t ? <TareasList tareas={[t]} /> : null
    }

    case 'SUGERIR_TAREAS':
      return <TareasList tareas={asArray<Tarea>(datos)} variant="sugeridas" />

    case 'ALERTAS_VENCIMIENTO':
      return <TareasList tareas={asArray<Tarea>(datos)} variant="vencimiento" />

    case 'CREAR_USUARIO':
      return <UsuarioCard usuario={asObject<{ id?: number; nombre?: string; email?: string; rol?: string }>(datos)} />

    default:
      return null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}
function asObject<T>(value: unknown): T | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : null
}

// ─── Cards ───────────────────────────────────────────────────────────────────

function ExpedientesList({
  expedientes,
  variant,
}: {
  expedientes: Expediente[]
  variant?: 'creados'
}) {
  if (expedientes.length === 0) return null

  return (
    <div className="mt-2 space-y-2">
      {variant === 'creados' && (
        <p className="text-xs text-fg-tertiary">
          {expedientes.length} expediente(s) creado(s) con éxito.
        </p>
      )}
      {expedientes.map((exp) => (
        <Link
          key={exp.id}
          to="/expedientes/$expedienteId"
          params={{ expedienteId: String(exp.id) }}
          className="block px-3 py-2.5 rounded-lg bg-bg-base border border-border hover:border-border-strong transition-colors"
        >
          <div className="flex items-start gap-2.5">
            <BriefcaseIcon size={16} className="text-fg-secondary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-fg-primary truncate">{exp.titulo}</span>
                <StatusPill estado={exp.estado} />
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-fg-tertiary">
                <span>{exp.especialidad}</span>
                {exp.ciudad && <span>· {exp.ciudad}</span>}
                {exp.radicado && <span className="font-mono">· {exp.radicado}</span>}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ExpedienteCard({ expediente }: { expediente: Expediente | null }) {
  if (!expediente) return null

  return (
    <Link
      to="/expedientes/$expedienteId"
      params={{ expedienteId: String(expediente.id) }}
      className="block mt-2 p-3 rounded-lg bg-bg-base border border-border hover:border-border-strong transition-colors"
    >
      <div className="flex items-baseline gap-2 mb-1.5">
        <BriefcaseIcon size={16} className="text-fg-secondary shrink-0" />
        <span className="text-sm font-medium text-fg-primary flex-1">{expediente.titulo}</span>
        <StatusPill estado={expediente.estado} />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-fg-tertiary pl-6">
        <span>{expediente.especialidad}</span>
        {expediente.ciudad && <span>· {expediente.ciudad}</span>}
        {expediente.despacho && <span>· {expediente.despacho}</span>}
        {expediente.radicado && <span className="font-mono">· {expediente.radicado}</span>}
      </div>
      {expediente.partes && expediente.partes.length > 0 && (
        <div className="mt-2 pl-6 space-y-0.5">
          {expediente.partes.map((p, i) => (
            <ParteRow key={p.id ?? i} parte={p} />
          ))}
        </div>
      )}
    </Link>
  )
}

function ExpedientePreview({
  proceso,
}: {
  proceso: (ProcesoSugerido & { id?: number }) | null
}) {
  if (!proceso) return null
  // Si ya tiene id, es el final → usar la card de expediente real
  if (proceso.id) return <ExpedienteCard expediente={proceso as unknown as Expediente} />

  return (
    <div className="mt-2 p-3 rounded-lg bg-ai-tint border border-ai-border">
      <div className="flex items-center gap-2 mb-1.5">
        <ScalesIcon size={15} className="text-ai-text shrink-0" />
        <span className="text-xs font-medium text-ai-text uppercase tracking-wide">
          Borrador en construcción
        </span>
      </div>
      <div className="text-sm text-fg-primary font-medium">
        {proceso.titulo || <span className="text-fg-tertiary italic">Sin título</span>}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-fg-secondary">
        {proceso.especialidad && <span>{proceso.especialidad}</span>}
        {proceso.ciudad && <span>· {proceso.ciudad}</span>}
        {proceso.despacho && <span>· {proceso.despacho}</span>}
        {proceso.radicado && <span className="font-mono">· {proceso.radicado}</span>}
      </div>
      {proceso.partes && proceso.partes.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {proceso.partes.map((p, i) => (
            <ParteRow key={i} parte={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function ParteRow({ parte }: { parte: Parte }) {
  return (
    <div className="text-xs text-fg-secondary">
      <span className="font-medium">{parte.nombre}</span>
      <span className="text-fg-tertiary"> · {parte.tipoParticipacion}</span>
    </div>
  )
}

function TareasList({
  tareas,
  variant,
}: {
  tareas: Tarea[]
  variant?: 'sugeridas' | 'vencimiento'
}) {
  if (tareas.length === 0) return null

  const headerIcon =
    variant === 'sugeridas' ? LightbulbIcon : variant === 'vencimiento' ? WarningIcon : CheckSquareIcon
  const HeaderIcon = headerIcon
  const headerLabel =
    variant === 'sugeridas'
      ? 'Sugerencias (no guardadas)'
      : variant === 'vencimiento'
      ? 'Próximos vencimientos'
      : null

  return (
    <div className="mt-2 space-y-1.5">
      {headerLabel && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-fg-secondary px-1">
          <HeaderIcon size={13} />
          <span>{headerLabel}</span>
        </div>
      )}
      {tareas.map((t, i) => (
        <div
          key={t.id ?? i}
          className="px-3 py-2 rounded-lg bg-bg-base border border-border"
        >
          <div className="flex items-start gap-2.5">
            <CheckSquareIcon
              size={15}
              weight={t.estado === 'COMPLETADA' ? 'fill' : 'regular'}
              className="text-fg-secondary shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-fg-primary">{t.titulo}</span>
                <PrioridadPill prioridad={t.prioridad} />
              </div>
              {t.descripcion && (
                <p className="text-xs text-fg-tertiary mt-0.5 line-clamp-2">{t.descripcion}</p>
              )}
              {t.fechaVencimiento && (
                <div className="flex items-center gap-1 text-xs text-fg-tertiary mt-1">
                  <ClockIcon size={11} />
                  <span>{t.fechaVencimiento}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function UsuarioCard({
  usuario,
}: {
  usuario: { id?: number; nombre?: string; email?: string; rol?: string } | null
}) {
  if (!usuario) return null
  return (
    <div className="mt-2 px-3 py-2.5 rounded-lg bg-bg-base border border-border flex items-center gap-2.5">
      <UserIcon size={16} className="text-fg-secondary shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-fg-primary">{usuario.nombre ?? '—'}</div>
        <div className="text-xs text-fg-tertiary">
          {usuario.email}
          {usuario.rol && <span> · {usuario.rol}</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Pills ───────────────────────────────────────────────────────────────────

function StatusPill({ estado }: { estado: string | undefined }) {
  if (!estado) return null
  const tone =
    estado === 'ACTIVO'
      ? 'bg-status-active-bg text-status-active-text border-transparent'
      : estado === 'CERRADO'
      ? 'bg-bg-muted text-fg-secondary border-border'
      : 'bg-bg-subtle text-fg-tertiary border-border'
  return (
    <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${tone}`}>
      {estado}
    </span>
  )
}

function PrioridadPill({ prioridad }: { prioridad: string | undefined }) {
  if (!prioridad) return null
  const tone =
    prioridad === 'ALTA'
      ? 'bg-status-urgent-bg text-status-urgent-text border-transparent'
      : prioridad === 'MEDIA'
      ? 'bg-status-review-bg text-status-review-text border-transparent'
      : 'bg-bg-subtle text-fg-tertiary border-border'
  return (
    <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${tone}`}>
      {prioridad}
    </span>
  )
}
