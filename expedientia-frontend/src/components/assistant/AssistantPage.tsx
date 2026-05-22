import { useState, useCallback, useEffect } from 'react'
import type { ChatMessage, ConsultaReciente, ExpedienteReciente } from '../../types'
import { AssistantInput } from './AssistantInput'
import { AssistantSuggestions } from './AssistantSuggestions'
import { DocumentUploadCard } from './DocumentUploadCard'
import { RecentConsultations } from './RecentConsultations'
import { RecentExpedientes } from './RecentExpedientes'
import { ChatMessages } from './ChatMessages'
import { useAssistenteChat } from '../../hooks/useAssistenteChat'
import { useCommandBar } from '../../store/commandBarStore'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const CONSULTAS_MOCK: ConsultaReciente[] = [
  { id: '1', titulo: 'Resumir auto admisorio · García y Asoc.', tipo: 'Resumen',  timestamp: 'Hace 14 min' },
  { id: '2', titulo: '¿Qué actuaciones vencen esta semana?',    tipo: 'Consulta', timestamp: 'Hoy 09:12'  },
  { id: '3', titulo: 'Generar contestación · Constructora L.A.', tipo: 'Borrador', timestamp: 'Ayer'      },
  { id: '4', titulo: 'Informe de cartera por especialidad',      tipo: 'Informe',  timestamp: 'Lun'       },
]

const EXPEDIENTES_MOCK: ExpedienteReciente[] = [
  { id: '1', nombre: 'García y Asociados S.A.', especialidad: 'CIVIL',   estadoDisplay: 'Activo',       timestamp: 'hace 2 h' },
  { id: '2', nombre: 'Constructora Los Andes',  especialidad: 'CIVIL',   estadoDisplay: 'En revisión',  timestamp: 'hace 5 h' },
  { id: '3', nombre: 'Ramírez Mora, Carlos',    especialidad: 'LABORAL', estadoDisplay: 'Vence pronto', timestamp: '19 may'   },
]

export function AssistantPage() {
  const [inputValue, setInputValue] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const { mutateAsync: sendChat, isPending } = useAssistenteChat()
  const consumePendingPrompt = useCommandBar(s => s.consumePendingPrompt)

  const sendPrompt = useCallback(
    async (prompt: string, file: File | null) => {
      if (!prompt.trim() && !file) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        attachmentName: file?.name,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, userMsg])

      try {
        const response = await sendChat({ prompt, file })
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          },
        ])
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              'Lo siento, no pude procesar tu consulta en este momento. Intentá de nuevo.',
            timestamp: new Date(),
          },
        ])
      }
    },
    [sendChat],
  )

  const handleSubmit = useCallback(async () => {
    const prompt = inputValue
    const file = attachedFile
    setInputValue('')
    setAttachedFile(null)
    await sendPrompt(prompt, file)
  }, [inputValue, attachedFile, sendPrompt])

  useEffect(() => {
    const pending = consumePendingPrompt()
    if (pending) sendPrompt(pending, null)
  }, [consumePendingPrompt, sendPrompt])

  const isChat = messages.length > 0

  if (isChat) {
    return (
      <div className="flex flex-col h-full">
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <ChatMessages messages={messages} isLoading={isPending} />
          </div>
        </div>

        {/* Input fijo abajo */}
        <div className="border-t border-border bg-bg-base">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-3">
            <AssistantInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              attachedFile={attachedFile}
              onAttach={setAttachedFile}
              isLoading={isPending}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg-primary">
            {getGreeting()}, Juan.
          </h1>
        </div>

        <div className="space-y-3">
          <AssistantInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            attachedFile={attachedFile}
            onAttach={setAttachedFile}
            isLoading={isPending}
          />
          <AssistantSuggestions onSelect={setInputValue} />
          <DocumentUploadCard />
        </div>

        <RecentConsultations items={CONSULTAS_MOCK} />
        <RecentExpedientes   items={EXPEDIENTES_MOCK} />

      </div>
    </div>
  )
}
