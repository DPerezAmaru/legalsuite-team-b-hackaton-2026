import { useMutation } from '@tanstack/react-query'
import { DocumentoExtraidoSchema, type DocumentoExtraido } from '../types'

async function procesarDocumento(file: File): Promise<DocumentoExtraido> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/documentos/procesar', { method: 'POST', body })
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudo procesar el documento`)
  return DocumentoExtraidoSchema.parse(await res.json())
}

export function useDocumentoProcesar() {
  return useMutation({ mutationFn: procesarDocumento })
}
