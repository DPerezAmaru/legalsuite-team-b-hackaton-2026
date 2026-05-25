import { SunIcon, MoonIcon, MonitorIcon } from '@phosphor-icons/react'
import { useTheme } from '../../store/themeStore'
import { Tooltip } from '../ui/Tooltip'

interface ThemeToggleProps {
  collapsed?: boolean
}

const labels = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
} as const

const icons = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
} as const

const nextLabels = {
  light: 'Oscuro',
  dark: 'Sistema',
  system: 'Claro',
} as const

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const theme = useTheme(s => s.theme)
  const cycle = useTheme(s => s.cycle)
  const Icon = icons[theme]
  const label = labels[theme]
  const tooltip = `Tema: ${label} (clic para ${nextLabels[theme]})`

  return (
    <Tooltip
      content={tooltip}
      placement="right"
      disabled={!collapsed}
      className="block"
    >
      <button
        type="button"
        onClick={cycle}
        className="flex items-center w-full h-8 rounded-md text-xs font-medium text-(--sidebar-text) transition-colors hover:bg-(--sidebar-hover) hover:text-fg-primary"
        aria-label={`Cambiar tema. Actual: ${label}. Próximo: ${nextLabels[theme]}`}
      >
        <span className="flex items-center justify-center w-10 shrink-0 text-base">
          <Icon size={18} />
        </span>
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    </Tooltip>
  )
}
