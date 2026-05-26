import { createFileRoute } from '@tanstack/react-router'
import { NuevoExpedientePage } from '../../components/expedientes/NuevoExpedientePage'

export const Route = createFileRoute('/expedientes/nuevo')({
  component: NuevoExpedientePage,
})

