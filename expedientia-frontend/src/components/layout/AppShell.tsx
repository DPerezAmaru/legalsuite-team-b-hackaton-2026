import type { ReactNode } from 'react'
import { ListIcon } from '@phosphor-icons/react'
import { Sidebar } from './Sidebar'
import { CommandBar } from './CommandBar'
import { useSidebar } from '../../hooks/useSidebar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isOpen, open } = useSidebar()

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile: top bar con hamburguesa */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-base shrink-0">
          <button
            type="button"
            onClick={open}
            className="p-1 rounded text-fg-secondary hover:text-fg-primary hover:bg-bg-muted transition-colors"
            aria-label="Abrir menú"
          >
            <ListIcon />
          </button>
          <span className="font-semibold text-sm text-fg-primary">ExpedientiA</span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <CommandBar />
    </div>
  )
}
