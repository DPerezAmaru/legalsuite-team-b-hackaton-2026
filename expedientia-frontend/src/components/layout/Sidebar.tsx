import { FolderIcon, ListChecksIcon, SparkleIcon, SidebarSimpleIcon, XIcon } from '@phosphor-icons/react'
import { SidebarNavItem } from './SidebarNavItem'
import { ThemeToggle } from './ThemeToggle'
import { useSidebar } from '../../hooks/useSidebar'

export function Sidebar() {
  const { isOpen, close, toggle } = useSidebar()

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 h-screen flex flex-col shrink-0 overflow-hidden',
        'bg-sidebar-bg transition-[width] duration-200 ease-in-out',
        'lg:relative lg:z-auto lg:translate-x-0',
        isOpen ? 'w-52 translate-x-0' : 'w-52 -translate-x-full lg:w-14',
      ].join(' ')}
      style={{ borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Header */}
      <div className="flex items-center h-12 shrink-0">
        {/* Desktop toggle anclado al slot fijo de 56px */}
        <button
          type="button"
          onClick={toggle}
          className="hidden lg:flex items-center justify-center w-14 h-10 shrink-0 text-(--sidebar-text) hover:bg-(--sidebar-hover) transition-colors"
          aria-label={isOpen ? 'Colapsar panel' : 'Expandir panel'}
        >
          <SidebarSimpleIcon size={18} />
        </button>

        {/* Título solo cuando está abierto */}
        {isOpen && (
          <span className="font-semibold text-sm text-fg-primary tracking-tight ml-3 lg:ml-0 whitespace-nowrap">
            ExpedientIA
          </span>
        )}

        {/* Cierre móvil */}
        {isOpen && (
          <button
            type="button"
            onClick={close}
            className="lg:hidden ml-auto mr-3 p-1 rounded text-(--sidebar-text) hover:bg-(--sidebar-hover) transition-colors"
            aria-label="Cerrar menú"
          >
            <XIcon size={18} />
          </button>
        )}
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        <SidebarNavItem to="/" icon={<SparkleIcon size={18} />} label="Asistente" exact collapsed={!isOpen} />
        <SidebarNavItem to="/expedientes" icon={<FolderIcon size={18} />} label="Expedientes" collapsed={!isOpen} />
        <SidebarNavItem to="/tareas" icon={<ListChecksIcon size={18} />} label="Tareas" collapsed={!isOpen} />
      </nav>

      {/* Nav inferior */}
      <div className="px-2 pb-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="pt-2">
          <ThemeToggle collapsed={!isOpen} />
        </div>
        {isOpen && (
          <div className="pt-2 flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-full bg-fg-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-fg-inverse">DP</span>
            </div>
            <span className="text-[10px] text-(--sidebar-text) truncate leading-tight">
              daniel.perez@expedientia.com
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
