import { useState } from 'react'
import type { ReactNode } from 'react'
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react'

interface AccordionSectionProps {
  title: string
  icon?: ReactNode
  badge?: ReactNode
  headerExtras?: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function AccordionSection({
  title,
  icon,
  badge,
  headerExtras,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: AccordionSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  function toggle() {
    if (isControlled) {
      onOpenChange?.(!open)
    } else {
      setInternalOpen(o => !o)
    }
  }

  return (
    <div className="border border-border rounded-xl bg-bg-base overflow-hidden">
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggle}
          className="flex-1 flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-bg-subtle transition-colors"
        >
          {open
            ? <CaretDownIcon className="text-fg-tertiary shrink-0" />
            : <CaretRightIcon className="text-fg-tertiary shrink-0" />}
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="flex-1 text-sm font-medium text-fg-primary">{title}</span>
          {badge}
        </button>
        {headerExtras}
      </div>

      {open && (
        <div className="border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}
