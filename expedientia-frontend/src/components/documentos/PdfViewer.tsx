import '../../lib/pdfWorker'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildRenderer(terms: string[]) {
  const active = terms.filter((t) => t && t.trim().length >= 4)
  if (!active.length) return ({ str }: { str: string }) => escapeHtml(str)

  const pattern = new RegExp(active.map(escapeRegex).join('|'), 'gi')

  return ({ str }: { str: string }) => {
    let result = ''
    let last = 0
    let match: RegExpExecArray | null
    pattern.lastIndex = 0

    while ((match = pattern.exec(str)) !== null) {
      result += escapeHtml(str.slice(last, match.index))
      result += `<mark>${escapeHtml(match[0])}</mark>`
      last = match.index + match[0].length
    }
    result += escapeHtml(str.slice(last))
    return result
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PdfViewerProps {
  file: File
  onReplace: () => void
  highlightValues?: string[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PdfViewer({ file, onReplace, highlightValues = [] }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [width, setWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onDocumentLoad = useCallback(({ numPages }: PDFDocumentProxy) => {
    setNumPages(numPages)
    setPage(1)
  }, [])

  const customTextRenderer = useCallback(
    buildRenderer(highlightValues),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [highlightValues.join('|')],
  )

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
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

      {/* PDF canvas */}
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-bg-subtle flex justify-center">
        {width > 0 && (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoad}
            loading={<LoadingPage />}
            error={<ErrorPage />}
          >
            <Page
              pageNumber={page}
              width={width - 32}
              renderTextLayer
              renderAnnotationLayer={false}
              customTextRenderer={customTextRenderer}
              className="my-4 shadow-sm"
            />
          </Document>
        )}
      </div>

      {/* Paginación */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 border-t border-border shrink-0">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1 rounded text-fg-secondary hover:text-fg-primary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-fg-secondary tabular-nums">
            Página {page} de {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            className="p-1 rounded text-fg-secondary hover:text-fg-primary disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <span className="text-xs text-fg-tertiary">Cargando documento...</span>
    </div>
  )
}

function ErrorPage() {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <span className="text-xs text-fg-tertiary">No se pudo cargar el documento.</span>
    </div>
  )
}
