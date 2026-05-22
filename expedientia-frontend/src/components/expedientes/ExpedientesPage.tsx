import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useExpedientes } from '../../hooks/useExpedientes'
import type { EstadoExpediente, Expediente } from '../../types'
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
  const archivados = expedientes.filter(e => ['ARCHIVADO', 'CERRADO'].includes(e.estado)).length

  const visible = filterByTab(expedientes, tab).filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    const nombre = e.partes.find(p => p.tipoParticipacion === 'DEMANDANTE')?.nombre ?? e.titulo
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border shrink-0">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-fg-primary">Expedientes</h1>
            {!isLoading && (
              <span className="text-xs font-medium bg-bg-muted text-fg-secondary px-2 py-0.5 rounded-full">
                {expedientes.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-1.5 text-sm font-medium bg-cta-bg text-cta-text hover:bg-cta-hover px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Nuevo expediente
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
            <input
              type="text"
              placeholder="Buscar expedientes"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-subtle border border-border rounded-lg text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-border-strong"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border shrink-0">
        <div className="flex gap-1 max-w-5xl mx-auto px-6 pt-3">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                tab === t.id
                  ? 'text-fg-primary border-b-2 border-fg-primary -mb-px'
                  : 'text-fg-tertiary hover:text-fg-secondary'
              }`}
            >
              {t.label}
              <span className="text-xs bg-bg-muted text-fg-tertiary px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-6 py-3 text-xs font-semibold text-fg-tertiary uppercase tracking-wide border-b border-border">
            <div className="w-8 shrink-0" />
            <div className="flex-1">Expediente</div>
            <div className="w-28 hidden sm:block">Tipo</div>
            <div className="w-24">Estado</div>
            <div className="w-20 text-right hidden md:block">Actualizado</div>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-0.5 mt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-8 h-8 bg-bg-muted rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-40 bg-bg-muted rounded" />
                    <div className="h-2.5 w-24 bg-bg-muted rounded" />
                  </div>
                  <div className="w-28 h-3 bg-bg-muted rounded hidden sm:block" />
                  <div className="w-16 h-3 bg-bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-fg-secondary">No se pudieron cargar los expedientes.</p>
            </div>
          )}

          {!isLoading && !isError && visible.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-fg-secondary">No hay expedientes para mostrar.</p>
            </div>
          )}

          {!isLoading && !isError && visible.map(expediente => (
            <div key={expediente.id} className="border-b border-border last:border-0">
              <ExpedienteRow expediente={expediente} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
