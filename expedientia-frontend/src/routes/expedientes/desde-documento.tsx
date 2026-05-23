import { createFileRoute } from '@tanstack/react-router'
import { DocumentosPage } from '../../components/documentos/DocumentosPage'

export const Route = createFileRoute('/expedientes/desde-documento')({
  component: DocumentosPage,
})
