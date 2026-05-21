import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/expedientes/nuevo')({
  component: () => <div>Nuevo expediente</div>,
})
