import { createFileRoute } from '@tanstack/react-router'
import { ExpedientesPage } from '../../components/expedientes/ExpedientesPage'

export const Route = createFileRoute('/expedientes/')({
  component: ExpedientesPage,
})
