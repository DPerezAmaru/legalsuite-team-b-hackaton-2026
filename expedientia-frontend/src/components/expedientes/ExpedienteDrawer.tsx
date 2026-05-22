import { Link } from '@tanstack/react-router'
import { X, ArrowSquareOut } from '@phosphor-icons/react'
import { useExpediente } from '../../hooks/useExpediente'
import { ExpedienteContent } from './ExpedienteContent'

interface ExpedienteDrawerProps {
  expedienteId: number
  onClose: () => void
}

export function ExpedienteDrawer({ expedienteId, onClose }: ExpedienteDrawerProps) {
  const { data: expediente, isLoading, isError } = useExpediente(expedienteId)

  return (
    <div className="h-full flex flex-col bg-bg-base border-l border-border">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-fg-secondary hover:text-fg-primary hover:bg-bg-muted transition-colors"
          aria-label="Cerrar"
        >
          <X />
        </button>

        {expediente && (
          <Link
            to="/expedientes/$expedienteId"
            params={{ expedienteId: String(expediente.id) }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-fg-secondary hover:text-fg-primary hover:bg-bg-muted transition-colors"
          >
            Abrir página
            <ArrowSquareOut />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-7 w-2/3 bg-bg-muted rounded" />
            <div className="h-4 w-1/2 bg-bg-muted rounded" />
            <div className="h-32 w-full bg-bg-muted rounded-xl mt-6" />
            <div className="h-4 w-40 bg-bg-muted rounded mt-6" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-20 bg-bg-muted rounded" />
                  <div className="h-3.5 w-32 bg-bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-fg-secondary">
              No se pudo cargar el expediente.
            </p>
          </div>
        )}

        {expediente && !isLoading && <ExpedienteContent expediente={expediente} />}
      </div>
    </div>
  )
}
