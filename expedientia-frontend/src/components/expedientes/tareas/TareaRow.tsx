import { useState } from 'react'
import { PencilSimple, Trash } from '@phosphor-icons/react'
import { Tooltip } from '../../ui/Tooltip'
import type { Tarea } from '../../../types'
import {
  PRIORIDAD_LABELS,
  PRIORIDAD_STYLES,
  ESTADO_LABELS,
  ESTADO_STYLES,
  formatFecha,
} from './labels'

interface TareaRowProps {
  tarea: Tarea
  onEdit: () => void
  onDelete: () => void
}

export function TareaRow({ tarea, onEdit, onDelete }: TareaRowProps) {
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-ai-tint text-ai-text cursor-default">
              IA
            </span>
          </Tooltip>
        )}
        <Tooltip content="Prioridad">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-default ${PRIORIDAD_STYLES[tarea.prioridad] ?? ''}`}
          >
            {PRIORIDAD_LABELS[tarea.prioridad] ?? tarea.prioridad}
          </span>
        </Tooltip>
        <Tooltip content="Estado">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded cursor-default ${ESTADO_STYLES[tarea.estado] ?? ''}`}
          >
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
