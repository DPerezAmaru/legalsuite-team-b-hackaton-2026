import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs text-fg-secondary">
          {label}
        </label>
      )}
      <input
        id={id}
        className={[
          'w-full text-sm text-fg-primary placeholder:text-fg-tertiary bg-transparent',
          'border-b border-border focus:border-fg-primary outline-none',
          'py-1.5 transition-colors',
          className,
        ].join(' ')}
        {...props}
      />
    </div>
  )
}
