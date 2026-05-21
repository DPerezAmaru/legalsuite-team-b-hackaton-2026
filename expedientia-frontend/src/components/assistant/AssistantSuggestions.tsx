interface AssistantSuggestionsProps {
  onSelect: (suggestion: string) => void
}

const SUGGESTIONS = [
  'Resumir un auto admisorio',
  'Generar contestación de demanda',
  'Buscar vencimientos esta semana',
  'Informe de cartera por especialidad',
] as const

export function AssistantSuggestions({ onSelect }: AssistantSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 text-xs text-fg-body border border-border rounded-full hover:bg-bg-subtle hover:border-border-strong transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
