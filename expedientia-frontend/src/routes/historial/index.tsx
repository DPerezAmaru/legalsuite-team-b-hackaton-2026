import { createFileRoute } from '@tanstack/react-router'
import { HistorialPage } from '../../components/historial/HistorialPage'

export const Route = createFileRoute('/historial/')({
  component: HistorialPage,
})

