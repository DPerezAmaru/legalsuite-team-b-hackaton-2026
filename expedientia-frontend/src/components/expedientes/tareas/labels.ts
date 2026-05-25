import type { EstadoTarea, Prioridad } from '../../../types'

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  ALTA: '↑ Alta',
  MEDIA: '→ Media',
  BAJA: '↓ Baja',
}

export const PRIORIDAD_STYLES: Record<Prioridad, string> = {
  ALTA: 'bg-red-100 text-red-800',
  MEDIA: 'bg-amber-100 text-amber-800',
  BAJA: 'bg-bg-muted text-fg-secondary',
}

export const ESTADO_LABELS: Record<EstadoTarea, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  COMPLETADA: 'Completada',
}

export const ESTADO_STYLES: Record<EstadoTarea, string> = {
  PENDIENTE: 'bg-bg-muted text-fg-secondary',
  EN_PROGRESO: 'bg-blue-100 text-blue-800',
  COMPLETADA: 'bg-green-100 text-green-800',
}

export function formatFecha(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
