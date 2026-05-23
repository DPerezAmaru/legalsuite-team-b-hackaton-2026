import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { FileText } from '@phosphor-icons/react'
import { useNavigate } from '@tanstack/react-router'
import { useDocumentosStore } from '../../store/documentosStore'

const MAX_FILES = 5

export function DocumentUploadCard() {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const setPendingFiles = useDocumentosStore(s => s.setPendingFiles)
  const navigate = useNavigate()

  function pickPdfs(fileList: FileList | null): File[] {
    if (!fileList) return []
    return Array.from(fileList)
      .filter(f => f.type === 'application/pdf')
      .slice(0, MAX_FILES)
  }

  const handleFiles = (files: File[]) => {
    if (!files.length) return
    setPendingFiles(files)
    navigate({ to: '/expedientes/desde-documento' })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(pickPdfs(e.dataTransfer.files))
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(pickPdfs(e.target.files ?? null))
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
          {isDragging ? 'Soltá los PDFs acá' : 'Arrastrá hasta 5 PDFs o hacé clic para seleccionarlos'}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
