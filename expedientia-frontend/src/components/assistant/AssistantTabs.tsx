import { Sparkles, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AssistantTab } from '../../types'

interface TabItem {
  id: AssistantTab
  label: string
  icon: ReactNode
}

const TABS: TabItem[] = [
  { id: 'asistente', label: 'Asistente', icon: <Sparkles size={13} /> },
  { id: 'borrador',  label: 'Borrador',  icon: <FileText size={13} /> },
]

interface AssistantTabsProps {
  active: AssistantTab
  onChange: (tab: AssistantTab) => void
}

export function AssistantTabs({ active, onChange }: AssistantTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-border">
      <div className="flex items-center">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
              active === id
                ? 'border-fg-primary text-fg-primary'
                : 'border-transparent text-fg-tertiary hover:text-fg-body',
            ].join(' ')}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
      <p className="hidden md:block text-xs text-fg-tertiary pr-1 pb-1">
        Pregunte, redacte o resuma. Cite el expediente cuando sea útil.
      </p>
    </div>
  )
}
