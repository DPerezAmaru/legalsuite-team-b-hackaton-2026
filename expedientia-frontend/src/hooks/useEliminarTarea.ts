import { useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

export function useEliminarTarea(expedienteId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      request(apiEndpoints.tareas.remove(id), { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas', expedienteId] }),
  })
}
