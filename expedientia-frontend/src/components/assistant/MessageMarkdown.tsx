import ReactMarkdown from 'react-markdown'

interface MessageMarkdownProps {
  children: string
}

export function MessageMarkdown({ children }: MessageMarkdownProps) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-fg-primary">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="px-1 py-0.5 rounded bg-bg-muted text-fg-primary font-mono text-[0.85em]">
            {children}
          </code>
        ),
        h1: ({ children }) => (
          <h1 className="text-base font-semibold text-fg-primary mb-2 mt-1">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-semibold text-fg-primary mb-1.5 mt-1">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-medium text-fg-primary mb-1 mt-1">{children}</h3>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg-primary underline underline-offset-2 hover:text-fg-body"
          >
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
