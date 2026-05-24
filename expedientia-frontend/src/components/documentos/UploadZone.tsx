import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { UploadSimple, FileText } from '@phosphor-icons/react'

const MAX_FILES = 5

interface UploadZoneProps {
  onFiles: (files: File[]) => void
}

export function UploadZone({ onFiles }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function pickPdfs(fileList: FileList | null): File[] {
    if (!fileList) return []
    return Array.from(fileList)
      .filter(f => f.type === 'application/pdf')
      .slice(0, MAX_FILES)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = pickPdfs(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = pickPdfs(e.target.files ?? null)
    if (files.length) onFiles(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={[
        'w-full flex flex-col items-center gap-4 px-8 py-12 rounded-2xl border-2 border-dashed cursor-pointer transition-colors',
        isDragging
          ? 'border-ai-border bg-ai-tint'
          : 'border-border hover:border-border-strong hover:bg-bg-subtle',
      ].join(' ')}
    >
      <div className="w-12 h-12 rounded-full bg-bg-muted flex items-center justify-center">
        <UploadSimple className="text-fg-secondary" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-fg-primary">
          {isDragging ? 'Soltá los PDFs acá' : 'Arrastrá uno o varios documentos acá'}
        </p>
        <p className="text-xs text-fg-tertiary">o hacé clic para seleccionarlos</p>
        <p className="text-xs text-fg-tertiary pt-1">Solo PDFs · hasta {MAX_FILES} archivos · máx. 10 MB c/u</p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-muted border border-border">
        <FileText className="text-fg-secondary shrink-0" />
        <span className="text-xs text-fg-body">Seleccionar PDFs</span>
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
