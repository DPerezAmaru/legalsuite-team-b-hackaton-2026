import { z } from 'zod'
import { PrioridadSchema, type Prioridad } from '../../../types'

export interface TareaSugerida {
  tmpId: number
  titulo: string
  descripcion?: string
  prioridad: Prioridad
}

const TareaSugeridaApiSchema = z
  .object({
    id: z.number().optional(),
    titulo: z.string().optional(),
    descripcion: z.string().optional(),
    prioridad: PrioridadSchema.optional(),
  })
  .passthrough()

export function parseSugerencias(datos: unknown): TareaSugerida[] {
  const parsed = z.array(TareaSugeridaApiSchema).safeParse(datos)
  if (!parsed.success) return []
  return parsed.data.map((item, i) => ({
    tmpId: item.id ?? i,
    titulo: item.titulo ?? `Tarea ${i + 1}`,
    descripcion: item.descripcion,
    prioridad: item.prioridad ?? 'MEDIA',
  }))
}
