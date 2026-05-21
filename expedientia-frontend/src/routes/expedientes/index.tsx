import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/expedientes/')({
  component: () => <div>Listado de expedientes</div>,
})
