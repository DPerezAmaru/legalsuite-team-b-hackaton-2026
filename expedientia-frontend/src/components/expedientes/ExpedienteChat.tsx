import { useState, useRef, useEffect, useCallback } from 'react'
import { Brain, X, ArrowRight, Paperclip, CircleNotch, Warning } from '@phosphor-icons/react'
import type { ChatArchivo, ChatMessage, HistorialEntrada } from '../../types'
import { useAssistenteChat } from '../../hooks/useAssistenteChat'
import { useDocumentoContexto } from '../../hooks/useDocumentoContexto'
import { useUsuarioStore } from '../../store/usuarioStore'
import { ChatMessages } from '../assistant/ChatMessages'
import { FileChip } from '../assistant/FileChip'

interface ExpedienteChatProps {
  expedienteId: number
  radicado: string
  nombre: string
}

function buildHistorial(messages: ChatMessage[]): HistorialEntrada[] {
  return messages.map((m) => ({ rol: m.role, contenido: m.content }))
}

export function ExpedienteChat({ expedienteId, radicado, nombre }: ExpedienteChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [archivoContexto, setArchivoContexto] = useState<ChatArchivo | null>(null)
  const [attachError, setAttachError] = useState<string | null>(null)

  const { mutateAsync: sendChat, isPending } = useAssistenteChat()
  const { mutateAsync: extraerContexto, isPending: isExtracting } = useDocumentoContexto()
  const usuarioId = useUsuarioStore((s) => s.usuarioId)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleAttach = useCallback(
    async (file: File) => {
      setAttachError(null)
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

  const clearAttach = () => {
    setAttachedFile(null)
    setArchivoContexto(null)
    setAttachError(null)
  }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if ((!text && !archivoContexto) || isPending) return

    // Aporta el contexto del expediente en el primer turno como pista a la IA.
    // En turnos siguientes el historial ya lo lleva.
    const esPrimerTurno = messages.length === 0
    const prompt = esPrimerTurno
      ? `${text}\n\n(contexto: expediente "${nombre}", radicado ${radicado}, id ${expedienteId})`
      : text

    const historialActual = buildHistorial(messages)
    const archivos = archivoContexto ? [archivoContexto] : undefined

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachmentName: archivoContexto?.nombreDocumento,
      timestamp: new Date(),
    }

    setInput('')
    setMessages((prev) => [...prev, userMsg])

    try {
      const response = await sendChat({
        prompt,
        modoAsistente: false,
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
          content: 'No pude procesar tu consulta. Intentá de nuevo.',
          timestamp: new Date(),
        },
      ])
    }
  }, [input, isPending, messages, expedienteId, radicado, nombre, archivoContexto, sendChat, usuarioId])

  const canSend = (input.trim().length > 0 || !!archivoContexto) && !isPending && !isExtracting

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir asistente del expediente"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-cta-bg text-cta-text shadow-lg hover:bg-cta-hover transition-colors"
      >
        <Brain size={20} />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-40 w-80 sm:w-96 flex flex-col bg-bg-base border border-border rounded-2xl shadow-2xl"
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <Brain size={15} className="text-ai-text shrink-0" />
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
                Preguntame sobre este expediente.
                <br />
                <span className="text-xs">Tareas, partes, fechas, resumen…</span>
              </p>
            ) : (
              <ChatMessages messages={messages} isLoading={isPending} />
            )}
          </div>

          {/* Adjunto */}
          {(attachedFile || attachError) && (
            <div className="px-4 pt-2 shrink-0 space-y-1">
              {attachedFile && (
                <FileChip file={attachedFile} onRemove={clearAttach} loading={isExtracting} />
              )}
              {attachError && (
                <div className="flex items-center gap-1.5 text-xs text-status-urgent-text">
                  <Warning size={12} />
                  <span>{attachError}</span>
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border px-4 py-3 shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className="p-1.5 rounded text-fg-tertiary hover:text-fg-primary hover:bg-bg-muted transition-colors disabled:opacity-50"
              aria-label="Adjuntar PDF"
            >
              {isExtracting ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <Paperclip size={14} />
              )}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
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
              disabled={!canSend}
              className="p-1.5 rounded bg-cta-bg text-cta-text hover:bg-cta-hover transition-colors disabled:opacity-40 shrink-0"
            >
              <ArrowRight size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAttach(file)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
