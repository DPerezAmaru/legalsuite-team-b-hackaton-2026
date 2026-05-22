import { useQuery } from '@tanstack/react-query'
import { ExpedienteSchema } from '../types'

async function fetchExpediente(id: number) {
  const res = await fetch(`/api/expedientes/${id}`)
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudo cargar el expediente`)
  return ExpedienteSchema.parse(await res.json())
}

export function useExpediente(id: number) {
  return useQuery({
    queryKey: ['expedientes', id],
    queryFn: () => fetchExpediente(id),
    enabled: !!id,
  })
}
