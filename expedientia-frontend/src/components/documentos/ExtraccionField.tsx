import { useState, useRef, useEffect } from 'react'
import { Pencil, Check } from 'lucide-react'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      selectRef.current?.focus()
    }
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

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
        'flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg group',
        highlight ? 'bg-ai-tint border border-ai-border' : 'hover:bg-bg-subtle',
      ].join(' ')}
    >
      <span
        className={[
          'text-xs w-28 shrink-0',
          highlight ? 'text-ai-text font-medium' : 'text-fg-tertiary',
        ].join(' ')}
      >
        {label}
      </span>

      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {options ? (
            <select
              ref={selectRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              className="flex-1 min-w-0 text-sm text-fg-primary bg-bg-base border border-border rounded px-2 py-0.5 outline-none focus:border-border-strong"
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
              className="flex-1 min-w-0 text-sm text-fg-primary bg-bg-base border border-border rounded px-2 py-0.5 outline-none focus:border-border-strong"
            />
          )}
          <button
            type="button"
            onClick={commit}
            className="p-1 rounded text-cta-bg hover:bg-bg-muted transition-colors"
          >
            <Check size={13} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className={[
              'flex-1 min-w-0 text-sm truncate',
              highlight ? 'text-ai-text font-medium' : 'text-fg-body',
              !value ? 'text-fg-tertiary italic' : '',
            ].join(' ')}
          >
            {value || '—'}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-fg-secondary transition-all shrink-0"
          >
            <Pencil size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
