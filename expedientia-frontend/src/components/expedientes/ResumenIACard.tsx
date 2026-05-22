import { useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'

interface ResumenIACardProps {
  resumen: string | null | undefined
}

export function ResumenIACard({ resumen }: ResumenIACardProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!resumen) return
    navigator.clipboard.writeText(resumen).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl border border-ai-border bg-ai-tint p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-ai-text shrink-0" />
          <span className="text-sm font-semibold text-ai-text">Resumen IA</span>
        </div>
        {resumen && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-ai-text hover:bg-ai-border transition-colors"
            aria-label="Copiar resumen"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        )}
      </div>

      {resumen ? (
        <p className="text-sm text-fg-body leading-relaxed">{resumen}</p>
      ) : (
        <p className="text-sm text-fg-tertiary italic">
          Sin resumen generado. Podés pedirle al asistente que analice este expediente.
        </p>
      )}
    </div>
  )
}
