import { useState } from 'react'
import type { Expediente } from '../../types'
import { ResumenIACard } from './ResumenIACard'

type Tab = 'resumen' | 'partes' | 'tareas' | 'documentos' | 'actuaciones'

const TABS: { id: Tab; label: string }[] = [
  { id: 'resumen',      label: 'Resumen' },
  { id: 'partes',       label: 'Partes' },
  { id: 'tareas',       label: 'Tareas' },
  { id: 'documentos',   label: 'Documentos' },
  { id: 'actuaciones',  label: 'Actuaciones' },
]

const TIPO_LABELS: Record<string, string> = {
  DEMANDANTE: 'Demandante',
  DEMANDADO:  'Demandado',
  APODERADO:  'Apoderado',
  TERCERO:    'Tercero',
}

interface DetalleTabsProps {
  expediente: Expediente
}

export function DetalleTabs({ expediente }: DetalleTabsProps) {
  const [active, setActive] = useState<Tab>('resumen')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              active === t.id
                ? 'text-fg-primary border-b-2 border-fg-primary -mb-px'
                : 'text-fg-tertiary hover:text-fg-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-5">
        {active === 'resumen' && (
          <ResumenIACard resumen={expediente.resumen} />
        )}

        {active === 'partes' && (
          <div className="flex flex-col gap-2">
            {expediente.partes.length === 0 ? (
              <p className="text-sm text-fg-tertiary">No hay partes registradas.</p>
            ) : (
              expediente.partes.map(parte => (
                <div
                  key={parte.id ?? parte.nombre}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-subtle"
                >
                  <div>
                    <p className="text-sm font-medium text-fg-primary">{parte.nombre}</p>
                    {parte.identificacion && (
                      <p className="text-xs text-fg-tertiary">{parte.identificacion}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium bg-bg-muted text-fg-secondary px-2 py-0.5 rounded-full">
                    {TIPO_LABELS[parte.tipoParticipacion] ?? parte.tipoParticipacion}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {(active === 'tareas' || active === 'documentos' || active === 'actuaciones') && (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-fg-tertiary">Próximamente</p>
          </div>
        )}
      </div>
    </div>
  )
}
