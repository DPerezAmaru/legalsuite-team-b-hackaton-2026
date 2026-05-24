import { useMutation } from '@tanstack/react-query'
import { ChatApiResponseSchema, type HistorialEntrada } from '../types'

interface ChatPayload {
  prompt: string
  modoAsistente: boolean
  historial: HistorialEntrada[]
  file?: File | null
}

interface ChatResult {
  content: string
  actionLink?: { to: string; label: string }
}

function buildResult(accion: string, mensaje: string, datos?: unknown): ChatResult {
  const ACCION_CREA = accion === 'CREAR_EXPEDIENTE' || accion === 'ASISTENTE_CREACION'

  if (ACCION_CREA && typeof datos === 'object' && datos !== null && !Array.isArray(datos)) {
    const d = datos as Record<string, unknown>
    let content = mensaje

    if (d.radicado) {
      content =
        `${mensaje}\n\n` +
        `Radicado: ${d.radicado}\n` +
        `Título: ${d.titulo ?? '—'}\n` +
        `Especialidad: ${d.especialidad ?? '—'}`
    }

    const actionLink = typeof d.id === 'number'
      ? { to: `/expedientes/${d.id}`, label: 'Ver expediente' }
      : undefined

    return { content, actionLink }
  }

  return { content: mensaje }
}

async function enviarChat({ prompt, modoAsistente, historial }: ChatPayload): Promise<ChatResult> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modoAsistente, historial }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const json = await res.json()
  const parsed = ChatApiResponseSchema.parse(json)
  return buildResult(parsed.accion, parsed.mensaje, parsed.datos)
}

export function useAssistenteChat() {
  return useMutation({ mutationFn: enviarChat })
}
