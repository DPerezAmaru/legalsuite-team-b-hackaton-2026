export const apiEndpoints = {
  expedientes: {
    list: '/api/expedientes',
    detail: (id: number | string) => `/api/expedientes/${id}`,
    create: '/api/expedientes',
  },
  tareas: {
    porExpediente: (expedienteId: number) => `/api/tareas?expedienteId=${expedienteId}`,
    todas: '/api/tareas/todas',
    create: '/api/tareas',
    update: (id: number) => `/api/tareas/${id}`,
    remove: (id: number) => `/api/tareas/${id}`,
  },
  documentos: {
    contexto: '/api/documentos/contexto',
    bulkAnalizar: '/api/documentos/bulk/analizar',
    bulkConfirmar: '/api/documentos/bulk/confirmar',
  },
  chat: {
    send: (usuarioId?: number | null) =>
      usuarioId ? `/api/chat?usuarioId=${usuarioId}` : '/api/chat',
  },
} as const
