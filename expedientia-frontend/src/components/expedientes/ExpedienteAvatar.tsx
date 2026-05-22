// Color determinístico: hash del nombre → índice en paleta
const COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
]

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return h % COLORS.length
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

interface ExpedienteAvatarProps {
  name: string
  size?: 'sm' | 'md'
}

export function ExpedienteAvatar({ name, size = 'md' }: ExpedienteAvatarProps) {
  const color = COLORS[hashName(name)]
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'

  return (
    <span
      className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
    >
      {initials(name)}
    </span>
  )
}
