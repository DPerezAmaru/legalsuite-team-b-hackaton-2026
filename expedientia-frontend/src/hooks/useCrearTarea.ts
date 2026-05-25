import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TareaSchema, type EstadoTarea, type Prioridad } from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

export interface CrearTareaPayload {
  titulo: string
  descripcion?: string
  estado: EstadoTarea
  prioridad: Prioridad
  fechaVencimiento?: string
  sugeridaPorIa: boolean
  expedienteId: number
  asignadoAId?: number
}

export function useCrearTarea(expedienteId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CrearTareaPayload) =>
      request(apiEndpoints.tareas.create, {
        method: 'POST',
        body: payload,
        schema: TareaSchema,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas', expedienteId] }),
  })
}
