import { Bot, Folder, ListTodo, History, FileText, Search, PanelLeftClose, X } from 'lucide-react'
import { SidebarNavItem } from './SidebarNavItem'
import { useSidebar } from '../../hooks/useSidebar'

export function Sidebar() {
  const { isOpen, close, toggle } = useSidebar()

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
          <button
            type="button"
            className="p-1 rounded text-(--sidebar-text) hover:bg-(--sidebar-hover) transition-colors"
            aria-label="Buscar"
          >
            <Search size={14} />
          </button>

          {/* Desktop: colapsa el sidebar */}
          <button
            type="button"
            onClick={toggle}
            className="hidden lg:flex items-center p-1 rounded text-(--sidebar-text) hover:bg-(--sidebar-hover) transition-colors"
            aria-label="Colapsar panel"
          >
            <PanelLeftClose size={14} />
          </button>

          {/* Mobile: cierra el drawer */}
          <button
            type="button"
            onClick={close}
            className="lg:hidden p-1 rounded text-(--sidebar-text) hover:bg-(--sidebar-hover) transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        <SidebarNavItem to="/" icon={<Bot size={15} />} label="Nuevo expediente" exact />
        <SidebarNavItem to="/expedientes" icon={<Folder size={15} />} label="Expedientes" />
        <SidebarNavItem to="/tareas" icon={<ListTodo size={15} />} label="Tareas" />
        <SidebarNavItem to="/historial" icon={<History size={15} />} label="Historial" />
        <SidebarNavItem to="/documentos" icon={<FileText size={15} />} label="Documentos" />
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
