import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BulkConfirmarResponseSchema, type BulkProceso } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

interface BulkConfirmarPayload {
  seleccionados: number[]
  procesos: BulkProceso[]
}

export function useDocumentosConfirmar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkConfirmarPayload) =>
      request(apiEndpoints.documentos.bulkConfirmar, {
        method: 'POST',
        body: payload,
        schema: BulkConfirmarResponseSchema,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedientes'] })
    },
  })
}
