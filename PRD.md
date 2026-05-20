# PRD — ExpedientIA

> Decisiones técnicas y de producto definidas para el Hackathon LegalSuite 2026.

---

## Nombre

**ExpedientIA** — juego de palabras entre "Expediente" + "IA". Comunica el producto de forma inmediata para el mercado hispanohablante.

---

## Scope

### Core (no negociable)
- Creación de expedientes mediante chat / prompt de lenguaje natural
- Subida de documentos (PDFs judiciales) con extracción automática de campos por IA
- Creación automática del expediente a partir del documento procesado
- Sugerencia de tareas basadas en el contenido del documento (resuelve / descripción)
- Resumen automático del expediente

### Extra (si el tiempo lo permite)
- Módulo de informes: exportar a PDF o Excel mediante prompt de lenguaje natural

---

## Flujo principal (killer demo)

```
Usuario sube PDF
    → Backend envía el documento a Gemini
    → Gemini extrae campos estructurados (partes, radicado, tipo de proceso, etc.)
    → Se crea el expediente automáticamente en base de datos
    → IA sugiere tareas basadas en el resuelve
    → IA genera resumen del caso
    → Usuario revisa y confirma
```

Este es el flujo que gana I2 (Demo funcional, 15 pts) e I3 (Creatividad, 10 pts).

---

## Stack definido

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + TanStack Router + TanStack Query + Zustand + Zod |
| Backend | Spring Boot 3 + Spring AI + JPA + PostgreSQL |
| IA | Gemini Flash (Google AI Studio — tier gratuito) |
| Infraestructura | Docker |

---

## Decisión de API de IA

**Gemini Flash via Spring AI.**

Razones:
- Tier gratuito generoso en Google AI Studio — sin costo, sin aprobación
- Acepta PDFs directamente como input multimodal — no se necesita parser adicional
- Spring AI tiene soporte nativo para Gemini
- Funciona para los dos casos de uso: extracción estructurada y chat conversacional

---

## Spring AI — Los tres patrones que Michael necesita

**1. Chat (creación de expediente por prompt)**
```java
chatClient.prompt("Crear expediente: " + userMessage)
          .call().content();
```

**2. Salida estructurada (extracción de campos del PDF)**
```java
chatClient.prompt(prompt)
          .call().entity(ExpedienteDTO.class);
```

**3. Multimodal (enviar el PDF a Gemini)**
```java
new UserMessage("Extraé los datos", List.of(new Resource(pdfBytes)));
```

Prompt para arrancar con IA/Copilot:
> *"Spring Boot 3 + Spring AI con Gemini Flash. Configurá el `ChatClient` bean, mostrá cómo hacer structured output convirtiendo un PDF a `ExpedienteDTO`, y cómo manejar el modelo de Gemini multimodal. Usá application.properties para la API key."*

---

## División de trabajo

| Persona | Responsabilidad |
|---|---|
| **Daniel** | Frontend: chat UI, formularios, listado de expedientes, tareas, integración con TanStack Query |
| **Michael** | Backend: entidades, endpoints REST, integración Spring AI + Gemini, extracción de PDF, sugerencia de tareas |

---

## Prioridades por día (borrador)

| Día | Daniel | Michael |
|---|---|---|
| 1 | Setup, rutas, layout base | Setup Spring Boot, modelo ER, entidades JPA |
| 2 | Chat UI + pantalla de expediente | Endpoints CRUD + integración Gemini (chat + extracción) |
| 3 | Subida de PDF + tareas + resumen | Endpoint de procesamiento de documento + sugerencia de tareas |
| 4 (hasta 12pm) | Polish, errores, demo | Estabilización, manejo de excepciones, README |

---

## Criterios críticos de la rúbrica a tener en cuenta

- **B1** — Estructura por capas en Spring Boot (mínimo obligatorio ≥ 4 pts)
- **F1** — Tipado estricto en TypeScript (mínimo obligatorio ≥ 4 pts)
- **I1** — Integración real back-front, sin mocks (mínimo obligatorio ≥ 4 pts)
- **I5** — Ambos integrantes con commits visibles (mínimo obligatorio > 0)
