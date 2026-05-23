import { House, Folder, ListChecks, ClockCounterClockwise, Sparkle, SidebarSimple, X } from '@phosphor-icons/react'
import { SidebarNavItem } from './SidebarNavItem'
import { useSidebar } from '../../hooks/useSidebar'
import { useCommandBar } from '../../store/commandBarStore'

function modKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl'
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl'
}

export function Sidebar() {
  const { isOpen, close, toggle } = useSidebar()
  const openCommandBar = useCommandBar(s => s.open)

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 w-52 h-screen flex flex-col shrink-0',
        'bg-sidebar-bg transition-transform duration-200 ease-in-out',
        'lg:relative lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden',
      ].join(' ')}
      style={{ borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-3 flex items-center justify-between">
        <span className="font-semibold text-sm text-fg-primary tracking-tight">ExpedientiA</span>
        <div className="flex items-center gap-1">
          {/* Desktop: colapsa el sidebar */}
          <button
            type="button"
            onClick={toggle}
            className="hidden lg:flex items-center p-1 rounded text-(--sidebar-text) hover:bg-(--sidebar-hover) transition-colors"
            aria-label="Colapsar panel"
          >
            <SidebarSimple />
          </button>

          {/* Mobile: cierra el drawer */}
          <button
            type="button"
            onClick={close}
            className="lg:hidden p-1 rounded text-(--sidebar-text) hover:bg-(--sidebar-hover) transition-colors"
            aria-label="Cerrar menú"
          >
            <X />
          </button>
        </div>
      </div>

      {/* Ask Anywhere — disparador del CommandBar (Cmd/Ctrl+K) */}
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={openCommandBar}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-(--sidebar-text) bg-(--sidebar-hover) hover:bg-(--sidebar-hover) hover:text-fg-primary transition-colors"
          aria-label="Abrir asistente"
        >
          <Sparkle />
          <span className="truncate">Preguntá al asistente</span>
          <span className="ml-auto font-mono text-[10px] tracking-wide opacity-70">
            {modKey()}K
          </span>
        </button>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        <SidebarNavItem to="/" icon={<House />} label="Asistente" exact />
        <SidebarNavItem to="/expedientes" icon={<Folder />} label="Expedientes" />
        <SidebarNavItem to="/tareas" icon={<ListChecks />} label="Tareas" />
        <SidebarNavItem to="/historial" icon={<ClockCounterClockwise />} label="Historial" />
      </nav>

      {/* Nav inferior */}
      <div className="px-2 pb-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        {/* User */}
        <div className="pt-2 flex items-center gap-2 px-2">
          <div className="w-6 h-6 rounded-full bg-fg-primary flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-fg-inverse">JG</span>
          </div>
          <span className="text-[10px] text-(--sidebar-text) truncate leading-tight">
            juan.garcia@despacho.co
          </span>
        </div>
      </div>
    </aside>
  )
}
