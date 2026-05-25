import { useQuery } from '@tanstack/react-query'
import { TareasListSchema } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

export function useTodasTareas() {
  return useQuery({
    queryKey: ['tareas', 'todas'],
    queryFn: ({ signal }) =>
      request(apiEndpoints.tareas.todas, {
        schema: TareasListSchema,
        signal,
      }),
  })
}
