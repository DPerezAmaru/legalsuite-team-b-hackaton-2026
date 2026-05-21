import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/historial/')({
  component: () => <div className="p-6 text-fg-primary capitalize">historial</div>,
})
