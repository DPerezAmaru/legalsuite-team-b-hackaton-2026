import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TareaSchema, type EstadoTarea, type Prioridad } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

export interface ActualizarTareaPayload {
  id: number
  estado?: EstadoTarea
  prioridad?: Prioridad
}

export function useActualizarTarea(expedienteId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: ActualizarTareaPayload) =>
      request(apiEndpoints.tareas.update(id), {
        method: 'PUT',
        body,
        schema: TareaSchema,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas', expedienteId] }),
  })
}
