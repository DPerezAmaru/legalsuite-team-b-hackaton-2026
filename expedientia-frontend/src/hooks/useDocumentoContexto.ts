import { useMutation } from '@tanstack/react-query'
import { DocumentoContextoResponseSchema, type DocumentoContextoResponse } from '../types'

async function extraerContexto(file: File): Promise<DocumentoContextoResponse> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/documentos/contexto', { method: 'POST', body })

  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    throw new Error(
      `HTTP ${res.status} ${res.statusText} en /api/documentos/contexto${detalle ? ` — ${detalle.slice(0, 200)}` : ''}`,
    )
  }

  const json = await res.json()
  return DocumentoContextoResponseSchema.parse(json)
}

export function useDocumentoContexto() {
  return useMutation({ mutationFn: extraerContexto })
}
