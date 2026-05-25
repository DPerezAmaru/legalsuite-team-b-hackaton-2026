import { useMutation } from '@tanstack/react-query'
import { DocumentoContextoResponseSchema } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

function buildFormData(file: File): FormData {
  const fd = new FormData()
  fd.append('file', file)
  return fd
}

export function useDocumentoContexto() {
  return useMutation({
    mutationFn: (file: File) =>
      request(apiEndpoints.documentos.contexto, {
        method: 'POST',
        body: buildFormData(file),
        schema: DocumentoContextoResponseSchema,
      }),
  })
}
