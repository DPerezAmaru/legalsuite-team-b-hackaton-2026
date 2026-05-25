import { useState, useRef, useEffect, useCallback } from 'react'
import { Robot, X, ArrowRight } from '@phosphor-icons/react'
import type { ChatMessage, HistorialEntrada } from '../../types'
import { useAssistenteChat } from '../../hooks/useAssistenteChat'
import { ChatMessages } from '../assistant/ChatMessages'

interface ExpedienteChatProps {
  expedienteId: number
  radicado: string
  nombre: string
}

function buildHistorial(messages: ChatMessage[]): HistorialEntrada[] {
  return messages.map(m => ({
    rol: m.role === 'user' ? 'usuario' : 'asistente',
    contenido: m.content,
  }))
}

export function ExpedienteChat({ expedienteId, radicado, nombre }: ExpedienteChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const { mutateAsync: sendChat, isPending } = useAssistenteChat()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isPending) return

    const prompt = `${text} (expediente ID: ${expedienteId}, nombre: "${nombre}")`
    const historialActual = buildHistorial(messages)

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setInput('')
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await sendChat({ prompt, modoAsistente: false, historial: historialActual })
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
          content: 'No pude procesar tu consulta. Intentá de nuevo.',
          timestamp: new Date(),
        },
      ])
    }
  }, [input, isPending, messages, expedienteId, sendChat])

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Abrir asistente del expediente"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-cta-bg text-cta-text shadow-lg hover:bg-cta-hover transition-colors"
      >
        <Robot size={20} />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-40 w-80 sm:w-96 flex flex-col bg-bg-base border border-border rounded-2xl shadow-2xl"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <Robot size={15} className="text-ai-text shrink-0" />
            <span className="text-sm font-medium text-fg-primary flex-1">Asistente</span>
            <span className="text-xs text-fg-tertiary font-mono">{radicado}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded text-fg-tertiary hover:text-fg-primary hover:bg-bg-muted transition-colors ml-1"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <p className="text-sm text-fg-tertiary text-center mt-8 leading-relaxed">
                Preguntame sobre este expediente.<br />
                <span className="text-xs">Tareas, partes, fechas, resumen…</span>
              </p>
            ) : (
              <ChatMessages messages={messages} isLoading={isPending} />
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border px-4 py-3 shrink-0 flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Preguntá sobre este expediente…"
              disabled={isPending}
              className="flex-1 text-sm text-fg-primary placeholder:text-fg-tertiary bg-transparent border-b border-border focus:border-fg-primary outline-none py-1 transition-colors disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isPending}
              className="p-1.5 rounded bg-cta-bg text-cta-text hover:bg-cta-hover transition-colors disabled:opacity-40 shrink-0"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
