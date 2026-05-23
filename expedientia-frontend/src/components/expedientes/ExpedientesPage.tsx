import { useState, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Plus, MagnifyingGlass } from '@phosphor-icons/react'
import { useExpedientes } from '../../hooks/useExpedientes'
import type { EstadoExpediente, Expediente } from '../../types'
import { PageContainer } from '../layout/PageContainer'
import { PageHeader } from '../layout/PageHeader'
import { PageToolbar } from '../layout/PageToolbar'
import { ExpedienteRow } from './ExpedienteRow'
import { ExpedientesTableHeader } from './ExpedientesTableHeader'
import { ExpedienteDrawer } from './ExpedienteDrawer'

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
  const { caso } = useSearch({ from: '/expedientes/' })
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('todos')
  const [lastOpenedId, setLastOpenedId] = useState<number | null>(null)

  const drawerId = caso ?? null
  const isDrawerOpen = drawerId !== null
  const panelId = drawerId ?? lastOpenedId

  const closeDrawer = () => navigate({ to: '/expedientes', search: {} })

  useEffect(() => {
    if (drawerId !== null) setLastOpenedId(drawerId)
  }, [drawerId])

  useEffect(() => {
    if (!isDrawerOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDrawer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen])

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
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto">
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
                <Plus />
                Nuevo expediente
              </button>
            }
          />

          <PageToolbar
            search={
              <div className="relative">
                <MagnifyingGlass
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

          <div className="@container/table">
            <ExpedientesTableHeader />

            <div className="divide-y divide-border">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-3 py-3 animate-pulse"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-[15px] h-[15px] bg-bg-muted rounded shrink-0" />
                      <div className="min-w-0 space-y-1.5">
                        <div className="h-3.5 w-24 bg-bg-muted rounded" />
                        <div className="h-2.5 w-56 bg-bg-muted rounded" />
                      </div>
                    </div>
                    <div className="hidden @2xl/table:block w-44 h-3 bg-bg-muted rounded" />
                    <div className="hidden @3xl/table:block w-44 h-3 bg-bg-muted rounded" />
                    <div className="hidden @lg/table:block w-24 h-3 bg-bg-muted rounded" />
                    <div className="hidden @5xl/table:block w-44 h-3 bg-bg-muted rounded" />
                    <div className="w-28 h-3 bg-bg-muted rounded" />
                    <div className="w-16 h-3 bg-bg-muted rounded" />
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
                  <p className="text-sm text-fg-secondary">
                    No hay expedientes para mostrar.
                  </p>
                </div>
              )}

              {!isLoading &&
                !isError &&
                visible.map(expediente => (
                  <ExpedienteRow key={expediente.id} expediente={expediente} isActive={expediente.id === drawerId} />
                ))}
            </div>
          </div>
        </PageContainer>
      </div>

      <div
        className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isDrawerOpen ? 'w-full sm:w-[480px] lg:w-[600px]' : 'w-0'
        }`}
        aria-hidden={!isDrawerOpen}
      >
        <div
          className={`w-full sm:w-[480px] lg:w-[600px] h-full transition-opacity duration-200 ease-out ${
            isDrawerOpen ? 'opacity-100 delay-75' : 'opacity-0'
          }`}
        >
          {panelId !== null && (
            <ExpedienteDrawer expedienteId={panelId} onClose={closeDrawer} />
          )}
        </div>
      </div>
    </div>
  )
}
