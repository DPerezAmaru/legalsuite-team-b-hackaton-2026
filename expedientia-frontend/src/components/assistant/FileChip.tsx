import { FileTextIcon, XIcon, CircleNotchIcon } from '@phosphor-icons/react'

interface FileChipProps {
  file: File
  onRemove: () => void
  loading?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileChip({ file, onRemove, loading = false }: FileChipProps) {
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-base border border-border max-w-xs">
      {loading ? (
        <CircleNotchIcon className="text-fg-secondary shrink-0 animate-spin" />
      ) : (
        <FileTextIcon className="text-fg-secondary shrink-0" />
      )}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-xs font-medium text-fg-body truncate">{file.name}</span>
        <span className="text-[10px] text-fg-tertiary shrink-0">{formatBytes(file.size)}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={loading}
        className="p-0.5 rounded text-fg-tertiary hover:text-fg-secondary transition-colors shrink-0 disabled:opacity-40"
        aria-label="Quitar archivo"
      >
        <XIcon />
      </button>
    </div>
  )
}
