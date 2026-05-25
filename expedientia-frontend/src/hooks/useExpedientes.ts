import { useQuery } from '@tanstack/react-query'
import { ExpedientesListSchema } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

export function useExpedientes() {
  return useQuery({
    queryKey: ['expedientes'],
    queryFn: ({ signal }) =>
      request(apiEndpoints.expedientes.list, {
        schema: ExpedientesListSchema,
        signal,
      }),
  })
}
