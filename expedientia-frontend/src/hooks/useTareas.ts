import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { TareaSchema } from '../types'

async function fetchTareas(expedienteId: number) {
  const res = await fetch(`/api/tareas?expedienteId=${expedienteId}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const json = await res.json()
  return z.array(TareaSchema).parse(json)
}

export function useTareas(expedienteId: number) {
  return useQuery({
    queryKey: ['tareas', expedienteId],
    queryFn: () => fetchTareas(expedienteId),
  })
}
