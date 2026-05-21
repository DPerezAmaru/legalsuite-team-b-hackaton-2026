import type { ExpedienteReciente, Especialidad } from '../../types'
import { SectionHeader } from '../ui/SectionHeader'
import { StatusBadge } from '../ui/StatusBadge'

const ESPECIALIDAD_LABEL: Record<Especialidad, string> = {
  CIVIL:          'Civil',
  PENAL:          'Penal',
  LABORAL:        'Laboral',
  ADMINISTRATIVO: 'Administrativo',
  FAMILIA:        'Familia',
}

interface RecentExpedientesProps {
  items: ExpedienteReciente[]
  onVerTodos?: () => void
}

export function RecentExpedientes({ items, onVerTodos }: RecentExpedientesProps) {
  return (
    <section>
      <SectionHeader title="Expedientes recientes" linkLabel="Ver todos" onLink={onVerTodos} />
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 py-3 -mx-2 px-2 rounded-lg hover:bg-bg-subtle cursor-pointer transition-colors"
          >
            <span className="flex-1 text-sm text-fg-body truncate">{item.nombre}</span>
            <span className="hidden sm:block text-xs text-fg-tertiary shrink-0">
              {ESPECIALIDAD_LABEL[item.especialidad]}
            </span>
            <StatusBadge estado={item.estadoDisplay} />
            <span className="text-xs text-fg-tertiary shrink-0 w-16 text-right">{item.timestamp}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
