# ExpedientIA — Frontend

Cliente web de ExpedientIA: gestión de expedientes legales con asistente IA conversacional, extracción de datos desde PDF, y sugerencias automáticas de tareas. React 19 + TanStack + Tailwind. Hablar con el backend Spring por `/api/*` (proxy en dev, reescritura en deploy).

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

Para que el chat y los expedientes carguen necesitás el backend corriendo en `http://localhost:8080` (proxy configurado en `vite.config.ts`).

| Script | Para qué |
|---|---|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Type-check + build de producción a `dist/` |
| `pnpm preview` | Sirve `dist/` para probar el build |
| `pnpm lint` | ESLint en todo `src/` |
| `pnpm format` | Prettier sobre `src/**/*.{ts,tsx}` |
| `pnpm format:check` | Verifica formato sin escribir |

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| UI | React 19 | Reglas nuevas: `set-state-in-effect`, `use-memo` |
| Routing | TanStack Router | File-based en `src/routes/` (auto-genera `routeTree.gen.ts`) |
| Server state | TanStack Query v5 | Cancelación vía `signal`, invalidación por query keys |
| Client state | Zustand | Un store por dominio en `src/store/` |
| Validación | Zod | Schemas en `src/types/` espejan los contratos del backend |
| Estilos | Tailwind CSS v4 | Tokens semánticos (`bg-bg-base`, `text-fg-primary`, etc.) |
| Build | Vite 8 | `@vitejs/plugin-react` + plugin de TanStack Router |
| HTTP | `fetch` + wrapper propio | `src/lib/http.ts` — ver "Capa HTTP" abajo |

## Estructura

```
src/
├── components/          UI por feature
│   ├── assistant/       chat IA (AssistantPage, MessageDatos, etc.)
│   ├── documentos/      upload + extracción IA + viewer PDF
│   ├── expedientes/     CRUD + drawer + chat por expediente
│   │   └── tareas/      sub-componentes de TareasSection
│   ├── tareas/          vista global de tareas
│   ├── layout/          AppShell, Sidebar, CommandBar
│   └── ui/              primitivos reusables (Input, Select, Badge, Tooltip)
├── hooks/               un hook por endpoint (useExpedientes, useCrearTarea, ...)
├── lib/
│   ├── http.ts          request() + HttpError tipado
│   ├── api-endpoints.ts catálogo único de URLs
│   └── pdfWorker.ts     setup de pdf.js worker
├── routes/              file-based routes de TanStack Router
├── store/               Zustand stores (chat, commandBar, documentos, tema, usuario)
├── styles/              fonts + tokens globales de Tailwind
└── types/               Zod schemas + tipos inferidos (contratos del backend)
```

## Capa HTTP

Toda llamada al backend pasa por `request()`. Ningún hook debe llamar `fetch` directo.

```ts
import { request } from '../lib/http'
import { apiEndpoints } from '../lib/api-endpoints'
import { ExpedienteSchema } from '../types'

const data = await request(apiEndpoints.expedientes.detail(id), {
  schema: ExpedienteSchema,   // valida + tipa la respuesta
  signal,                     // cancelación de React Query
})
```

`request()` se encarga de:

- Manejar JSON vs `FormData` (no setea `Content-Type` cuando es multipart)
- Lanzar `HttpError` con `status` + `code` (RFC 7807 / ProblemDetail)
- Devolver `undefined` en `204 No Content`
- Validar con Zod cuando se pasa `schema`

URLs en `src/lib/api-endpoints.ts` — agrupar por recurso. Nunca hardcodear strings de URL en componentes ni hooks.

## Convenciones

| Tema | Regla |
|---|---|
| Nuevo endpoint | Sumarlo a `apiEndpoints` y crear un hook en `src/hooks/` que use `request()` |
| Schemas Zod | Definir en `src/types/` y reusar — list schemas como `TareasListSchema` están ahí |
| `setState` en `useEffect` | Está prohibido por React 19. Para sync prop→state usar el patrón `prevValue` durante render. Para side-effects on-mount, diferir con `setTimeout(fn, 0)` + cleanup |
| Componentes grandes | Si pasan ~300 líneas o mezclan responsabilidades, partir en sub-carpeta (ver `expedientes/tareas/` como ejemplo) |
| Parameter properties | Prohibidas (`erasableSyntaxOnly: true` en `tsconfig`). Declarar campos y asignar en constructor |
| Comentarios | Solo cuando explican el porqué de algo no obvio. No describir QUÉ hace el código |
| Imports relativos | Sí — el proyecto no usa path aliases |

## Verificación rápida

- [ ] `pnpm dev` levanta sin errores y `/` renderiza el asistente
- [ ] `pnpm build` pasa (incluye `tsc -b`)
- [ ] `pnpm lint` no reporta errores
- [ ] Las páginas principales cargan datos: `/expedientes`, `/tareas`, `/expedientes/nuevo`

## Configuración

| Archivo | Para qué |
|---|---|
| `vite.config.ts` | Proxy `/api → http://localhost:8080`, plugin de TanStack Router |
| `vercel.json` | Reescritura SPA + reglas de `/api` para deploy |
| `tsconfig.app.json` | Config TS de la app (`erasableSyntaxOnly`, strict) |
| `eslint.config.js` | Flat config con `typescript-eslint` + `react-hooks` v7 |
| `.prettierrc` | Formato (2 espacios, single quote, no semicolons, trailing comma) |

## Recursos

- Backend: `../expedientia-backend/`
- Documentación de arquitectura/PRD: `../docs/`
- Capturas/guía visual: `./guide/`
