import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExpedienteSchema, type CreateExpedientePayload, type Expediente } from '../types'

async function crearExpediente(payload: CreateExpedientePayload): Promise<Expediente> {
  const res = await fetch('/api/expedientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudo crear el expediente`)
  return ExpedienteSchema.parse(await res.json())
}

export function useCrearExpediente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearExpediente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedientes'] })
    },
  })
}
