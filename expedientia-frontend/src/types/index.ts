import { z } from 'zod'

// Enums

export const EspecialidadSchema = z.enum(['CIVIL', 'PENAL', 'LABORAL', 'ADMINISTRATIVO', 'FAMILIA'])
export const EstadoExpedienteSchema = z.enum(['ACTIVO', 'CERRADO', 'ARCHIVADO'])
export const TipoParticipacionSchema = z.enum(['DEMANDANTE', 'DEMANDADO', 'APODERADO', 'TERCERO'])
export const EstadoTareaSchema = z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'])
export const PrioridadSchema = z.enum(['ALTA', 'MEDIA', 'BAJA'])

// Parte

export const ParteSchema = z.object({
  id: z.number().optional(),
  nombre: z.string(),
  identificacion: z.string().nullable().optional(),
  tipoParticipacion: TipoParticipacionSchema,
})

// Tarea

export const TareaSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  descripcion: z.string().nullable().optional(),
  estado: EstadoTareaSchema,
  prioridad: PrioridadSchema,
  fechaVencimiento: z.string().nullable().optional(),
  sugeridaPorIa: z.boolean(),
  asignadoAId: z.number().nullable().optional(),
  expedienteId: z.number().optional(),
  createdAt: z.string().optional(),
})

// Expediente

export const ExpedienteSchema = z.object({
  id: z.number(),
  radicado: z.string(),
  titulo: z.string(),
  especialidad: EspecialidadSchema,
  despacho: z.string().nullable().optional(),
  ciudad: z.string().nullable().optional(),
  estado: EstadoExpedienteSchema,
  resumen: z.string().nullable().optional(),
  resuelve: z.string().nullable().optional(),
  fechaInicio: z.string().nullable().optional(),
  createdAt: z.string(),
  creadoPorId: z.number().nullable().optional(),
  documentoOrigenId: z.number().nullable().optional(),
  partes: z.array(ParteSchema).default([]),
})

// Procesar documento (respuesta de POST /api/documentos/procesar)

export const ProcesoSugeridoSchema = z.object({
  radicado: z.string().nullish().transform(v => v ?? ''),
  titulo: z.string().nullish().transform(v => v ?? ''),
  especialidad: EspecialidadSchema.nullish().transform(v => v ?? 'CIVIL'),
  estado: EstadoExpedienteSchema.nullish().transform(v => v ?? 'ACTIVO'),
  despacho: z.string().nullish().transform(v => v ?? ''),
  ciudad: z.string().nullish().transform(v => v ?? ''),
  resumen: z.string().nullish().transform(v => v ?? ''),
  resuelve: z.string().nullish().transform(v => v ?? ''),
  partes: z.array(ParteSchema).default([]),
})

export const BulkProcesoSchema = z.object({
  indice: z.number(),
  archivoOrigen: z.string(),
  datos: ProcesoSugeridoSchema,
})

export const ProcesarDocumentoResponseSchema = z.object({
  totalArchivos: z.number().default(0),
  totalProcesosEncontrados: z.number().default(0),
  procesos: z.array(BulkProcesoSchema).default([]),
  omitidos: z.array(z.string()).default([]),
  promptCombinado: z.string().nullish().transform(v => v ?? ''),
})

// Tipos inferidos

export type Especialidad = z.infer<typeof EspecialidadSchema>
export type EstadoExpediente = z.infer<typeof EstadoExpedienteSchema>
export type TipoParticipacion = z.infer<typeof TipoParticipacionSchema>
export type EstadoTarea = z.infer<typeof EstadoTareaSchema>
export type Prioridad = z.infer<typeof PrioridadSchema>
export type Parte = z.infer<typeof ParteSchema>
export type Tarea = z.infer<typeof TareaSchema>
export type Expediente = z.infer<typeof ExpedienteSchema>
export type ProcesoSugerido = z.infer<typeof ProcesoSugeridoSchema>
export type BulkProceso = z.infer<typeof BulkProcesoSchema>
export type ProcesarDocumentoResponse = z.infer<typeof ProcesarDocumentoResponseSchema>

// ─── CHAT API (respuesta de /api/chat) ───────────────────────────────────────

export const ChatApiResponseSchema = z.object({
  accion: z.string(),
  mensaje: z.string(),
  datos: z.unknown().optional(),
})
export type ChatApiResponse = z.infer<typeof ChatApiResponseSchema>

// ─── ASSISTANT CHAT ───────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  attachmentName?: string
  timestamp: Date
  actionLink?: { to: string; label: string }
}

// ─── DOCUMENTOS / CREAR EXPEDIENTE ────────────────────────────────────────────

export const CreateExpedientePayloadSchema = z.object({
  radicado: z.string(),
  titulo: z.string(),
  especialidad: EspecialidadSchema,
  despacho: z.string().optional(),
  ciudad: z.string().optional(),
  estado: EstadoExpedienteSchema.optional(),
  resumen: z.string().optional(),
  fechaInicio: z.string().optional(),
  documentoOrigenId: z.number().optional(),
  partes: z.array(ParteSchema).optional(),
})
export type CreateExpedientePayload = z.infer<typeof CreateExpedientePayloadSchema>

export const DocumentoFormStateSchema = z.object({
  radicado: z.string(),
  titulo: z.string(),
  especialidad: EspecialidadSchema,
  estado: EstadoExpedienteSchema,
  despacho: z.string(),
  ciudad: z.string(),
  resumen: z.string(),
  resuelve: z.string(),
  fechaInicio: z.string().optional(),
  partes: z.array(ParteSchema),
})
export type DocumentoFormState = z.infer<typeof DocumentoFormStateSchema>

export const BulkConfirmarResponseSchema = z.object({
  totalCreados: z.number(),
  totalOmitidos: z.number(),
  expedientes: z.array(ExpedienteSchema).default([]),
  omitidos: z.array(z.unknown()).default([]),
})
export type BulkConfirmarResponse = z.infer<typeof BulkConfirmarResponseSchema>

export type TareaSugerida = {
  id: number
  texto: string
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
}

export type ExpedienteCreadoConTareas = {
  expedienteId: number
  titulo: string
  radicado: string
  especialidad: Especialidad
  tareasSugeridas: TareaSugerida[]
}

// ─── CHAT HISTORIAL ──────────────────────────────────────────────────────────

export interface HistorialEntrada {
  rol: 'usuario' | 'asistente'
  contenido: string
}
