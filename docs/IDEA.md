# ExpedientIA

> Gestión de expedientes judiciales potenciada por IA generativa.

---

## El problema

Crear y gestionar expedientes judiciales es un proceso manual, repetitivo y propenso a errores. Los equipos legales invierten horas ingresando datos que ya existen en documentos físicos o digitales, y luego más tiempo decidiendo qué tareas crear a partir de cada caso.

---

## La solución

**ExpedientIA** lleva la IA generativa al corazón del flujo de trabajo legal. En lugar de formularios y botones, el usuario interactúa con lenguaje natural — como si hablara con un asistente — y el sistema hace el resto.

---

## Módulos

### 1. Expedientes por prompt
El usuario describe el caso en lenguaje natural y la IA crea el expediente completo con todos sus campos, aplicando las reglas internas del despacho.

```
"Crear expediente penal contra Juan García, radicado 2026-00412,
 juzgado 3 civil del circuito de Bogotá"
```

### 2. Creación desde documentos
El usuario sube un auto o documento judicial (PDF). La IA extrae automáticamente:
- Partes del proceso (demandante, demandado, apoderados)
- Número de radicado
- Tipo y especialidad del proceso
- Juzgado y ciudad
- Fechas relevantes

Con esa información crea el expediente sin intervención manual.

### 3. Tareas sugeridas por IA
A partir del contenido del documento — especialmente el *resuelve* o la descripción — la IA propone tareas concretas con fechas y responsables sugeridos. El usuario acepta, ajusta o descarta.

### 4. Resumen del expediente
Cada expediente incluye un resumen generado por IA que responde en segundos a: *¿de qué trata este caso?*

### 5. Informes *(extra)*
El usuario describe en lenguaje natural el informe que necesita y el sistema lo exporta en PDF o Excel con estadísticas, listados y datos relevantes.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + TanStack Router/Query + Zustand + Zod |
| Backend | Spring Boot + Spring AI + JPA + PostgreSQL |
| IA | Gemini Flash (Google AI Studio — tier gratuito) |
| Infraestructura | Docker |

---

## Equipo

| Persona | Rol |
|---|---|
| Daniel | Frontend |
| Michael | Backend + IA |

---

## Flujo principal (demo)

```
Usuario sube PDF
    → Spring AI envía el documento a Gemini
    → Gemini extrae campos estructurados
    → Se crea el expediente automáticamente
    → IA sugiere tareas basadas en el resuelve
    → IA genera resumen del caso
    → Usuario revisa y confirma
```
