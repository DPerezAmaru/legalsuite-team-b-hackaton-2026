import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className = '', id, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs text-fg-secondary">
          {label}
        </label>
      )}
      <select
        id={id}
        className={[
          'w-full text-sm text-fg-body bg-transparent',
          'border-b border-border focus:border-fg-primary outline-none',
          'py-1.5 transition-colors appearance-none cursor-pointer',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
