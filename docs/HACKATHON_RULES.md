# LegalSuite Hackathon 2026 — Reglas y Rúbrica

---

## Objetivo

Hackathon educativo donde cada equipo propone su proyecto y lo construye en 4 días. El código debe reflejar buenas prácticas reales de la industria.

---

## Agenda

| Día | Nombre | Qué pasa |
|---|---|---|
| 1 | Kick-off & Diseño | Propuesta, arquitectura y primer commit de ambos integrantes |
| 2 | Construcción core | Sprint de desarrollo. Check-in de mentoría al mediodía (15 min, sin puntaje). Mínimo 4 endpoints funcionales al final del día |
| 3 | Integración & Polish | Frontend conecta con backend real (sin mocks). Al menos un flujo completo de punta a punta. README y ensayo de demo (máx. 12 min) |
| 4 | Demo Day | **Code freeze 12:00 PM**. Demo 22 min + 8 min de preguntas |

---

## Entregables obligatorios

1. **Repositorio** — GitHub o GitLab con commits visibles de ambos integrantes
2. **README** — descripción, instrucciones para correr localmente y decisiones técnicas
3. **Demo en vivo** — código corriendo, no slides. Flujo principal + backend real + manejo de error

---

## Reglas

- Solo código nuevo — no reutilizar proyectos anteriores
- **Stack obligatorio:** Spring Boot (backend) + React + TypeScript (frontend)
- Ambos integrantes deben tener commits en el repositorio
- APIs externas permitidas si son **gratuitas o de prueba** — no de pago sin aprobación
- Cualquier librería open source y framework de UI está permitida
- IA permitida (Copilot, ChatGPT, etc.) — el código debe ser **comprendido y explicable**
- El plagio descalifica al equipo

---

## Rúbrica — 126 puntos

### Backend — Spring Boot (42 pts)

| ID | Criterio | Puntos |
|---|---|---|
| B1 | Estructura por capas | 8 |
| B2 | Endpoints RESTful | 8 |
| B3 | DTOs y validaciones | 6 |
| B4 | Manejo de excepciones | 8 |
| B5 | Persistencia con JPA | 6 |
| B6 | Configuración limpia | 4 |
| B7 | Normalización BD + modelo ER | 2 |

### Frontend — React + TypeScript (42 pts)

| ID | Criterio | Puntos |
|---|---|---|
| F1 | Tipado estricto | 8 |
| F2 | Estado global | 8 |
| F3 | Ruteo | 6 |
| F4 | Manejo de errores | 8 |
| F5 | Custom Hooks | 6 |
| F6 | Usabilidad e interfaz | 4 |
| F7 | Componentes | 2 |

### Integración & Proyecto (42 pts)

| ID | Criterio | Puntos |
|---|---|---|
| I1 | Integración real back-front | 8 |
| **I2** | **Demo funcional** | **15** |
| **I3** | **Creatividad** | **10** |
| I4 | Documentación README | 4 |
| I5 | Commits + branching | 5 |

---

## Clasificación

| Puntaje | Resultado |
|---|---|
| 110 – 126 | Ganador |
| 90 – 109 | Segundo lugar |
| 75 – 89 | Tercer lugar |
| < 75 | Sin clasificación |

---

## Mínimos obligatorios para poder ganar

| Criterio | Mínimo |
|---|---|
| B1 — Estructura por capas | ≥ 4 pts |
| F1 — Tipado estricto | ≥ 4 pts |
| I1 — Integración real back-front | ≥ 4 pts |
| I5 — Commits + branching | > 0 (ambos integrantes) |

> En caso de empate: se aplica I1 → I2 → B1+F1 → voto del juez con justificación.

---

## Notas estratégicas

- **I2 + I3 = 25 puntos** — el mayor bloque individual de la rúbrica. Una demo impactante y una idea creativa son la diferencia entre ganar y quedar segundo.
- El juez verifica el timestamp del último commit en Git para el code freeze.
- La mentoría del día 2 es un espacio de apoyo, no de evaluación.
