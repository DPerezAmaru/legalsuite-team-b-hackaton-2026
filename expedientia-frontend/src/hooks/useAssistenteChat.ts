import { useMutation } from '@tanstack/react-query'
import { ChatApiResponseSchema } from '../types'

interface ChatPayload {
  prompt: string
  file?: File | null
}

function formatRespuesta(accion: string, mensaje: string, datos?: { radicado?: string; titulo?: string; especialidad?: string } | null): string {
  if (accion === 'CREAR_EXPEDIENTE' && datos) {
    return (
      `${mensaje}\n\n` +
      `Radicado: ${datos.radicado ?? '—'}\n` +
      `Título: ${datos.titulo ?? '—'}\n` +
      `Especialidad: ${datos.especialidad ?? '—'}`
    )
  }
  return mensaje
}

async function enviarChat({ prompt }: ChatPayload): Promise<string> {
  const res = await fetch('/api/expedientes/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const json = await res.json()
  const parsed = ChatApiResponseSchema.parse(json)
  return formatRespuesta(parsed.accion, parsed.mensaje, parsed.datos)
}

export function useAssistenteChat() {
  return useMutation({ mutationFn: enviarChat })
}
