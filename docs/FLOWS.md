# Flujos y contratos de endpoints — ExpedientIA

---

## Flujo 1 — Crear expediente por chat

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend
    participant BE as Backend
    participant AI as Gemini (Spring AI)
    participant DB as PostgreSQL

    U->>FE: Escribe prompt en el chat
    FE->>BE: POST /api/expedientes/chat { prompt }
    BE->>AI: chatClient.prompt(prompt).call().entity(ExpedienteDTO)
    AI-->>BE: ExpedienteDTO { radicado, titulo, especialidad, partes[], ... }
    BE->>DB: INSERT expediente + partes
    DB-->>BE: expediente creado con id
    BE-->>FE: 201 ExpedienteResponse { id, radicado, ... }
    FE->>U: Redirige al detalle del expediente
```

### POST /api/expedientes/chat

**Request**
```json
{
  "prompt": "Crear expediente penal contra Juan García, radicado 2026-00412, juzgado 3 civil del circuito de Bogotá"
}
```

**Response 201**
```json
{
  "id": 1,
  "radicado": "2026-00412",
  "titulo": "García vs. Municipio",
  "especialidad": "PENAL",
  "despacho": "Juzgado 3 Civil del Circuito",
  "ciudad": "Bogotá",
  "estado": "ACTIVO",
  "resumen": "Proceso penal iniciado contra Juan García...",
  "partes": [
    { "nombre": "Juan García", "tipoParticipacion": "DEMANDADO" }
  ],
  "createdAt": "2026-05-20T10:00:00"
}
```

---

## Flujo 2 — Crear expediente desde documento (flujo principal de la demo)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend
    participant BE as Backend
    participant AI as Gemini (Spring AI)
    participant DB as PostgreSQL

    U->>FE: Sube el PDF
    FE->>BE: POST /api/documentos/procesar (multipart PDF)
    BE->>AI: Envía PDF como input multimodal
    AI-->>BE: Campos extraídos + tareas sugeridas
    BE->>DB: INSERT documento (estado = PROCESADO)
    DB-->>BE: documento { id }
    BE-->>FE: 200 DocumentoExtraidoDTO { documentoId, campos, tareasSugeridas[] }

    FE->>U: Muestra campos para revisar y editar
    U->>FE: Confirma o ajusta los datos
    FE->>BE: POST /api/expedientes { ...campos, documentoId, tareas[] }
    BE->>DB: INSERT expediente + partes + UPDATE documento.expediente_origen
    BE->>DB: INSERT tareas confirmadas
    DB-->>BE: expediente creado con id
    BE-->>FE: 201 ExpedienteResponse { id, ... }
    FE->>U: Redirige al detalle del expediente
```

### POST /api/documentos/procesar

**Request** — `multipart/form-data`
```
file: [binary PDF]
```

**Response 200**
```json
{
  "documentoId": 7,
  "nombreArchivo": "auto-admisorio.pdf",
  "camposExtraidos": {
    "radicado": "2026-00412",
    "titulo": "García vs. Municipio de Bogotá",
    "especialidad": "CIVIL",
    "despacho": "Juzgado 3 Civil del Circuito",
    "ciudad": "Bogotá",
    "fechaInicio": "2026-05-15",
    "partes": [
      { "nombre": "Juan García", "identificacion": "1234567", "tipoParticipacion": "DEMANDANTE" },
      { "nombre": "Municipio de Bogotá", "identificacion": "8994567", "tipoParticipacion": "DEMANDADO" }
    ]
  },
  "tareasSugeridas": [
    { "titulo": "Radicar respuesta al auto", "prioridad": "ALTA" },
    { "titulo": "Notificar a las partes", "prioridad": "MEDIA" }
  ]
}
```

---

### POST /api/expedientes

Usado tanto para confirmar la extracción del documento como para crear manualmente.

**Request**
```json
{
  "radicado": "2026-00412",
  "titulo": "García vs. Municipio de Bogotá",
  "especialidad": "CIVIL",
  "despacho": "Juzgado 3 Civil del Circuito",
  "ciudad": "Bogotá",
  "fechaInicio": "2026-05-15",
  "partes": [
    { "nombre": "Juan García", "identificacion": "1234567", "tipoParticipacion": "DEMANDANTE" },
    { "nombre": "Municipio de Bogotá", "identificacion": "8994567", "tipoParticipacion": "DEMANDADO" }
  ],
  "documentoOrigenId": 7,
  "tareas": [
    { "titulo": "Radicar respuesta al auto", "prioridad": "ALTA" }
  ]
}
```

> `documentoOrigenId` y `tareas` son opcionales.

**Response 201** — igual que en `/chat`

---

## Flujo 3 — Consulta y gestión de expedientes

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Abre la lista de expedientes
    FE->>BE: GET /api/expedientes
    BE->>DB: SELECT expedientes
    DB-->>BE: lista
    BE-->>FE: 200 ExpedienteResponse[]

    U->>FE: Abre un expediente
    FE->>BE: GET /api/expedientes/{id}
    BE->>DB: SELECT expediente + partes + tareas
    DB-->>BE: detalle completo
    BE-->>FE: 200 ExpedienteDetalleResponse
```

### GET /api/expedientes

**Response 200**
```json
[
  {
    "id": 1,
    "radicado": "2026-00412",
    "titulo": "García vs. Municipio",
    "especialidad": "CIVIL",
    "estado": "ACTIVO",
    "tareasPendientes": 2,
    "createdAt": "2026-05-20T10:00:00"
  }
]
```

### GET /api/expedientes/{id}

**Response 200**
```json
{
  "id": 1,
  "radicado": "2026-00412",
  "titulo": "García vs. Municipio",
  "especialidad": "CIVIL",
  "despacho": "Juzgado 3 Civil del Circuito",
  "ciudad": "Bogotá",
  "estado": "ACTIVO",
  "resumen": "Proceso civil iniciado por Juan García...",
  "fechaInicio": "2026-05-15",
  "partes": [ ... ],
  "tareas": [ ... ],
  "createdAt": "2026-05-20T10:00:00"
}
```

---

## Flujo 4 — Tareas

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Crea una tarea manualmente
    FE->>BE: POST /api/expedientes/{id}/tareas { titulo, prioridad, fechaVencimiento }
    BE->>DB: INSERT tarea (sugeridaPorIA = false)
    DB-->>BE: tarea creada
    BE-->>FE: 201 TareaResponse

    U->>FE: Marca tarea como completada
    FE->>BE: PUT /api/tareas/{id} { estado: "COMPLETADA" }
    BE->>DB: UPDATE tarea
    DB-->>BE: ok
    BE-->>FE: 200 TareaResponse
```

### POST /api/expedientes/{id}/tareas

**Request**
```json
{
  "titulo": "Radicar respuesta al auto",
  "descripcion": "Redactar y radicar la respuesta antes del vencimiento",
  "prioridad": "ALTA",
  "fechaVencimiento": "2026-05-25"
}
```

**Response 201**
```json
{
  "id": 3,
  "titulo": "Radicar respuesta al auto",
  "estado": "PENDIENTE",
  "prioridad": "ALTA",
  "fechaVencimiento": "2026-05-25",
  "sugeridaPorIA": false,
  "createdAt": "2026-05-20T10:00:00"
}
```

### PUT /api/tareas/{id}

**Request**
```json
{
  "estado": "COMPLETADA"
}
```

**Response 200** — TareaResponse actualizada

---

## Resumen visual de los dos flujos de creación

```mermaid
flowchart TD
    A([Usuario quiere crear expediente]) --> B{¿Cómo?}

    B -->|Por prompt| C[Escribe descripción en el chat]
    C --> D[POST /api/expedientes/chat]
    D --> E[Gemini estructura los datos]
    E --> F[(Expediente + Partes guardados)]
    F --> G([Detalle del expediente])

    B -->|Desde documento| H[Sube PDF]
    H --> I[POST /api/documentos/procesar]
    I --> J[Gemini extrae campos y sugiere tareas]
    J --> K[(Documento guardado)]
    K --> L[Usuario revisa y confirma]
    L --> M[POST /api/expedientes con documentoId]
    M --> N[(Expediente + Partes + Tareas guardados)]
    N --> G
```
