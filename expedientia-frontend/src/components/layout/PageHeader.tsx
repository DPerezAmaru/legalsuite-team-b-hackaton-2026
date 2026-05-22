import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  meta?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, meta, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-fg-primary tracking-tight">
            {title}
          </h1>
          {meta}
        </div>
        {subtitle && <p className="mt-1 text-sm text-fg-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
