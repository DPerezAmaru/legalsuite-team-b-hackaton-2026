import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TareaSchema, type EstadoTarea, type Prioridad } from '../types'

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

async function crearTarea(payload: CrearTareaPayload) {
  const res = await fetch('/api/tareas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return TareaSchema.parse(await res.json())
}

export function useCrearTarea(expedienteId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: crearTarea,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas', expedienteId] }),
  })
}
