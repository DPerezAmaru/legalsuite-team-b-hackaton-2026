import type { ConsultaReciente } from '../../types'
import { SectionHeader } from '../ui/SectionHeader'

interface RecentConsultationsProps {
  items: ConsultaReciente[]
  onVerTodas?: () => void
}

export function RecentConsultations({ items, onVerTodas }: RecentConsultationsProps) {
  return (
    <section>
      <SectionHeader title="Consultas recientes" linkLabel="Ver todas" onLink={onVerTodas} />
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 py-3 -mx-2 px-2 rounded-lg hover:bg-bg-subtle cursor-pointer transition-colors"
          >
            <span className="flex-1 text-sm text-fg-body truncate">{item.titulo}</span>
            <span className="hidden sm:block text-xs text-fg-tertiary shrink-0 w-16 text-right">{item.tipo}</span>
            <span className="text-xs text-fg-tertiary shrink-0 w-20 text-right">{item.timestamp}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
