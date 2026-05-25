import { useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'right'
  className?: string
  disabled?: boolean
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  className,
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    if (placement === 'right') {
      setCoords({
        top: rect.top + rect.height / 2 + window.scrollY,
        left: rect.right + window.scrollX + 6,
      })
    } else {
      setCoords({
        top: placement === 'top'
          ? rect.top + window.scrollY - 6
          : rect.bottom + window.scrollY + 6,
        left: rect.left + rect.width / 2 + window.scrollX,
      })
    }
  }, [placement])

  const style: React.CSSProperties = {
    position: 'absolute',
    top: coords.top,
    left: coords.left,
    zIndex: 9999,
    pointerEvents: 'none',
    transform: placement === 'top'
      ? 'translate(-50%, -100%)'
      : placement === 'bottom'
        ? 'translate(-50%, 0)'
        : 'translate(0, -50%)',
  }

  return (
    <div
      ref={triggerRef}
      className={className ?? 'inline-flex'}
      onMouseEnter={() => {
        if (disabled) return
        updateCoords()
        setVisible(true)
      }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && !disabled && createPortal(
        <div style={style} className="px-2 py-1 text-xs bg-fg-primary text-fg-inverse rounded whitespace-nowrap">
          {content}
        </div>,
        document.body,
      )}
    </div>
  )
}
