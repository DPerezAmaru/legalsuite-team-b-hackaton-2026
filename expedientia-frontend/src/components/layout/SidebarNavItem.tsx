import { Link, useRouterState } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useSidebar } from '../../hooks/useSidebar'
import { Tooltip } from '../ui/Tooltip'

type AppRoute = NonNullable<LinkProps['to']>

interface SidebarNavItemProps {
  to: AppRoute
  icon: ReactNode
  label: string
  exact?: boolean
  collapsed?: boolean
}

export function SidebarNavItem({ to, icon, label, exact = false, collapsed = false }: SidebarNavItemProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const close = useSidebar((s) => s.close)

  const isActive = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)

  const handleClick = () => {
    if (!window.matchMedia('(min-width: 1024px)').matches) close()
  }

  return (
    <Tooltip content={label} placement="right" disabled={!collapsed} className="block">
      <Link
        to={to}
        onClick={handleClick}
        style={
          isActive
            ? { background: 'var(--sidebar-active)', color: 'var(--sidebar-text-active)' }
            : { color: 'var(--sidebar-text)' }
        }
        className="flex items-center w-full h-8 rounded-md text-xs font-medium transition-colors hover:bg-(--sidebar-hover)"
      >
        <span className="flex items-center justify-center w-10 shrink-0 text-base">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    </Tooltip>
  )
}
