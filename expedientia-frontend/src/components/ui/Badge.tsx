interface BadgeProps {
  count: number
}

export function Badge({ count }: BadgeProps) {
  return (
    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/15 text-(--sidebar-text)">
      {count > 99 ? '99+' : count}
    </span>
  )
}
