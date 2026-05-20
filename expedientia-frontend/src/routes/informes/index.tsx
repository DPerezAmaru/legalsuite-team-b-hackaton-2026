import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/informes/')({
  component: () => <div>Informes</div>,
})
