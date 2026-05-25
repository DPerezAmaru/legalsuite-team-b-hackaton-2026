import { useMutation } from '@tanstack/react-query'
import {
  ChatApiResponseSchema,
  type AccionChat,
  type ChatArchivo,
  type HistorialEntrada,
} from '../types'
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'

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

async function enviarChat({
  prompt,
  modoAsistente,
  historial,
  archivos,
  usuarioId,
}: ChatPayload): Promise<ChatResult> {
  const body: Record<string, unknown> = { prompt, modoAsistente, historial }
  if (archivos && archivos.length > 0) body.archivos = archivos

  const parsed = await request(apiEndpoints.chat.send(usuarioId), {
    method: 'POST',
    body,
    schema: ChatApiResponseSchema,
  })

  return {
    accion: parsed.accion,
    mensaje: parsed.mensaje,
    datos: parsed.datos ?? null,
    esperaRespuesta: parsed.esperaRespuesta ?? false,
  }
}

export function useAssistenteChat() {
  return useMutation({ mutationFn: enviarChat })
}
