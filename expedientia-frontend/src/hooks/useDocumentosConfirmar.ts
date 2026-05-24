import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BulkConfirmarResponseSchema, type BulkConfirmarResponse, type BulkProceso } from '../types'

interface BulkConfirmarPayload {
  seleccionados: number[]
  procesos: BulkProceso[]
}

async function confirmarBulk(payload: BulkConfirmarPayload): Promise<BulkConfirmarResponse> {
  const res = await fetch('/api/documentos/bulk/confirmar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudieron crear los expedientes`)
  return BulkConfirmarResponseSchema.parse(await res.json())
}

export function useDocumentosConfirmar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmarBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedientes'] })
    },
  })
}
