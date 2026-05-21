import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/documentos/')({
  component: () => <div className="p-6 text-fg-primary capitalize">documentos</div>,
})
