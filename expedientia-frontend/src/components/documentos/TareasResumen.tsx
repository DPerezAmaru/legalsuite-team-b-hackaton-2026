import { Link } from '@tanstack/react-router'
import { CheckCircleIcon, ArrowRightIcon, FolderOpenIcon } from '@phosphor-icons/react'
import type { ExpedienteCreadoConTareas } from '../../types'

interface TareasResumenProps {
  expedientes: ExpedienteCreadoConTareas[]
}

export function TareasResumen({ expedientes }: TareasResumenProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        <div className="flex items-start gap-3 p-4 rounded-xl border border-cta-bg/30 bg-cta-bg/5">
          <CheckCircleIcon className="text-cta-bg shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-fg-primary">
              {expedientes.length === 1 ? '1 expediente creado' : `${expedientes.length} expedientes creados`}
            </p>
            <p className="text-xs text-fg-secondary mt-0.5">
              Podés ir a un expediente específico o ver todos desde la lista.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {expedientes.map(exp => (
            <Link
              key={exp.expedienteId}
              to="/expedientes/$expedienteId"
              params={{ expedienteId: String(exp.expedienteId) }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-bg-base hover:bg-bg-subtle hover:border-border-strong transition-colors group"
            >
              <FolderOpenIcon className="text-fg-tertiary shrink-0 group-hover:text-fg-secondary transition-colors" size={18} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg-primary truncate">{exp.titulo}</p>
                {exp.radicado && (
                  <p className="text-xs text-fg-tertiary font-mono mt-0.5">{exp.radicado}</p>
                )}
              </div>
              <ArrowRightIcon className="text-fg-tertiary shrink-0 group-hover:text-fg-secondary transition-colors" size={14} />
            </Link>
          ))}
        </div>

        <div className="pt-2">
          <Link
            to="/expedientes"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors"
          >
            Ver todos los expedientes <ArrowRightIcon size={14} />
          </Link>
        </div>

      </div>
    </div>
  )
}
