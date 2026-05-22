import { Sparkles } from 'lucide-react'

interface AssistantTabsProps {
  active?: string
}

export function AssistantTabs({ active: _ }: AssistantTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-border">
      <div className="flex items-center">
        <div className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 border-fg-primary text-fg-primary -mb-px">
          <Sparkles size={13} />
          Asistente
        </div>
      </div>
      <p className="hidden md:block text-xs text-fg-tertiary pr-1 pb-1">
        Pregunte o cree un expediente desde acá.
      </p>
    </div>
  )
}
