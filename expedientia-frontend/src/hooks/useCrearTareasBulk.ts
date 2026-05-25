import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface CrearTareaPayload {
  expedienteId: number
  tareas: { texto: string; prioridad: 'ALTA' | 'MEDIA' | 'BAJA' }[]
}

async function crearTareasBulk(payload: CrearTareaPayload[]): Promise<void> {
  await Promise.all(
    payload.flatMap(({ expedienteId, tareas }) =>
      tareas.map(t =>
        fetch('/api/tareas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: t.texto,
            prioridad: t.prioridad,
            estado: 'PENDIENTE',
            sugeridaPorIa: true,
            expedienteId,
          }),
        }).then(res => { if (!res.ok) throw new Error(`Error ${res.status}`) }),
      ),
    ),
  )
}

export function useCrearTareasBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: crearTareasBulk,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas'] }),
  })
}
