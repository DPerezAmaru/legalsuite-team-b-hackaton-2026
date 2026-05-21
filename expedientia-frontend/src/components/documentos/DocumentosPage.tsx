import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { UploadZone } from './UploadZone'
import { PdfViewer } from './PdfViewer'
import { ExtraccionPanel } from './ExtraccionPanel'
import { useDocumentoProcesar } from '../../hooks/useDocumentoProcesar'
import { useCrearExpediente } from '../../hooks/useCrearExpediente'
import type { DocumentoFormState, DocumentoExtraido } from '../../types'

type PageState =
  | { stage: 'idle' }
  | { stage: 'processing'; file: File }
  | { stage: 'review'; file: File; fileUrl: string; form: DocumentoFormState }

function toFormState(doc: DocumentoExtraido): DocumentoFormState {
  return {
    documentoId: doc.documentoId,
    radicado: doc.camposExtraidos.radicado,
    titulo: doc.camposExtraidos.titulo,
    especialidad: doc.camposExtraidos.especialidad,
    despacho: doc.camposExtraidos.despacho,
    ciudad: doc.camposExtraidos.ciudad,
    fechaInicio: doc.camposExtraidos.fechaInicio,
    partes: doc.camposExtraidos.partes,
  }
}

function emptyForm(file: File): DocumentoFormState {
  return {
    documentoId: 0,
    radicado: '',
    titulo: file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' '),
    especialidad: 'CIVIL',
    despacho: '',
    ciudad: '',
    partes: [],
  }
}

export function DocumentosPage() {
  const [state, setState] = useState<PageState>({ stage: 'idle' })
  const { mutateAsync: procesarDocumento } = useDocumentoProcesar()
  const { mutate: crearExpediente, isPending: isCreating } = useCrearExpediente()
  const navigate = useNavigate()

  const handleFile = useCallback(
    async (file: File) => {
      const fileUrl = URL.createObjectURL(file)
      setState({ stage: 'processing', file })
      try {
        const doc = await procesarDocumento(file)
        setState({ stage: 'review', file, fileUrl, form: toFormState(doc) })
      } catch {
        // Backend endpoint no disponible aún — pasar a revisión manual
        setState({ stage: 'review', file, fileUrl, form: emptyForm(file) })
      }
    },
    [procesarDocumento],
  )

  const handleFormChange = useCallback((form: DocumentoFormState) => {
    setState((prev) => (prev.stage === 'review' ? { ...prev, form } : prev))
  }, [])

  const handleCrear = useCallback(() => {
    if (state.stage !== 'review') return
    const { form } = state
    crearExpediente(
      {
        radicado: form.radicado,
        titulo: form.titulo,
        especialidad: form.especialidad,
        despacho: form.despacho || undefined,
        ciudad: form.ciudad || undefined,
        estado: 'ACTIVO',
        fechaInicio: form.fechaInicio,
        documentoOrigenId: form.documentoId || undefined,
        partes: form.partes,
      },
      {
        onSuccess: (exp) =>
          navigate({ to: '/expedientes/$expedienteId', params: { expedienteId: String(exp.id) } }),
      },
    )
  }, [state, crearExpediente, navigate])

  const handleReplace = useCallback(() => {
    if (state.stage === 'review') URL.revokeObjectURL(state.fileUrl)
    setState({ stage: 'idle' })
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

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border shrink-0">
        <span className="text-xs text-fg-tertiary">Asistente</span>
        <span className="text-xs text-fg-tertiary">/</span>
        <span className="text-xs text-fg-secondary">Crear desde documento</span>
      </div>

      {/* 2 columnas */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <PdfViewer
            file={state.file}
            fileUrl={state.fileUrl}
            onReplace={handleReplace}
          />
        </div>
        <div className="w-96 shrink-0">
          <ExtraccionPanel
            form={state.form}
            onFormChange={handleFormChange}
            onCrear={handleCrear}
            onRevisarManualmente={handleReplace}
            isCreating={isCreating}
          />
        </div>
      </div>
    </div>
  )
}
