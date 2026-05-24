import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TareaSchema, type EstadoTarea, type Prioridad } from '../types'

export interface ActualizarTareaPayload {
  id: number
  estado?: EstadoTarea
  prioridad?: Prioridad
}

async function actualizarTarea({ id, ...body }: ActualizarTareaPayload) {
  const res = await fetch(`/api/tareas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return TareaSchema.parse(await res.json())
}

export function useActualizarTarea(expedienteId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: actualizarTarea,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas', expedienteId] }),
  })
}
