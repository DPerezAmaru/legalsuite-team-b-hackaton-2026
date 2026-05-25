import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { TareaSchema } from '../types'

async function fetchTodasTareas() {
  const res = await fetch('/api/tareas/todas')
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return z.array(TareaSchema).parse(await res.json())
}

export function useTodasTareas() {
  return useQuery({
    queryKey: ['tareas', 'todas'],
    queryFn: fetchTodasTareas,
  })
}
