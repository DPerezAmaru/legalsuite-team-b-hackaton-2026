import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRightIcon, SparkleIcon } from '@phosphor-icons/react'
import { useCommandBar } from '../../store/commandBarStore'

export function CommandBar() {
  const navigate = useNavigate()
  const { isOpen, open, close, toggle, setPendingPrompt } = useCommandBar()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
        return
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, toggle, close, open])

  useEffect(() => {
    if (isOpen) {
      // delay focus to next tick so the input is mounted
      requestAnimationFrame(() => textareaRef.current?.focus())
    } else {
      setValue('')
    }
  }, [isOpen])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  function submit() {
    const text = value.trim()
    if (!text) return
    setPendingPrompt(text)
    close()
    navigate({ to: '/' })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-60 flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Asistente — preguntá lo que quieras"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-bg-base border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 text-xs text-fg-tertiary">
          <SparkleIcon />
          <span>Preguntá al asistente</span>
          <span className="ml-auto font-mono text-[10px] tracking-wide">Esc</span>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Resumime el caso García, generá un borrador de contestación…"
          rows={2}
          className="w-full px-4 pt-3 pb-2 text-[15px] text-fg-primary placeholder:text-fg-tertiary resize-none outline-none bg-transparent font-sans"
          style={{ minHeight: '60px' }}
        />

        <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border bg-bg-subtle">
          <span className="text-[11px] text-fg-tertiary px-1">
            Enter para enviar · Shift+Enter para salto de línea
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cta-bg text-cta-text text-xs font-medium hover:bg-cta-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enviar
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
