import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { CircleNotch, Info, Warning, UploadSimple, Sparkle, FolderPlus, CaretRight } from '@phosphor-icons/react'
import { UploadZone } from './UploadZone'
import { PdfViewer } from './PdfViewer'
import { ProcesoCard } from './ProcesoCard'
import { useDocumentoProcesar } from '../../hooks/useDocumentoProcesar'
import { useCrearExpediente } from '../../hooks/useCrearExpediente'
import { useDocumentosStore } from '../../store/documentosStore'
import type {
  DocumentoFormState,
  ProcesoSugerido,
  ProcesarDocumentoResponse,
} from '../../types'

type PageState =
  | { stage: 'idle' }
  | { stage: 'processing'; file: File }
  | {
      stage: 'review'
      file: File
      response: ProcesarDocumentoResponse
      forms: DocumentoFormState[]
      createdIds: Record<number, number>
    }

function procesoToForm(proceso: ProcesoSugerido): DocumentoFormState {
  return {
    radicado: proceso.radicado,
    titulo: proceso.titulo,
    especialidad: proceso.especialidad,
    estado: proceso.estado,
    despacho: proceso.despacho,
    ciudad: proceso.ciudad,
    resumen: proceso.resumen,
    partes: proceso.partes,
  }
}

export function DocumentosPage() {
  const [state, setState] = useState<PageState>({ stage: 'idle' })
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null)
  const { mutateAsync: procesarDocumento } = useDocumentoProcesar()
  const { mutate: crearExpediente } = useCrearExpediente()
  const consumePendingFile = useDocumentosStore(s => s.consumePendingFile)

  const handleFile = useCallback(
    async (file: File) => {
      setState({ stage: 'processing', file })
      try {
        const response = await procesarDocumento(file)
        const forms = response.procesos.map(procesoToForm)
        setState({ stage: 'review', file, response, forms, createdIds: {} })
      } catch {
        setState({
          stage: 'review',
          file,
          response: {
            numeroExpedientesEncontrados: 0,
            sugerenciaTexto:
              'No se pudo procesar el documento. Cargá otro o revisá manualmente.',
            procesos: [],
            promptsSugeridos: [],
          },
          forms: [],
          createdIds: {},
        })
      }
    },
    [procesarDocumento],
  )

  useEffect(() => {
    const file = consumePendingFile()
    if (file) handleFile(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFormChange = useCallback((index: number, form: DocumentoFormState) => {
    setState((prev) => {
      if (prev.stage !== 'review') return prev
      return { ...prev, forms: prev.forms.map((f, i) => (i === index ? form : f)) }
    })
  }, [])

  const handleCrear = useCallback(
    (index: number) => {
      if (state.stage !== 'review') return
      const form = state.forms[index]
      if (!form) return
      setCreatingIndex(index)
      crearExpediente(
        {
          radicado: form.radicado,
          titulo: form.titulo,
          especialidad: form.especialidad,
          despacho: form.despacho || undefined,
          ciudad: form.ciudad || undefined,
          estado: form.estado,
          resumen: form.resumen || undefined,
          fechaInicio: form.fechaInicio,
          partes: form.partes,
        },
        {
          onSuccess: (exp) => {
            setState((prev) =>
              prev.stage === 'review'
                ? { ...prev, createdIds: { ...prev.createdIds, [index]: exp.id } }
                : prev,
            )
          },
          onSettled: () => setCreatingIndex(null),
        },
      )
    },
    [state, crearExpediente],
  )

  const handleReplace = useCallback(() => {
    setState({ stage: 'idle' })
    setCreatingIndex(null)
  }, [])

  // Valores a resaltar en el PDF — unión de todas las cards, mínimo 4 chars
  const highlightValues = useMemo(() => {
    if (state.stage !== 'review') return []
    const vals: string[] = []
    for (const f of state.forms) {
      vals.push(f.radicado, f.despacho, f.ciudad, f.fechaInicio ?? '')
      for (const p of f.partes) {
        vals.push(p.nombre)
        if (p.identificacion) vals.push(p.identificacion)
      }
    }
    return vals.filter((v) => typeof v === 'string' && v.trim().length >= 4)
  }, [state])

  if (state.stage === 'idle') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

          <div>
            <h1 className="text-2xl font-bold text-fg-primary">Crear expediente desde documento</h1>
            <p className="mt-1 text-sm text-fg-secondary">
              Subí un PDF judicial y la IA extrae el radicado, las partes y el juzgado automáticamente.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <UploadSimple />, step: '1', title: 'Subí el PDF', desc: 'Cualquier documento judicial en formato PDF.' },
              { icon: <Sparkle />,      step: '2', title: 'La IA analiza', desc: 'Extrae radicado, partes, juzgado y más.' },
              { icon: <FolderPlus />,   step: '3', title: 'Creá el expediente', desc: 'Revisá los datos y confirmá con un clic.' },
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

          <UploadZone onFile={handleFile} />

        </div>
      </div>
    )
  }

  if (state.stage === 'processing') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <CircleNotch className="animate-spin text-fg-secondary" />
        <p className="text-sm text-fg-secondary">Analizando documento con IA...</p>
        <p className="text-xs text-fg-tertiary">{state.file.name}</p>
      </div>
    )
  }

  const { response, forms, createdIds } = state
  const hasProcesos = forms.length > 0

  return (
    <div className="flex flex-col h-full">
      <nav className="flex items-center gap-1 px-4 py-2 border-b border-border shrink-0">
        <Link to="/expedientes" className="text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">Expedientes</Link>
        <CaretRight className="text-fg-tertiary" size={12} />
        <Link to="/expedientes/nuevo" className="text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">Nuevo expediente</Link>
        <CaretRight className="text-fg-tertiary" size={12} />
        <span className="text-xs text-fg-secondary">Desde documento</span>
      </nav>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <PdfViewer
            file={state.file}
            onReplace={handleReplace}
            highlightValues={highlightValues}
          />
        </div>
        <div className="w-96 shrink-0 border-l border-border flex flex-col">
          <div className="mx-4 mt-4 mb-2 shrink-0">
            <div
              className={[
                'flex items-start gap-2.5 px-3.5 py-3 rounded-xl border',
                hasProcesos ? 'bg-ai-tint border-ai-border' : 'bg-bg-subtle border-border',
              ].join(' ')}
            >
              {hasProcesos ? (
                <Info className="text-ai-text mt-0.5 shrink-0" />
              ) : (
                <Warning className="text-fg-secondary mt-0.5 shrink-0" />
              )}
              <p
                className={[
                  'text-xs leading-relaxed',
                  hasProcesos ? 'text-ai-text' : 'text-fg-body',
                ].join(' ')}
              >
                {response.sugerenciaTexto ||
                  (hasProcesos
                    ? 'Documento procesado.'
                    : 'Este documento no parece ser judicial.')}
              </p>
            </div>
          </div>

          {hasProcesos ? (
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
              {forms.map((form, idx) => (
                <ProcesoCard
                  key={idx}
                  numero={idx + 1}
                  form={form}
                  defaultOpen={idx === 0}
                  createdExpedienteId={createdIds[idx]}
                  isCreating={creatingIndex === idx}
                  onFormChange={(f) => handleFormChange(idx, f)}
                  onCrear={() => handleCrear(idx)}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <p className="text-xs text-fg-tertiary">
                No se detectaron procesos judiciales en este documento.
              </p>
              <button
                type="button"
                onClick={handleReplace}
                className="mt-3 px-3.5 py-2 text-xs font-medium text-fg-body border border-border rounded-lg hover:bg-bg-subtle hover:border-border-strong transition-colors"
              >
                Cargar otro documento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
