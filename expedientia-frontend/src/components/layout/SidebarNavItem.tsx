import { Link, useRouterState } from '@tanstack/react-router'
import type { RegisteredRouter, RoutePaths } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useSidebar } from '../../hooks/useSidebar'

type AppRoute = RoutePaths<RegisteredRouter['routeTree']>

interface SidebarNavItemProps {
  to: AppRoute
  icon: ReactNode
  label: string
  exact?: boolean
}

export function SidebarNavItem({ to, icon, label, exact = false }: SidebarNavItemProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const close = useSidebar((s) => s.close)

  const isActive = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)

  const handleClick = () => {
    if (!window.matchMedia('(min-width: 1024px)').matches) close()
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      style={
        isActive
          ? { background: 'var(--sidebar-active)', color: 'var(--sidebar-text-active)' }
          : { color: 'var(--sidebar-text)' }
      }
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-(--sidebar-hover)"
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  )
}
