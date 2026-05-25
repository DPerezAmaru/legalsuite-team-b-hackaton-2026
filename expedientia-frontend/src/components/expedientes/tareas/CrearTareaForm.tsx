import { useState } from 'react'
import type { FormEvent } from 'react'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import type { CrearTareaPayload } from '../../../hooks/useCrearTarea'
import type { EstadoTarea, Prioridad } from '../../../types'

interface CrearTareaFormProps {
  expedienteId: number
  onCrear: (p: CrearTareaPayload) => Promise<unknown>
  onClose: () => void
}

export function CrearTareaForm({ expedienteId, onCrear, onClose }: CrearTareaFormProps) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState<EstadoTarea>('PENDIENTE')
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setLoading(true)
    try {
      await onCrear({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        estado,
        prioridad,
        fechaVencimiento: fechaVencimiento || undefined,
        sugeridaPorIa: false,
        expedienteId,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border px-4 py-4 space-y-4">
      <p className="text-xs font-medium text-fg-secondary">Nueva tarea</p>

      <Input
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        placeholder="Título"
        required
      />

      <Input
        value={descripcion}
        onChange={e => setDescripcion(e.target.value)}
        placeholder="Descripción (opcional)"
      />

      <div className="grid grid-cols-3 gap-4">
        <Select
          label="Prioridad"
          value={prioridad}
          onChange={e => setPrioridad(e.target.value as Prioridad)}
        >
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="BAJA">Baja</option>
        </Select>
        <Select
          label="Estado"
          value={estado}
          onChange={e => setEstado(e.target.value as EstadoTarea)}
        >
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROGRESO">En progreso</option>
          <option value="COMPLETADA">Completada</option>
        </Select>
        <Input
          label="Vencimiento"
          type="date"
          value={fechaVencimiento}
          onChange={e => setFechaVencimiento(e.target.value)}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-fg-secondary hover:text-fg-primary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!titulo.trim() || loading}
          className="text-xs font-medium text-fg-primary border-b border-fg-primary pb-px hover:text-fg-secondary hover:border-fg-secondary transition-colors disabled:opacity-40"
        >
          Crear tarea
        </button>
      </div>
    </form>
  )
}
