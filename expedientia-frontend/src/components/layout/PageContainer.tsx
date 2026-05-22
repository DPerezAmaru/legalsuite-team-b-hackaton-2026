import type { ReactNode } from 'react'

type Variant = 'full' | 'reading'

interface PageContainerProps {
  children: ReactNode
  variant?: Variant
  className?: string
}

const widths: Record<Variant, string> = {
  full: '',
  reading: 'max-w-3xl',
}

export function PageContainer({
  children,
  variant = 'full',
  className = '',
}: PageContainerProps) {
  const width = widths[variant]
  return (
    <div className={`${width} mx-auto px-4 sm:px-6 py-6 sm:py-10 ${className}`.trim()}>
      {children}
    </div>
  )
}
