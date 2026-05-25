import { useMutation } from '@tanstack/react-query'
import { ProcesarDocumentoResponseSchema } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

function buildFormData(files: File[]): FormData {
  const fd = new FormData()
  for (const file of files) fd.append('files', file)
  return fd
}

export function useDocumentoProcesar() {
  return useMutation({
    mutationFn: (files: File[]) =>
      request(apiEndpoints.documentos.bulkAnalizar, {
        method: 'POST',
        body: buildFormData(files),
        schema: ProcesarDocumentoResponseSchema,
      }),
  })
}
