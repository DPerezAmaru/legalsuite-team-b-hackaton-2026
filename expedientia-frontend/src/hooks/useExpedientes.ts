import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { ExpedienteSchema } from '../types'

async function fetchExpedientes() {
  const res = await fetch('/api/expedientes')
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudieron cargar los expedientes`)
  return z.array(ExpedienteSchema).parse(await res.json())
}

export function useExpedientes() {
  return useQuery({
    queryKey: ['expedientes'],
    queryFn: fetchExpedientes,
  })
}
