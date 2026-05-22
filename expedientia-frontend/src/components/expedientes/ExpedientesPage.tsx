import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useExpedientes } from '../../hooks/useExpedientes'
import type { EstadoExpediente, Expediente } from '../../types'
import { PageContainer } from '../layout/PageContainer'
import { PageHeader } from '../layout/PageHeader'
import { PageToolbar } from '../layout/PageToolbar'
import { ExpedienteRow } from './ExpedienteRow'

type Tab = 'todos' | 'activos' | 'archivados'

function filterByTab(expedientes: Expediente[], tab: Tab): Expediente[] {
  if (tab === 'activos') return expedientes.filter(e => e.estado === 'ACTIVO')
  if (tab === 'archivados') {
    const archived: EstadoExpediente[] = ['ARCHIVADO', 'CERRADO']
    return expedientes.filter(e => archived.includes(e.estado))
  }
  return expedientes
}

export function ExpedientesPage() {
  const { data, isLoading, isError } = useExpedientes()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('todos')

  const expedientes = data ?? []

  const activos = expedientes.filter(e => e.estado === 'ACTIVO').length
  const archivados = expedientes.filter(e =>
    ['ARCHIVADO', 'CERRADO'].includes(e.estado),
  ).length

  const visible = filterByTab(expedientes, tab).filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    const nombre =
      e.partes.find(p => p.tipoParticipacion === 'DEMANDANTE')?.nombre ?? e.titulo
    return (
      nombre.toLowerCase().includes(q) ||
      e.radicado.toLowerCase().includes(q) ||
      e.titulo.toLowerCase().includes(q)
    )
  })

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'todos', label: 'Todos', count: expedientes.length },
    { id: 'activos', label: 'Activos', count: activos },
    { id: 'archivados', label: 'Archivados', count: archivados },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Expedientes"
        subtitle="Tus casos activos y archivados."
        meta={
          !isLoading && (
            <span className="text-xs font-medium bg-bg-muted text-fg-secondary px-2 py-0.5 rounded-full">
              {expedientes.length}
            </span>
          )
        }
        actions={
          <button
            type="button"
            onClick={() => navigate({ to: '/expedientes/nuevo' })}
            className="flex items-center gap-1.5 text-sm font-medium bg-cta-bg text-cta-text hover:bg-cta-hover px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Nuevo expediente
          </button>
        }
      />

      <PageToolbar
        search={
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary"
            />
            <input
              type="text"
              placeholder="Buscar expedientes"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-subtle border border-border rounded-lg text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-border-strong"
            />
          </div>
        }
        filters={
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  tab === t.id
                    ? 'bg-bg-muted text-fg-primary'
                    : 'text-fg-tertiary hover:text-fg-secondary hover:bg-bg-subtle'
                }`}
              >
                {t.label}
                <span className="text-[10px] text-fg-tertiary">{t.count}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="divide-y divide-border border-t border-border">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="py-4 animate-pulse">
              <div className="flex items-baseline justify-between gap-4">
                <div className="h-4 w-56 bg-bg-muted rounded" />
                <div className="h-3 w-12 bg-bg-muted rounded" />
              </div>
              <div className="h-3 w-72 bg-bg-muted rounded mt-2" />
            </div>
          ))}

        {isError && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-fg-secondary">
              No se pudieron cargar los expedientes.
            </p>
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-fg-secondary">No hay expedientes para mostrar.</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          visible.map(expediente => (
            <ExpedienteRow key={expediente.id} expediente={expediente} />
          ))}
      </div>
    </PageContainer>
  )
}
