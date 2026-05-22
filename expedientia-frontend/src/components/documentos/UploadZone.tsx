import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { UploadSimple, FileText } from '@phosphor-icons/react'

interface UploadZoneProps {
  onFile: (file: File) => void
}

export function UploadZone({ onFile }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') onFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'w-full max-w-lg flex flex-col items-center gap-4 px-8 py-16 rounded-2xl border-2 border-dashed cursor-pointer transition-colors',
          isDragging
            ? 'border-ai-border bg-ai-tint'
            : 'border-border hover:border-border-strong hover:bg-bg-subtle',
        ].join(' ')}
      >
        <div className="w-12 h-12 rounded-full bg-bg-muted flex items-center justify-center">
          <UploadSimple className="text-fg-secondary" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-fg-primary">Arrastrá el documento acá</p>
          <p className="text-xs text-fg-tertiary">o hacé clic para seleccionarlo</p>
          <p className="text-xs text-fg-tertiary pt-1">Solo archivos PDF · máx. 10 MB</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-muted border border-border">
          <FileText className="text-fg-secondary shrink-0" />
          <span className="text-xs text-fg-body">Seleccionar PDF</span>
        </div>
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
