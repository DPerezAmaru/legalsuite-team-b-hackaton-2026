import { useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom'
}

export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setCoords({
      top: placement === 'top'
        ? rect.top + window.scrollY - 6
        : rect.bottom + window.scrollY + 6,
      left: rect.left + rect.width / 2 + window.scrollX,
    })
  }, [placement])

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => { updateCoords(); setVisible(true) }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <div
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            transform: placement === 'top'
              ? 'translate(-50%, -100%)'
              : 'translate(-50%, 0)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="px-2 py-1 text-xs bg-fg-primary text-fg-inverse rounded whitespace-nowrap"
        >
          {content}
        </div>,
        document.body,
      )}
    </div>
  )
}
