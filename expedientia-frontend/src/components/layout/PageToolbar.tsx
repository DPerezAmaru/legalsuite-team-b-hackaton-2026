import type { ReactNode } from 'react'

interface PageToolbarProps {
  search?: ReactNode
  filters?: ReactNode
  className?: string
}

export function PageToolbar({ search, filters, className = '' }: PageToolbarProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 mb-4 ${className}`.trim()}
    >
      {search && <div className="flex-1 min-w-0">{search}</div>}
      {filters && <div className="shrink-0">{filters}</div>}
    </div>
  )
}
