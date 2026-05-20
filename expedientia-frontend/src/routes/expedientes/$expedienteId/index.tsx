import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/expedientes/$expedienteId/')({
  component: () => <div>Detalle del expediente</div>,
})
