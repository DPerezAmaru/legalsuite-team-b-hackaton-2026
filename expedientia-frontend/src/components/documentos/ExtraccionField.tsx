import { useState, useRef, useEffect } from 'react'
import { PencilSimple, Check } from '@phosphor-icons/react'

interface ExtraccionFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  highlight?: boolean
  options?: readonly string[]
}

export function ExtraccionField({
  label,
  value,
  onChange,
  highlight = false,
  options,
}: ExtraccionFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  // Sincronizar draft cuando la prop value cambia desde afuera.
  // Patrón oficial React 19: ajustar state durante render con guard, no en effect.
  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(value)
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      selectRef.current?.focus()
    }
  }, [editing])

  const commit = () => {
    onChange(draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  return (
    <div
      className={[
        'px-4 py-2.5 rounded-lg group',
        highlight ? 'bg-ai-tint border border-ai-border' : 'hover:bg-bg-subtle',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            'text-xs font-medium',
            highlight ? 'text-ai-text' : 'text-fg-secondary',
          ].join(' ')}
        >
          {label}
        </span>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-fg-secondary transition-all shrink-0"
            aria-label={`Editar ${label}`}
          >
            <PencilSimple />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5 mt-1.5">
          {options ? (
            <select
              ref={selectRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              className="flex-1 min-w-0 text-sm text-fg-primary bg-bg-base border border-border rounded px-2 py-1 outline-none focus:border-border-strong"
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') cancel()
              }}
              className="flex-1 min-w-0 text-sm text-fg-primary bg-bg-base border border-border rounded px-2 py-1 outline-none focus:border-border-strong"
            />
          )}
          <button
            type="button"
            onClick={commit}
            className="p-1 rounded text-cta-bg hover:bg-bg-muted transition-colors shrink-0"
          >
            <Check />
          </button>
        </div>
      ) : (
        <p
          className={[
            'mt-1 text-sm break-words',
            highlight ? 'text-ai-text font-medium' : 'text-fg-body',
            !value ? 'text-fg-tertiary italic' : '',
          ].join(' ')}
        >
          {value || '—'}
        </p>
      )}
    </div>
  )
}
