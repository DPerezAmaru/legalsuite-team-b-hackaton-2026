import { createFileRoute } from '@tanstack/react-router'
import { InformesPage } from '../../components/informes/InformesPage'

export const Route = createFileRoute('/informes/')({
  component: InformesPage,
})

