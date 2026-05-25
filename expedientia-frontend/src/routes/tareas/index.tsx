import { createFileRoute } from '@tanstack/react-router'
import { TareasPage } from '../../components/tareas/TareasPage'

export const Route = createFileRoute('/tareas/')({
  component: TareasPage,
})
