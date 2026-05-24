import { useMutation, useQueryClient } from '@tanstack/react-query'

async function eliminarTarea(id: number) {
  const res = await fetch(`/api/tareas/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export function useEliminarTarea(expedienteId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eliminarTarea,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tareas', expedienteId] }),
  })
}
