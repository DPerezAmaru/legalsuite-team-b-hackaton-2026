import { useMutation } from '@tanstack/react-query'
import {
  ChatApiResponseSchema,
  type AccionChat,
  type ChatApiResponse,
  type ChatArchivo,
  type HistorialEntrada,
} from '../types'

interface ChatPayload {
  prompt: string
  modoAsistente: boolean
  historial: HistorialEntrada[]
  archivos?: ChatArchivo[]
  usuarioId?: number | null
}

export interface ChatResult {
  accion: AccionChat | string
  mensaje: string
  datos: unknown
  esperaRespuesta: boolean
}

function toResult(parsed: ChatApiResponse): ChatResult {
  return {
    accion: parsed.accion,
    mensaje: parsed.mensaje,
    datos: parsed.datos ?? null,
    esperaRespuesta: parsed.esperaRespuesta ?? false,
  }
}

async function enviarChat({
  prompt,
  modoAsistente,
  historial,
  archivos,
  usuarioId,
}: ChatPayload): Promise<ChatResult> {
  const url = usuarioId ? `/api/chat?usuarioId=${usuarioId}` : '/api/chat'
  const body: Record<string, unknown> = { prompt, modoAsistente, historial }
  if (archivos && archivos.length > 0) body.archivos = archivos

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const json = await res.json()
  const parsed = ChatApiResponseSchema.parse(json)
  return toResult(parsed)
}

export function useAssistenteChat() {
  return useMutation({ mutationFn: enviarChat })
}
