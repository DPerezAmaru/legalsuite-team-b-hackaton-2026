import { useState } from 'react'
import type { ReactNode } from 'react'
import { CaretDown, CaretRight } from '@phosphor-icons/react'

interface AccordionSectionProps {
  title: string
  icon?: ReactNode
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export function AccordionSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-xl bg-bg-base overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-bg-subtle transition-colors"
      >
        {open
          ? <CaretDown className="text-fg-tertiary shrink-0" />
          : <CaretRight className="text-fg-tertiary shrink-0" />}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 text-sm font-medium text-fg-primary">{title}</span>
        {badge}
      </button>

      {open && (
        <div className="border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}
