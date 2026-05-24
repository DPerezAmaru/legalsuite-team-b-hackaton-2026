import { useMutation } from '@tanstack/react-query'

export interface CrearTareaPayload {
  expedienteId: number
  tareas: { texto: string; prioridad: 'ALTA' | 'MEDIA' | 'BAJA' }[]
}

// TODO: replace with real API call when backend is ready
// POST /api/tareas/bulk
async function crearTareasBulk(payload: CrearTareaPayload[]): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  console.log('[mock] Tareas a crear:', payload)
}

export function useCrearTareasBulk() {
  return useMutation({ mutationFn: crearTareasBulk })
}
