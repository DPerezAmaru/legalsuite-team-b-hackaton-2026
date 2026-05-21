import { useRef, useEffect } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Paperclip, Folder, Scale, ArrowRight } from 'lucide-react'
import type { AssistantTab } from '../../types'

interface AssistantInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  tab: AssistantTab
}

const PLACEHOLDER: Record<AssistantTab, string> = {
  asistente: 'Pregunte, suba un documento o genere un borrador.',
  borrador:  'Describa el documento que necesita redactar.',
}

export function AssistantInput({ value, onChange, onSubmit, tab }: AssistantInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg-muted">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER[tab]}
        rows={3}
        className="w-full px-4 pt-4 pb-2 text-sm text-fg-primary placeholder:text-fg-tertiary resize-none outline-none bg-transparent font-sans"
        style={{ minHeight: '84px' }}
      />

      <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border bg-bg-muted">
        <div className="flex items-center gap-0.5">
          <InputAction icon={<Paperclip size={13} />} label="Adjuntar" />
          <InputAction icon={<Folder size={13} />} label="Expediente" />
          <InputAction icon={<Scale size={13} />} label="Base normativa" />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cta-bg text-cta-text hover:bg-cta-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Consultar
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

interface InputActionProps {
  icon: ReactNode
  label: string
}

function InputAction({ icon, label }: InputActionProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-fg-secondary hover:text-fg-body hover:bg-bg-muted transition-colors"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
