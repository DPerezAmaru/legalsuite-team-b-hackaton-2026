import { useState, useCallback, useEffect } from 'react'
import type { ChatMessage, HistorialEntrada } from '../../types'
import { AssistantInput } from './AssistantInput'
import { AssistantSuggestions } from './AssistantSuggestions'
import { DocumentUploadCard } from './DocumentUploadCard'
import { ChatMessages } from './ChatMessages'
import { useAssistenteChat } from '../../hooks/useAssistenteChat'
import { useCommandBar } from '../../store/commandBarStore'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function buildHistorial(messages: ChatMessage[]): HistorialEntrada[] {
  return messages.map(m => ({
    rol: m.role === 'user' ? 'usuario' : 'asistente',
    contenido: m.content,
  }))
}

export function AssistantPage() {
  const [inputValue, setInputValue] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [modoAsistente, setModoAsistente] = useState(false)

  const { mutateAsync: sendChat, isPending } = useAssistenteChat()
  const consumePendingPrompt = useCommandBar(s => s.consumePendingPrompt)

  const sendPrompt = useCallback(
    async (prompt: string, file: File | null) => {
      if (!prompt.trim() && !file) return

      const historialActual = buildHistorial(messages)

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        attachmentName: file?.name,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, userMsg])

      try {
        const response = await sendChat({ prompt, file, modoAsistente, historial: historialActual })
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.content,
            actionLink: response.actionLink,
            timestamp: new Date(),
          },
        ])
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Lo siento, no pude procesar tu consulta en este momento. Intentá de nuevo.',
            timestamp: new Date(),
          },
        ])
      }
    },
    [sendChat, messages, modoAsistente],
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

  const inputBar = (
    <AssistantInput
      value={inputValue}
      onChange={setInputValue}
      onSubmit={handleSubmit}
      attachedFile={attachedFile}
      onAttach={setAttachedFile}
      isLoading={isPending}
      modoAsistente={modoAsistente}
      onToggleModo={() => setModoAsistente(v => !v)}
    />
  )

  if (isChat) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <ChatMessages messages={messages} isLoading={isPending} />
          </div>
        </div>

        <div className="bg-bg-base">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-3">
            {inputBar}
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
          {inputBar}
          <AssistantSuggestions onSelect={setInputValue} />
          <DocumentUploadCard />
        </div>
      </div>
    </div>
  )
}
