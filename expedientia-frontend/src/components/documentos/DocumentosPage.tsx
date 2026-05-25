import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { CircleNotchIcon, InfoIcon, WarningIcon, UploadSimpleIcon, SparkleIcon, FolderPlusIcon, CaretRightIcon, FileTextIcon } from '@phosphor-icons/react'
import { UploadZone } from './UploadZone'
import { PdfViewer } from './PdfViewer'
import { ProcesoCard } from './ProcesoCard'
import { TareasResumen } from './TareasResumen'
import { useDocumentoProcesar } from '../../hooks/useDocumentoProcesar'
import { useDocumentosConfirmar } from '../../hooks/useDocumentosConfirmar'
import { useDocumentosStore } from '../../store/documentosStore'
import type {
  DocumentoFormState,
  ProcesoSugerido,
  ProcesarDocumentoResponse,
  ExpedienteCreadoConTareas,
  TareaSugerida,
} from '../../types'

let _tareaIdCounter = 1

const TAREAS_POR_ESPECIALIDAD: Record<string, { texto: string; prioridad: TareaSugerida['prioridad'] }[]> = {
  CIVIL: [
    { texto: 'Notificar auto admisorio a las partes', prioridad: 'ALTA' },
    { texto: 'Verificar términos de traslado del proceso', prioridad: 'MEDIA' },
    { texto: 'Revisar poderes de representación', prioridad: 'BAJA' },
  ],
  PENAL: [
    { texto: 'Verificar términos de prescripción de la acción', prioridad: 'ALTA' },
    { texto: 'Revisar medidas cautelares vigentes', prioridad: 'ALTA' },
    { texto: 'Notificar fecha de audiencia preliminar', prioridad: 'MEDIA' },
  ],
  LABORAL: [
    { texto: 'Verificar liquidación de prestaciones sociales', prioridad: 'ALTA' },
    { texto: 'Notificar convocatoria a audiencia de conciliación', prioridad: 'MEDIA' },
    { texto: 'Revisar constancias de pago de nómina', prioridad: 'BAJA' },
  ],
  ADMINISTRATIVO: [
    { texto: 'Verificar caducidad de la acción contenciosa', prioridad: 'ALTA' },
    { texto: 'Solicitar historia administrativa al ente demandado', prioridad: 'MEDIA' },
    { texto: 'Revisar agotamiento de vía gubernativa', prioridad: 'MEDIA' },
  ],
  FAMILIA: [
    { texto: 'Notificar demanda a todas las partes', prioridad: 'ALTA' },
    { texto: 'Verificar cuota alimentaria vigente', prioridad: 'MEDIA' },
    { texto: 'Programar audiencia de conciliación', prioridad: 'MEDIA' },
  ],
}

function mockTareasSugeridas(especialidad: string): TareaSugerida[] {
  const plantillas = TAREAS_POR_ESPECIALIDAD[especialidad] ?? TAREAS_POR_ESPECIALIDAD.CIVIL
  return plantillas.map((t) => ({ ...t, id: _tareaIdCounter++ }))
}

type PageState =
  | { stage: 'idle' }
  | { stage: 'processing'; files: File[] }
  | {
      stage: 'review'
      files: File[]
      response: ProcesarDocumentoResponse
      forms: DocumentoFormState[]
      archivoOrigen: string[]
      createdIds: Record<number, number>
    }
  | { stage: 'created'; expedientes: ExpedienteCreadoConTareas[] }

function procesoToForm(datos: ProcesoSugerido): DocumentoFormState {
  return {
    radicado: datos.radicado,
    titulo: datos.titulo,
    especialidad: datos.especialidad,
    estado: datos.estado,
    despacho: datos.despacho,
    ciudad: datos.ciudad,
    resumen: datos.resumen,
    resuelve: datos.resuelve,
    partes: datos.partes,
  }
}

export function DocumentosPage() {
  const [state, setState] = useState<PageState>({ stage: 'idle' })
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set())
  const [bulkCreating, setBulkCreating] = useState(false)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const panelScrollRef = useRef<HTMLDivElement>(null)
  const { mutateAsync: procesarDocumento } = useDocumentoProcesar()
  const { mutateAsync: confirmarBulk } = useDocumentosConfirmar()
  const consumePendingFiles = useDocumentosStore(s => s.consumePendingFiles)

  const handleFiles = useCallback(
    async (files: File[]) => {
      setState({ stage: 'processing', files })
      setSelectedFileIdx(0)
      try {
        const response = await procesarDocumento(files)
        const forms = response.procesos.map(p => procesoToForm(p.datos))
        const archivoOrigen = response.procesos.map(p => p.archivoOrigen)
        setState({ stage: 'review', files, response, forms, archivoOrigen, createdIds: {} })
        setSelectedIndexes(new Set(forms.map((_, i) => i)))
      } catch {
        setState({
          stage: 'review',
          files,
          response: {
            totalArchivos: files.length,
            totalProcesosEncontrados: 0,
            procesos: [],
            omitidos: [],
            promptCombinado: '',
          },
          forms: [],
          archivoOrigen: [],
          createdIds: {},
        })
      }
    },
    [procesarDocumento],
  )

  useEffect(() => {
    const files = consumePendingFiles()
    if (files.length) handleFiles(files)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.stage !== 'review') return
    const fileName = state.files[selectedFileIdx]?.name
    const firstIdx = state.archivoOrigen.findIndex(o => o === fileName)
    const card = cardRefs.current[firstIdx]
    const container = panelScrollRef.current
    if (!card || !container) return
    const cardRect = card.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    container.scrollTo({
      top: cardRect.top - containerRect.top + container.scrollTop - 12,
      behavior: 'smooth',
    })
  }, [selectedFileIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormChange = useCallback((index: number, form: DocumentoFormState) => {
    setState((prev) => {
      if (prev.stage !== 'review') return prev
      return { ...prev, forms: prev.forms.map((f, i) => (i === index ? form : f)) }
    })
  }, [])

  const handleToggleSelect = useCallback((idx: number) => {
    setSelectedIndexes(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  const handleConfirmar = useCallback(async () => {
    if (state.stage !== 'review') return
    const pendingIdxs = [...selectedIndexes].filter(i => state.createdIds[i] === undefined)
    if (!pendingIdxs.length) return

    // Indices (1-based) del analizar response para los seleccionados pendientes
    const seleccionados = pendingIdxs.map(i => state.response.procesos[i]?.indice).filter(Boolean) as number[]

    // Todos los procesos con los datos editados por el usuario aplicados
    const procesos = state.response.procesos.map((p, i) => ({
      ...p,
      datos: { ...p.datos, ...state.forms[i] },
    }))

    setBulkCreating(true)
    try {
      const result = await confirmarBulk({ seleccionados, procesos })
      const expedientesCreadosConTareas: ExpedienteCreadoConTareas[] = result.expedientes.map((exp) => ({
        expedienteId: exp.id,
        titulo: exp.titulo,
        radicado: exp.radicado ?? '',
        especialidad: exp.especialidad,
        tareasSugeridas: [],
      }))
      setState({ stage: 'created', expedientes: expedientesCreadosConTareas })
    } finally {
      setBulkCreating(false)
    }
  }, [state, selectedIndexes, confirmarBulk])

  const handleReplace = useCallback(() => {
    setState({ stage: 'idle' })
    setSelectedFileIdx(0)
    setSelectedIndexes(new Set())
  }, [])

  const highlightValues = useMemo(() => {
    if (state.stage !== 'review') return []
    const selectedFileName = state.files[selectedFileIdx]?.name
    const vals: string[] = []
    state.forms.forEach((f, i) => {
      if (state.archivoOrigen[i] !== selectedFileName) return
      vals.push(f.radicado, f.despacho, f.ciudad, f.fechaInicio ?? '')
      for (const p of f.partes) {
        vals.push(p.nombre)
        if (p.identificacion) vals.push(p.identificacion)
      }
    })
    return vals.filter((v) => typeof v === 'string' && v.trim().length >= 4)
  }, [state, selectedFileIdx])

  if (state.stage === 'idle') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

          <div>
            <h1 className="text-2xl font-bold text-fg-primary">Crear expediente desde documento</h1>
            <p className="mt-1 text-sm text-fg-secondary">
              Subí hasta 5 PDFs judiciales y la IA extrae el radicado, las partes y el juzgado automáticamente.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <UploadSimpleIcon />, step: '1', title: 'Subí los PDFs', desc: 'Hasta 5 documentos judiciales en formato PDF.' },
              { icon: <SparkleIcon />,      step: '2', title: 'La IA analiza', desc: 'Extrae radicado, partes, juzgado y más.' },
              { icon: <FolderPlusIcon />,   step: '3', title: 'Creá los expedientes', desc: 'Revisá los datos y confirmá con un clic.' },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-bg-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-fg-tertiary bg-bg-muted px-1.5 py-0.5 rounded-md">{step}</span>
                  <span className="text-fg-secondary">{icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-fg-primary">{title}</p>
                  <p className="text-xs text-fg-tertiary mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <UploadZone onFiles={handleFiles} />

        </div>
      </div>
    )
  }

  if (state.stage === 'processing') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <CircleNotchIcon className="animate-spin text-fg-secondary" />
        <p className="text-sm text-fg-secondary">Analizando {state.files.length > 1 ? `${state.files.length} documentos` : 'documento'} con IA...</p>
        <p className="text-xs text-fg-tertiary">{state.files.map(f => f.name).join(', ')}</p>
      </div>
    )
  }

  if (state.stage === 'created') {
    return <TareasResumen expedientes={state.expedientes} />
  }

  const { response, forms, files, createdIds } = state
  const hasProcesos = forms.length > 0
  const selectedFile = files[selectedFileIdx] ?? files[0]

  return (
    <div className="flex flex-col h-full">
      <nav className="flex items-center gap-1 px-4 py-2 border-b border-border shrink-0">
        <Link to="/expedientes" className="text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">Expedientes</Link>
        <CaretRightIcon className="text-fg-tertiary" size={12} />
        <Link to="/expedientes/nuevo" className="text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">Nuevo expediente</Link>
        <CaretRightIcon className="text-fg-tertiary" size={12} />
        <span className="text-xs text-fg-secondary">Desde documento</span>
      </nav>

      <div className="flex flex-1 min-h-0">
        {/* PDF viewer */}
        <div className="flex-1 min-w-0 flex flex-col">
          {files.length > 1 && (
            <div className="flex gap-1 px-3 py-2 border-b border-border shrink-0 overflow-x-auto">
              {files.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedFileIdx(i)}
                  className={[
                    'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors shrink-0',
                    i === selectedFileIdx
                      ? 'bg-bg-muted text-fg-primary'
                      : 'text-fg-tertiary hover:text-fg-secondary hover:bg-bg-subtle',
                  ].join(' ')}
                >
                  <FileTextIcon  size={12} />
                  {f.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 min-h-0">
            <PdfViewer
              file={selectedFile}
              onReplace={handleReplace}
              highlightValues={highlightValues}
            />
          </div>
        </div>

        {/* Panel lateral */}
        <div className="w-96 shrink-0 border-l border-border flex flex-col">
          <div className="mx-4 mt-4 mb-2 shrink-0">
            <div
              className={[
                'flex items-start gap-2.5 px-3.5 py-3 rounded-xl border',
                hasProcesos ? 'bg-ai-tint border-ai-border' : 'bg-bg-subtle border-border',
              ].join(' ')}
            >
              {hasProcesos ? (
                <InfoIcon className="text-ai-text mt-0.5 shrink-0" />
              ) : (
                <WarningIcon className="text-fg-secondary mt-0.5 shrink-0" />
              )}
              <p className={['text-xs leading-relaxed', hasProcesos ? 'text-ai-text' : 'text-fg-body'].join(' ')}>
                {hasProcesos
                  ? `Se encontraron ${response.totalProcesosEncontrados} proceso${response.totalProcesosEncontrados !== 1 ? 's' : ''} en ${response.totalArchivos} archivo${response.totalArchivos !== 1 ? 's' : ''}.${response.omitidos.length ? ` ${response.omitidos.length} archivo${response.omitidos.length !== 1 ? 's' : ''} omitido${response.omitidos.length !== 1 ? 's' : ''}.` : ''}`
                  : 'No se detectaron procesos judiciales en los documentos enviados.'}
              </p>
            </div>
          </div>

          {hasProcesos ? (
            <div ref={panelScrollRef} className="flex-1 overflow-y-auto pb-4 flex flex-col">
              {/* Bulk action bar */}
              {(() => {
                const pendingSelected = [...selectedIndexes].filter(i => createdIds[i] === undefined)
                return (
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
                    <span className="text-xs text-fg-tertiary">
                      {selectedIndexes.size} de {forms.length} seleccionado{forms.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmar}
                      disabled={pendingSelected.length === 0 || bulkCreating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cta-bg text-cta-text rounded-lg hover:bg-cta-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {bulkCreating
                        ? <><CircleNotchIcon className="animate-spin" />Creando...</>
                        : `Crear seleccionados (${pendingSelected.length})`}
                    </button>
                  </div>
                )
              })()}
              <div className="px-4 space-y-2.5">
              {forms.map((form, idx) => (
                <ProcesoCard
                  key={idx}
                  ref={el => { cardRefs.current[idx] = el }}
                  numero={idx + 1}
                  form={form}
                  archivoOrigen={state.archivoOrigen[idx]}
                  isActiveFile={state.archivoOrigen[idx] === selectedFile?.name}
                  isSelected={selectedIndexes.has(idx)}
                  defaultOpen={idx === 0}
                  createdExpedienteId={createdIds[idx]}
                  onFormChange={(f) => handleFormChange(idx, f)}
                  onToggleSelect={() => handleToggleSelect(idx)}
                  onSelectFile={() => {
                    const fileIdx = files.findIndex(f => f.name === state.archivoOrigen[idx])
                    if (fileIdx >= 0) setSelectedFileIdx(fileIdx)
                  }}
                />
              ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <p className="text-xs text-fg-tertiary">
                No se detectaron procesos judiciales en estos documentos.
              </p>
              <button
                type="button"
                onClick={handleReplace}
                className="mt-3 px-3.5 py-2 text-xs font-medium text-fg-body border border-border rounded-lg hover:bg-bg-subtle hover:border-border-strong transition-colors"
              >
                Cargar otros documentos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
