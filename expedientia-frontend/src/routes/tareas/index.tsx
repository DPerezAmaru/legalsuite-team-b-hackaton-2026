import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tareas/')({
  component: () => <div className="p-6 text-fg-primary">Tareas</div>,
})
