import { useState, useCallback, useEffect } from 'react'
import type { ChatArchivo, ChatMessage, HistorialEntrada } from '../../types'
import { AssistantInput } from './AssistantInput'
import { AssistantSuggestions } from './AssistantSuggestions'
import { DocumentUploadCard } from './DocumentUploadCard'
import { ChatMessages } from './ChatMessages'
import { useAssistenteChat } from '../../hooks/useAssistenteChat'
import { useDocumentoContexto } from '../../hooks/useDocumentoContexto'
import { useCommandBar } from '../../store/commandBarStore'
import { useUsuarioStore } from '../../store/usuarioStore'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function buildHistorial(messages: ChatMessage[]): HistorialEntrada[] {
  return messages.map((m) => ({
    rol: m.role,
    contenido: m.content,
  }))
}

export function AssistantPage() {
  const [inputValue, setInputValue] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [archivoContexto, setArchivoContexto] = useState<ChatArchivo | null>(null)
  const [attachError, setAttachError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [modoAsistente, setModoAsistente] = useState(true)

  const { mutateAsync: sendChat, isPending: isChatPending } = useAssistenteChat()
  const { mutateAsync: extraerContexto, isPending: isExtracting } = useDocumentoContexto()
  const consumePendingPrompt = useCommandBar((s) => s.consumePendingPrompt)
  const usuarioId = useUsuarioStore((s) => s.usuarioId)

  const handleAttach = useCallback(
    async (file: File | null) => {
      setAttachError(null)
      if (!file) {
        setAttachedFile(null)
        setArchivoContexto(null)
        return
      }
      setAttachedFile(file)
      try {
        const res = await extraerContexto(file)
        if (res.error || !res.contenido) {
          setAttachError(res.error ?? 'No se pudo procesar el documento')
          setAttachedFile(null)
          setArchivoContexto(null)
          return
        }
        setArchivoContexto({ nombreDocumento: res.nombreDocumento, contenido: res.contenido })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al procesar el documento'
        setAttachError(msg)
        setAttachedFile(null)
        setArchivoContexto(null)
      }
    },
    [extraerContexto],
  )

  const sendPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim()
      if (!trimmed && !archivoContexto) return

      const historialActual = buildHistorial(messages)
      const archivos = archivoContexto ? [archivoContexto] : undefined

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        attachmentName: archivoContexto?.nombreDocumento,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])

      try {
        const response = await sendChat({
          prompt: trimmed,
          modoAsistente,
          historial: historialActual,
          archivos,
          usuarioId,
        })
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.mensaje,
            accion: response.accion,
            datos: response.datos,
            timestamp: new Date(),
          },
        ])
      } catch {
        setMessages((prev) => [
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
    [sendChat, messages, modoAsistente, archivoContexto, usuarioId],
  )

  const handleSubmit = useCallback(async () => {
    const prompt = inputValue
    setInputValue('')
    await sendPrompt(prompt)
  }, [inputValue, sendPrompt])

  useEffect(() => {
    const pending = consumePendingPrompt()
    if (!pending) return
    // Defer al microtask siguiente: sendPrompt dispara setState y la regla
    // react-hooks/set-state-in-effect lo prohíbe dentro del cuerpo del effect.
    const id = setTimeout(() => sendPrompt(pending), 0)
    return () => clearTimeout(id)
  }, [consumePendingPrompt, sendPrompt])

  const isPending = isChatPending || isExtracting
  const isChat = messages.length > 0

  const inputBar = (
    <AssistantInput
      value={inputValue}
      onChange={setInputValue}
      onSubmit={handleSubmit}
      attachedFile={attachedFile}
      onAttach={handleAttach}
      attachError={attachError}
      isExtracting={isExtracting}
      isLoading={isPending}
      modoAsistente={modoAsistente}
      onToggleModo={() => setModoAsistente((v) => !v)}
    />
  )

  if (isChat) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <ChatMessages messages={messages} isLoading={isChatPending} />
          </div>
        </div>

        <div className="bg-bg-base">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-3">{inputBar}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg-primary">
            {getGreeting()}, Daniel
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
