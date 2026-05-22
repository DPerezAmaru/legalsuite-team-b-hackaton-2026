import { createFileRoute } from '@tanstack/react-router'
import { ExpedientesPage } from '../../components/expedientes/ExpedientesPage'

interface ExpedientesSearch {
  caso?: number
}

export const Route = createFileRoute('/expedientes/')({
  validateSearch: (search: Record<string, unknown>): ExpedientesSearch => {
    const raw = search.caso
    const n = typeof raw === 'number' ? raw : raw ? Number(raw) : NaN
    return Number.isFinite(n) && n > 0 ? { caso: n } : {}
  },
  component: ExpedientesPage,
})
