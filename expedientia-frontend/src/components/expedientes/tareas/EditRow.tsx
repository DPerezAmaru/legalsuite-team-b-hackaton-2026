import { CheckIcon, XIcon } from '@phosphor-icons/react'
import { Select } from '../../ui/Select'
import type { EstadoTarea, Prioridad } from '../../../types'

interface EditRowProps {
  titulo: string
  estado: EstadoTarea
  prioridad: Prioridad
  onEstado: (v: EstadoTarea) => void
  onPrioridad: (v: Prioridad) => void
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export function EditRow({
  titulo,
  estado,
  prioridad,
  onEstado,
  onPrioridad,
  onConfirm,
  onCancel,
  loading,
}: EditRowProps) {
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
        <CheckIcon size={12} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 rounded text-fg-secondary hover:bg-bg-muted transition-colors shrink-0"
      >
        <XIcon size={12} />
      </button>
    </li>
  )
}
