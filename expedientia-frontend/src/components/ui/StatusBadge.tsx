import type { EstadoDisplay } from '../../types'

interface StatusConfig {
  dot: string
  text: string
}

const CONFIG: Record<EstadoDisplay, StatusConfig> = {
  'Activo':       { dot: 'bg-status-active-text',  text: 'text-status-active-text' },
  'En revisión':  { dot: 'bg-status-review-text',  text: 'text-status-review-text' },
  'Vence pronto': { dot: 'bg-status-urgent-text',  text: 'text-status-urgent-text' },
}

interface StatusBadgeProps {
  estado: EstadoDisplay
}

export function StatusBadge({ estado }: StatusBadgeProps) {
  const { dot, text } = CONFIG[estado]
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {estado}
    </span>
  )
}
