import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { FileText } from '@phosphor-icons/react'
import { useNavigate } from '@tanstack/react-router'
import { useDocumentosStore } from '../../store/documentosStore'

export function DocumentUploadCard() {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const setPendingFile = useDocumentosStore(s => s.setPendingFile)
  const navigate = useNavigate()

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') return
    setPendingFile(file)
    navigate({ to: '/documentos/' })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={[
        'flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-colors',
        isDragging
          ? 'border-ai-border bg-ai-tint'
          : 'border-border bg-bg-subtle hover:border-border-strong hover:bg-bg-muted',
      ].join(' ')}
    >
      <div className="shrink-0 w-8 h-8 rounded-lg bg-bg-muted border border-border flex items-center justify-center">
        <FileText className="text-fg-secondary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg-primary leading-tight">
          Crear expediente desde documento
        </p>
        <p className="text-xs text-fg-tertiary mt-0.5">
          {isDragging ? 'Soltá el PDF acá' : 'Arrastrá un PDF o hacé clic para seleccionarlo'}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
