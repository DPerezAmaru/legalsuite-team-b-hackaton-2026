import { useMutation } from '@tanstack/react-query'
import { ProcesarDocumentoResponseSchema, type ProcesarDocumentoResponse } from '../types'

async function analizarDocumentos(files: File[]): Promise<ProcesarDocumentoResponse> {
  const body = new FormData()
  for (const file of files) body.append('files', file)
  const res = await fetch('/api/documentos/bulk/analizar', { method: 'POST', body })
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudo analizar los documentos`)
  return ProcesarDocumentoResponseSchema.parse(await res.json())
}

export function useDocumentoProcesar() {
  return useMutation({ mutationFn: analizarDocumentos })
}
