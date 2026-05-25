import { useState, useEffect, useRef } from 'react'
import { Plus, PencilSimple, Check, X } from '@phosphor-icons/react'
import type { Parte, TipoParticipacion } from '../../types'

const TIPOS: { value: TipoParticipacion; label: string }[] = [
  { value: 'DEMANDANTE', label: 'Demandante' },
  { value: 'DEMANDADO', label: 'Demandado' },
  { value: 'APODERADO', label: 'Apoderado' },
  { value: 'TERCERO', label: 'Tercero' },
]

interface PartesEditorProps {
  partes: Parte[]
  onChange: (partes: Parte[]) => void
}

export function PartesEditor({ partes, onChange }: PartesEditorProps) {
  const updateAt = (index: number, parte: Parte) => {
    onChange(partes.map((p, i) => (i === index ? parte : p)))
  }

  const removeAt = (index: number) => {
    onChange(partes.filter((_, i) => i !== index))
  }

  const addOfType = (tipo: TipoParticipacion) => {
    onChange([...partes, { nombre: '', tipoParticipacion: tipo }])
  }

  return (
    <div className="px-4 py-3 space-y-3 border-t border-border">
      <p className="text-[10px] uppercase tracking-wide text-fg-tertiary">Partes</p>
      {TIPOS.map(({ value, label }) => {
        const items = partes
          .map((parte, index) => ({ parte, index }))
          .filter(({ parte }) => parte.tipoParticipacion === value)

        return (
          <div key={value} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-fg-secondary">{label}</span>
              <button
                type="button"
                onClick={() => addOfType(value)}
                className="flex items-center gap-1 text-[11px] text-fg-secondary hover:text-fg-primary transition-colors"
              >
                <Plus />
                Agregar
              </button>
            </div>
            {items.map(({ parte, index }) => (
              <ParteRow
                key={`${value}-${index}`}
                parte={parte}
                onChange={(p) => updateAt(index, p)}
                onRemove={() => removeAt(index)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

interface ParteRowProps {
  parte: Parte
  onChange: (parte: Parte) => void
  onRemove: () => void
}

function ParteRow({ parte, onChange, onRemove }: ParteRowProps) {
  const [editing, setEditing] = useState(parte.nombre === '')
  const [draft, setDraft] = useState(parte.nombre)
  const [prevNombre, setPrevNombre] = useState(parte.nombre)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sincronizar draft con la prop sin caer en set-state-in-effect.
  if (parte.nombre !== prevNombre) {
    setPrevNombre(parte.nombre)
    setDraft(parte.nombre)
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = () => {
    onChange({ ...parte, nombre: draft.trim() })
    setEditing(false)
  }

  const cancel = () => {
    setDraft(parte.nombre)
    setEditing(false)
  }

  return (
    <div className="group flex items-start gap-1.5 px-2 py-1.5 rounded hover:bg-bg-subtle">
      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
            placeholder="Nombre"
            className="flex-1 min-w-0 text-sm text-fg-primary bg-bg-base border border-border rounded px-2 py-0.5 outline-none focus:border-border-strong"
          />
          <button
            type="button"
            onClick={commit}
            className="p-1 rounded text-cta-bg hover:bg-bg-muted transition-colors shrink-0"
          >
            <Check />
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p
              className={[
                'text-sm truncate',
                parte.nombre ? 'text-fg-body' : 'text-fg-tertiary italic',
              ].join(' ')}
            >
              {parte.nombre || 'sin nombre'}
            </p>
            {parte.identificacion && (
              <p className="text-[10px] text-fg-tertiary truncate">{parte.identificacion}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-fg-secondary transition-all shrink-0"
            aria-label="Editar"
          >
            <PencilSimple />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-fg-primary transition-all shrink-0"
            aria-label="Eliminar"
          >
            <X />
          </button>
        </>
      )}
    </div>
  )
}
