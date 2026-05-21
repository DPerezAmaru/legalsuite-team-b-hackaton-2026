interface SectionHeaderProps {
  title: string
  linkLabel?: string
  onLink?: () => void
}

export function SectionHeader({ title, linkLabel, onLink }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-fg-primary">{title}</h2>
      {linkLabel && (
        <button
          type="button"
          onClick={onLink}
          className="text-xs text-fg-tertiary hover:text-fg-secondary transition-colors"
        >
          {linkLabel}
        </button>
      )}
    </div>
  )
}
