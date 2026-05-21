import { useMutation } from '@tanstack/react-query'

interface ChatPayload {
  prompt: string
  file?: File | null
}

// ── Mock responses ────────────────────────────────────────────────────────────

const TEXT_RESPONSES = [
  'Según el análisis del expediente, las actuaciones procesales más urgentes son: responder el auto admisorio en los próximos 20 días hábiles y notificar al demandado según el artículo 291 del CGP. ¿Necesitás que redacte alguno de estos documentos?',
  'He revisado el historial de actuaciones. La fecha de vencimiento más próxima corresponde al expediente García vs. Constructora Los Andes: plazo de respuesta vence el 17 de junio. Te recomiendo priorizar esa actuación.',
  'Para generar el borrador de contestación necesito confirmar: ¿actuás como apoderado del demandado o del demandante? Con eso puedo adaptar el tono y los argumentos del escrito.',
]

function docResponse(filename: string): string {
  return (
    `Analicé el documento "${filename}". Se trata de un auto admisorio de demanda ordinaria de mayor cuantía.\n\n` +
    'Datos clave identificados:\n' +
    '• Juzgado: 3° Civil del Circuito de Bogotá\n' +
    '• Demandante: García y Asociados S.A.S.\n' +
    '• Demandado: Constructora Los Andes Ltda.\n' +
    '• Cuantía: $89.000.000\n' +
    '• Plazo de respuesta: 20 días hábiles\n\n' +
    '¿Querés que cree el expediente automáticamente o que redacte la contestación de demanda?'
  )
}

// ── TODO: reemplazar mutationFn por llamada real al backend ───────────────────
// POST /api/asistente/chat — multipart: prompt (string) + file (PDF, opcional)
// Responde: { respuesta: string }

async function enviarChat({ prompt, file }: ChatPayload): Promise<string> {
  await new Promise((r) => setTimeout(r, 1400))

  if (file) return docResponse(file.name)

  return TEXT_RESPONSES[Math.floor(Math.random() * TEXT_RESPONSES.length)]
}

export function useAssistenteChat() {
  return useMutation({ mutationFn: enviarChat })
}
