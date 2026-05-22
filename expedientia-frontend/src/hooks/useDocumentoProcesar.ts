import { useMutation } from '@tanstack/react-query'
import { ProcesarDocumentoResponseSchema, type ProcesarDocumentoResponse } from '../types'

const USUARIO_ID_MOCK = '1'

async function procesarDocumento(file: File): Promise<ProcesarDocumentoResponse> {
  const body = new FormData()
  body.append('file', file)
  body.append('usuarioId', USUARIO_ID_MOCK)
  const res = await fetch('/api/documentos/procesar', { method: 'POST', body })
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudo procesar el documento`)
  return ProcesarDocumentoResponseSchema.parse(await res.json())
}

export function useDocumentoProcesar() {
  return useMutation({ mutationFn: procesarDocumento })
}
