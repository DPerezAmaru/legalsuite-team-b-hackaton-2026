import type { EstadoExpediente } from '../../types'

interface Config {
  dot: string
  text: string
  label: string
}

const CONFIG: Record<EstadoExpediente, Config> = {
  ACTIVO:    { dot: 'bg-green-500', text: 'text-green-700',  label: 'Activo' },
  CERRADO:   { dot: 'bg-gray-400',  text: 'text-gray-500',   label: 'Cerrado' },
  ARCHIVADO: { dot: 'bg-gray-400',  text: 'text-gray-500',   label: 'Archivado' },
}

interface EstadoBadgeProps {
  estado: EstadoExpediente
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const { dot, text, label } = CONFIG[estado]
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
