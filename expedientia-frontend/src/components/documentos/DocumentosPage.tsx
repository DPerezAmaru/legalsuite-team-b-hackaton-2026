import { useState, useCallback, useMemo } from 'react'
import { Loader2, Info, AlertTriangle } from 'lucide-react'
import { UploadZone } from './UploadZone'
import { PdfViewer } from './PdfViewer'
import { ProcesoCard } from './ProcesoCard'
import { useDocumentoProcesar } from '../../hooks/useDocumentoProcesar'
import { useCrearExpediente } from '../../hooks/useCrearExpediente'
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
      <div className="h-full">
        <UploadZone onFile={handleFile} />
      </div>
    )
  }

  if (state.stage === 'processing') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-fg-secondary" />
        <p className="text-sm text-fg-secondary">Analizando documento con IA...</p>
        <p className="text-xs text-fg-tertiary">{state.file.name}</p>
      </div>
    )
  }

  const { response, forms, createdIds } = state
  const hasProcesos = forms.length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border shrink-0">
        <span className="text-xs text-fg-tertiary">Asistente</span>
        <span className="text-xs text-fg-tertiary">/</span>
        <span className="text-xs text-fg-secondary">Crear desde documento</span>
      </div>

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
                <Info size={14} className="text-ai-text mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-fg-secondary mt-0.5 shrink-0" />
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
