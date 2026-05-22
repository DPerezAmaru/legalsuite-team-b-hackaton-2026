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
  descripcion: z.string().optional(),
  estado: EstadoTareaSchema,
  prioridad: PrioridadSchema,
  fechaVencimiento: z.string().optional(),
  sugeridaPorIA: z.boolean(),
  createdAt: z.string(),
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
  fechaInicio: z.string().nullable().optional(),
  createdAt: z.string(),
  creadoPorId: z.number().nullable().optional(),
  documentoOrigenId: z.number().nullable().optional(),
  partes: z.array(ParteSchema).default([]),
})

// Documento extraído (respuesta de /api/documentos/procesar)

// tareasSugeridas viene como array de strings desde el backend
export const TareaSugeridaSchema = z.string()

// Estructura plana — coincide con DocumentoExtraidoDTO de Spring
export const DocumentoExtraidoSchema = z.object({
  documentoId: z.number(),
  nombreArchivo: z.string().optional(),
  radicado: z.string().nullish().transform(v => v ?? ''),
  titulo: z.string().nullish().transform(v => v ?? ''),
  especialidad: EspecialidadSchema.nullish().transform(v => v ?? 'CIVIL'),
  despacho: z.string().nullish().transform(v => v ?? ''),
  ciudad: z.string().nullish().transform(v => v ?? ''),
  resumen: z.string().optional(),
  partes: z.array(ParteSchema).default([]),
  tareasSugeridas: z.array(TareaSugeridaSchema).default([]),
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
export type TareaSugerida = z.infer<typeof TareaSugeridaSchema>
export type DocumentoExtraido = z.infer<typeof DocumentoExtraidoSchema>

// ─── CHAT API (respuesta de /api/expedientes/chat) ────────────────────────────

export const ChatApiResponseSchema = z.object({
  accion: z.string(),
  mensaje: z.string(),
  datos: z
    .object({
      id: z.number(),
      radicado: z.string(),
      titulo: z.string(),
      especialidad: EspecialidadSchema,
      estado: EstadoExpedienteSchema,
    })
    .passthrough()
    .nullable()
    .optional(),
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
  documentoId: z.number(),
  radicado: z.string(),
  titulo: z.string(),
  especialidad: EspecialidadSchema,
  despacho: z.string(),
  ciudad: z.string(),
  fechaInicio: z.string().optional(),
  partes: z.array(ParteSchema),
})
export type DocumentoFormState = z.infer<typeof DocumentoFormStateSchema>

// ─── ASSISTANT PAGE ───────────────────────────────────────────────────────────

export type AssistantTab = 'asistente'

export const ConsultaTipoSchema = z.enum(['Resumen', 'Consulta', 'Borrador', 'Informe'])
export type ConsultaTipo = z.infer<typeof ConsultaTipoSchema>

export const ConsultaRecienteSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  tipo: ConsultaTipoSchema,
  timestamp: z.string(),
})
export type ConsultaReciente = z.infer<typeof ConsultaRecienteSchema>

export const EstadoDisplaySchema = z.enum(['Activo', 'En revisión', 'Vence pronto'])
export type EstadoDisplay = z.infer<typeof EstadoDisplaySchema>

export const ExpedienteRecienteSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  especialidad: EspecialidadSchema,
  estadoDisplay: EstadoDisplaySchema,
  timestamp: z.string(),
})
export type ExpedienteReciente = z.infer<typeof ExpedienteRecienteSchema>
