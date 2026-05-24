import { useEffect, useRef } from 'react'
import { FileText, Sparkle, ArrowSquareOut } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type { ChatMessage } from '../../types'

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={['flex gap-3', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-ai-tint border border-ai-border flex items-center justify-center shrink-0 mt-0.5">
          <Sparkle className="text-ai-text" />
        </div>
      )}

      <div className={['max-w-[80%] space-y-1.5', isUser ? 'items-end' : 'items-start'].join(' ')}>
        {isUser && message.attachmentName && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-muted border border-border text-xs text-fg-secondary">
              <FileText />
              <span className="truncate max-w-[160px]">{message.attachmentName}</span>
            </div>
          </div>
        )}

        {message.content && (
          <div
            className={[
              'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line',
              isUser
                ? 'bg-cta-bg text-cta-text rounded-tr-sm'
                : 'bg-bg-subtle border border-border text-fg-body rounded-tl-sm',
            ].join(' ')}
          >
            {message.content}
          </div>
        )}

        {message.actionLink && (
          <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
            <Link
              to={message.actionLink.to}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cta-bg text-cta-text hover:bg-cta-hover transition-colors"
            >
              <ArrowSquareOut size={14} />
              {message.actionLink.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-7 h-7 rounded-full bg-ai-tint border border-ai-border flex items-center justify-center shrink-0">
        <Sparkle className="text-ai-text" />
      </div>
      <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-bg-subtle border border-border flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-fg-tertiary animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-fg-tertiary animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-fg-tertiary animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}
