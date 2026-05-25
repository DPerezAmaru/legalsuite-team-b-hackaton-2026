import { useQuery } from '@tanstack/react-query'
import { ExpedienteSchema } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

export function useExpediente(id: number) {
  return useQuery({
    queryKey: ['expedientes', id],
    queryFn: ({ signal }) =>
      request(apiEndpoints.expedientes.detail(id), {
        schema: ExpedienteSchema,
        signal,
      }),
    enabled: !!id,
  })
}
