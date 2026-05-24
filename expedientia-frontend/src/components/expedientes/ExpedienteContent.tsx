import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Sparkle, Copy, Check,
  IdentificationCard,
  Gavel,
  Files,
  Robot,
} from '@phosphor-icons/react'
import type { Expediente } from '../../types'
import { EstadoBadge } from './EstadoBadge'
import { AccordionSection } from '../ui/AccordionSection'
import { TareasSection } from './TareasSection'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function formatFecha(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const TIPO_LABELS: Record<string, string> = {
  DEMANDANTE: 'Demandante',
  DEMANDADO: 'Demandado',
  APODERADO: 'Apoderado',
  TERCERO: 'Tercero',
}

interface ExpedienteContentProps {
  expediente: Expediente
  headerExtras?: ReactNode
}

const RESUELVE_LIMIT = 300

export function ExpedienteContent({ expediente, headerExtras }: ExpedienteContentProps) {
  const [copied, setCopied] = useState(false)
  const [resuelveExpanded, setResuelveExpanded] = useState(false)


  const subtitulo = [capitalize(expediente.especialidad), expediente.despacho]
    .filter(Boolean)
    .join(' · ')

  function handleCopy() {
    if (!expediente.resumen) return
    navigator.clipboard.writeText(expediente.resumen).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-fg-primary tracking-tight truncate">
            {expediente.titulo}
          </h1>
          {subtitulo && (
            <p className="mt-1 text-sm text-fg-secondary">{subtitulo}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <EstadoBadge estado={expediente.estado} />
          {headerExtras}
        </div>
      </header>

      <AccordionSection
        title="Resumen IA"
        icon={<Sparkle className="text-ai-text" />}
        defaultOpen
      >
        <div className="bg-ai-tint px-4 py-3">
          {expediente.resumen ? (
            <>
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded text-ai-text hover:bg-ai-border transition-colors"
                  aria-label="Copiar resumen"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm text-fg-body leading-relaxed">{expediente.resumen}</p>
            </>
          ) : (
            <p className="text-sm text-fg-tertiary italic">
              Sin resumen generado. Pedile al asistente que analice este expediente.
            </p>
          )}
        </div>
      </AccordionSection>

      <AccordionSection
        title="Información del expediente"
        icon={<IdentificationCard className="text-fg-secondary" />}
        defaultOpen
      >
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 pt-4 pb-3">
          <Field label="Radicado" value={expediente.radicado} mono />
          <Field label="Especialidad" value={capitalize(expediente.especialidad)} />
          <Field label="Fecha de inicio" value={formatFecha(expediente.fechaInicio)} />
          <Field label="Ciudad" value={expediente.ciudad} />
          <Field label="Despacho" value={expediente.despacho} />
        </dl>
        {expediente.partes.length > 0 && (
          <div className="px-4 pb-4 border-t border-border pt-3">
            <p className="text-xs text-fg-tertiary mb-2">Partes</p>
            <ul className="space-y-2">
              {expediente.partes.map((p, i) => (
                <li key={p.id ?? i} className="flex items-start gap-2">
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-bg-muted text-fg-secondary shrink-0 mt-0.5">
                    {TIPO_LABELS[p.tipoParticipacion] ?? p.tipoParticipacion}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-fg-body">{p.nombre}</p>
                    {p.identificacion && (
                      <p className="text-xs text-fg-tertiary">{p.identificacion}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {expediente.resuelve && (
          <div className="px-4 pb-4 border-t border-border pt-3">
            <p className="text-xs text-fg-tertiary mb-1">Resuelve</p>
            <p className="text-sm text-fg-body leading-relaxed whitespace-pre-line">
              {resuelveExpanded || expediente.resuelve.length <= RESUELVE_LIMIT
                ? expediente.resuelve
                : `${expediente.resuelve.slice(0, RESUELVE_LIMIT).trimEnd()}…`}
            </p>
            {expediente.resuelve.length > RESUELVE_LIMIT && (
              <button
                type="button"
                onClick={() => setResuelveExpanded(e => !e)}
                className="mt-2 text-xs text-fg-secondary hover:text-fg-primary transition-colors"
              >
                {resuelveExpanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}
      </AccordionSection>

      <TareasSection expedienteId={expediente.id} />

      <AccordionSection
        title="Actuaciones"
        icon={<Gavel className="text-fg-secondary" />}
      >
        <EmptyState message="No hay actuaciones registradas" />
      </AccordionSection>

      <AccordionSection
        title="Documentos"
        icon={<Files className="text-fg-secondary" />}
      >
        <EmptyState message="No hay documentos adjuntos" />
      </AccordionSection>

      <AccordionSection
        title="Preguntarle a la IA"
        icon={<Robot className="text-fg-secondary" />}
      >
        <EmptyState message="Próximamente: consultá la IA sobre este expediente" />
      </AccordionSection>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string | null | undefined
  mono?: boolean
}

function Field({ label, value, mono = false }: FieldProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fg-tertiary">{label}</dt>
      <dd className={`text-sm text-fg-body mt-0.5 truncate ${mono ? 'tabular-nums' : ''}`.trim()}>
        {value ?? '—'}
      </dd>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-6 text-center">
      <p className="text-sm text-fg-tertiary">{message}</p>
    </div>
  )
}

