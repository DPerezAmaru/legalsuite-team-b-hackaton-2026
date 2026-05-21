import { X } from 'lucide-react'

interface PdfViewerProps {
  file: File
  fileUrl: string
  onReplace: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PdfViewer({ file, fileUrl, onReplace }: PdfViewerProps) {
  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-fg-primary truncate">{file.name}</span>
          <span className="text-xs text-fg-tertiary shrink-0">{formatBytes(file.size)}</span>
        </div>
        <button
          type="button"
          onClick={onReplace}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-fg-secondary hover:text-fg-primary border border-border hover:border-border-strong rounded-lg transition-colors shrink-0"
        >
          <X size={12} />
          Reemplazar
        </button>
      </div>
      <div className="flex-1 overflow-hidden bg-bg-subtle">
        <iframe
          src={fileUrl}
          className="w-full h-full"
          title={file.name}
        />
      </div>
    </div>
  )
}
