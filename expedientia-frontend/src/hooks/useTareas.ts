import { useQuery } from '@tanstack/react-query'
import { TareasListSchema } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

export function useTareas(expedienteId: number) {
  return useQuery({
    queryKey: ['tareas', expedienteId],
    queryFn: ({ signal }) =>
      request(apiEndpoints.tareas.porExpediente(expedienteId), {
        schema: TareasListSchema,
        signal,
      }),
  })
}
