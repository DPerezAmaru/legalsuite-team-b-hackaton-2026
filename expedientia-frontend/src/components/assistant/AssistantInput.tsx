import { useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { Paperclip, Brain, ArrowRight } from '@phosphor-icons/react'
import { FileChip } from './FileChip'

const PLACEHOLDER = 'Pregunte, suba un documento o genere un borrador.'

interface AssistantInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  attachedFile?: File | null
  onAttach?: (file: File | null) => void
  isLoading?: boolean
  modoAsistente?: boolean
  onToggleModo?: () => void
}

export function AssistantInput({
  value,
  onChange,
  onSubmit,
  attachedFile,
  onAttach,
  isLoading = false,
  modoAsistente = false,
  onToggleModo,
}: AssistantInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0]
    if (file) onAttach?.(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSubmit = (value.trim().length > 0 || !!attachedFile) && !isLoading

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg-muted">
      {attachedFile && onAttach && (
        <div className="px-3 pt-3">
          <FileChip file={attachedFile} onRemove={() => onAttach(null)} />
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER}
        rows={3}
        disabled={isLoading}
        className="w-full px-4 pt-4 pb-2 text-sm text-fg-primary placeholder:text-fg-tertiary resize-none outline-none bg-transparent font-sans disabled:opacity-60"
        style={{ minHeight: '84px' }}
      />

      <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border bg-bg-muted">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-fg-secondary hover:text-fg-body hover:bg-bg-muted transition-colors"
          >
            <Paperclip />
            <span className="hidden sm:inline">Adjuntar</span>
          </button>
          <button
            type="button"
            onClick={onToggleModo}
            className={[
              'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors',
              modoAsistente
                ? 'bg-cta-bg text-cta-text hover:bg-cta-hover'
                : 'text-fg-secondary hover:text-fg-body hover:bg-bg-muted',
            ].join(' ')}
          >
            <Brain />
            <span className="hidden sm:inline">{modoAsistente ? 'Asistente' : 'Conversacional'}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="p-2 rounded-lg bg-cta-bg text-cta-text hover:bg-cta-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Consultar"
        >
          <ArrowRight />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
