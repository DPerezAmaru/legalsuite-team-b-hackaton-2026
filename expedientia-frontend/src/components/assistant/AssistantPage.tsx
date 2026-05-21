import { useState } from 'react'
import type { AssistantTab, ConsultaReciente, ExpedienteReciente } from '../../types'
import { AssistantTabs } from './AssistantTabs'
import { AssistantInput } from './AssistantInput'
import { AssistantSuggestions } from './AssistantSuggestions'
import { RecentConsultations } from './RecentConsultations'
import { RecentExpedientes } from './RecentExpedientes'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const CONSULTAS_MOCK: ConsultaReciente[] = [
  { id: '1', titulo: 'Resumir auto admisorio · García y Asoc.', tipo: 'Resumen',  timestamp: 'Hace 14 min' },
  { id: '2', titulo: '¿Qué actuaciones vencen esta semana?',    tipo: 'Consulta', timestamp: 'Hoy 09:12'  },
  { id: '3', titulo: 'Generar contestación · Constructora L.A.', tipo: 'Borrador', timestamp: 'Ayer'      },
  { id: '4', titulo: 'Informe de cartera por especialidad',      tipo: 'Informe',  timestamp: 'Lun'       },
]

const EXPEDIENTES_MOCK: ExpedienteReciente[] = [
  { id: '1', nombre: 'García y Asociados S.A.', especialidad: 'CIVIL',   estadoDisplay: 'Activo',       timestamp: 'hace 2 h' },
  { id: '2', nombre: 'Constructora Los Andes',  especialidad: 'CIVIL',   estadoDisplay: 'En revisión',  timestamp: 'hace 5 h' },
  { id: '3', nombre: 'Ramírez Mora, Carlos',    especialidad: 'LABORAL', estadoDisplay: 'Vence pronto', timestamp: '19 may'   },
]

export function AssistantPage() {
  const [activeTab, setActiveTab] = useState<AssistantTab>('asistente')
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    // TODO: conectar con AI API
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg-primary">
            {getGreeting()}, Juan.
          </h1>
          <p className="mt-1 text-sm text-fg-secondary">
            Pregunte, suba un documento o genere un borrador.
          </p>
        </div>

        {/* Input card */}
        <div className="space-y-3">
          <AssistantTabs active={activeTab} onChange={setActiveTab} />
          <AssistantInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            tab={activeTab}
          />
          <AssistantSuggestions onSelect={setInputValue} />
        </div>

        {/* Recent sections */}
        <RecentConsultations items={CONSULTAS_MOCK} />
        <RecentExpedientes   items={EXPEDIENTES_MOCK} />

      </div>
    </div>
  )
}
