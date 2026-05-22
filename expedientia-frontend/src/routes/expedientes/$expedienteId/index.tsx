import { createFileRoute } from '@tanstack/react-router'
import { ExpedienteDetallePage } from '../../../components/expedientes/ExpedienteDetallePage'

export const Route = createFileRoute('/expedientes/$expedienteId/')({
  component: function RouteComponent() {
    const { expedienteId } = Route.useParams()
    return <ExpedienteDetallePage expedienteId={Number(expedienteId)} />
  },
})
