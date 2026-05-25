package com.expedientia.service;

import com.expedientia.dto.ChatIntent;
import com.expedientia.dto.MensajeHistorial;
import com.expedientia.exception.AppException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class IntentRouterService {

    private static final String SYSTEM_INTENT = """
            Sos el clasificador de acciones de un sistema de gestión de expedientes legales colombianos.
            Analizá el texto (y la conversación previa si se proporciona) y devolvé el JSON con la acción que el usuario quiere ejecutar.

            ACCIONES DISPONIBLES:
            - ASISTENTE_CREACION: el usuario quiere crear un expediente, guiarlo paso a paso, o proporciona datos de un caso nuevo
            - CREAR_EXPEDIENTE: quiere crear un único expediente y proporciona datos concretos del caso
            - CREAR_EXPEDIENTES_MASIVO: quiere crear múltiples expedientes a la vez (2 o más casos)
            - LISTAR_EXPEDIENTES: quiere ver, listar o consultar los expedientes existentes
            - OBTENER_EXPEDIENTE: quiere ver un expediente específico (extraé el radicado si se menciona)
            - LISTAR_TAREAS: quiere ver las tareas de UN expediente específico (extraé el radicado si se menciona)
            - LISTAR_TODAS_TAREAS: quiere ver todas las tareas del sistema, sin filtrar por expediente ("mis tareas", "todas las tareas", "qué tareas hay")
            - SUGERENCIA_JUDICIAL: cualquier pregunta, consulta o duda de carácter legal puntual
            - SUGERIR_TAREAS: quiere que se le sugieran tareas para expedientes por ID o nombre
            - CREAR_TAREAS_EXPEDIENTE: quiere crear o guardar tareas para un expediente. Extraé el nombre del expediente como expedienteNombre si lo menciona (en cualquier turno de la conversación). Extraé IDs numéricos como expedienteIds si los menciona.
            - RESUMEN_EXPEDIENTE: quiere un resumen o informe de un expediente por ID
            - ALERTAS_VENCIMIENTO: quiere ver tareas próximas a vencer o pendientes urgentes
            - BUSCAR_EXPEDIENTES: quiere buscar o filtrar expedientes por criterios
            - CREAR_USUARIO: quiere crear un usuario/abogado/asistente en el sistema (extrae nombre, email y rol si los menciona)
            - ELIMINAR_EXPEDIENTE: el usuario quiere eliminar/borrar un expediente. Extraé radicado en "radicado" o nombre en "expedienteNombre". Si el historial ya tiene la confirmación pendiente con • ID: N, extraé ese ID en expedienteIds.
            - ELIMINAR_TAREA: el usuario quiere eliminar/borrar una tarea. Extraé expediente en "radicado"/"expedienteNombre" y tarea en "tareaId"/"tareaNombre".
            - ANALISIS_CONTEXTUAL: el usuario hace una pregunta analítica o comparativa sobre datos del sistema (ej: "¿cuál es el más importante?", "¿qué casos están activos?", "analizá mi cartera"). Setear contextoRequerido según qué datos se necesitan: "EXPEDIENTES" si la pregunta es sobre expedientes, "TAREAS" si es sobre tareas en general, "TAREAS_EXPEDIENTE" si necesita tareas de un expediente específico (extraé expedienteIds también).
            - CONVERSACION_LIBRE: el usuario quiere conversar, analizar, reflexionar o discutir algo sin pedir que el sistema ejecute una acción concreta. Ejemplos: "ayudame a analizar este caso", "qué pensás de esta situación", "hablemos sobre...", "quiero entender...", preguntas abiertas de análisis
            - NECESITA_ACLARACION: el mensaje es demasiado corto, vago o ambiguo
            - NO_PERMITIDO: solicitud inapropiada o completamente ajena al ámbito legal

            REGLAS (aplicar en orden):
            - REGLA DE ESTADO CONVERSACIONAL (EVALUAR PRIMERO — PRIORIDAD ABSOLUTA): \
              Analizá el historial completo. Si el último mensaje del asistente contiene una pregunta \
              de confirmación para eliminar un recurso ("¿Confirmás que querés eliminarlo?" \
              o "¿Confirmás que querés eliminarla?") Y el mensaje actual es afirmativo \
              ("sí", "si", "dale", "ok", "confirmo", "listo", "de acuerdo") → \
              setear confirmaOperacionPendiente: true y mantener la acción de eliminación pendiente (ELIMINAR_EXPEDIENTE o ELIMINAR_TAREA). \
              Esta regla ANULA cualquier otra clasificación incluyendo ASISTENTE_CREACION.
            - REGLA DE CONTINUACION: si el mensaje actual es una afirmación, confirmación o selección \
              ("si", "sí", "ok", "dale", "con ese", "ese mismo", "ese", "el mismo", "correcto", "de acuerdo", \
              "así", "listo", "el primero", "el segundo", "el 1", "el 2", "ese expediente", "con ese expediente") \
              Y hay conversación previa → NUNCA clasifiques como SUGERENCIA_JUDICIAL ni NECESITA_ACLARACION. \
              Buscá la intención original en TODO el historial y mantenela.
            - REGLA DE LISTA EN CONVERSACION: si la conversación muestra: (1) usuario pidió hacer algo (ej: crear tarea) → \
              (2) pidió ver lista ("cuales hay", "listar", "muéstrame") → (3) asistente mostró lista con IDs → \
              (4) usuario confirma o selecciona ("si", "con ese", "el primero", "ese", "el ID X") → \
              clasificá según la intención ORIGINAL (ej: CREAR_TAREAS_EXPEDIENTE) y extraé el expedienteId \
              del mensaje del asistente que contenía la lista. El formato del asistente es "ID N: titulo".
            - REGLA DE EXTRACCION TOTAL: para extraer expedienteIds, expedienteNombre, radicado, tareaId, revisá TODOS los \
              turnos del historial incluyendo los mensajes del asistente — los IDs aparecen en formato "ID N: titulo" o "• ID: N". \
              Para ELIMINAR_TAREA: buscá el tareaId en este orden: (1) mensaje asistente con "• ID: N" en contexto de confirmación, \
              (2) tarea identificada claramente por contexto, (3) null si hay ambigüedad.
            - REGLA DE CONTEXTO: si hay conversación previa, usá el contexto completo para clasificar el mensaje actual
            - REGLA DE NOMBRE: si el usuario menciona el nombre de un expediente en cualquier turno → poné ese nombre en expedienteNombre
            - REGLA DE SELECCIÓN: si el usuario dice "el primero", "1", "el segundo", "2", etc. en respuesta a una lista de expedientes → extraé el ID o nombre del expediente correspondiente de esa lista
            - REGLA DE MASIVO: si el prompt contiene 2 o más expedientes numerados → CREAR_EXPEDIENTES_MASIVO
            - REGLA DE IDs: para SUGERIR_TAREAS, CREAR_TAREAS_EXPEDIENTE y RESUMEN_EXPEDIENTE extraé los números de expediente mencionados como lista de enteros en expedienteIds
            - REGLA DE ANALISIS: si el usuario hace una pregunta que requiere conocer datos reales del sistema para responder (análisis comparativo, priorización, estado actual, recomendaciones basadas en datos) → ANALISIS_CONTEXTUAL con el contextoRequerido apropiado. Tiene prioridad sobre CONVERSACION_LIBRE cuando la pregunta solo se puede responder correctamente con datos del sistema.
            - REGLA DE CONVERSACION: si el usuario quiere analizar, discutir o reflexionar sin pedir acción del sistema → CONVERSACION_LIBRE. Tiene prioridad sobre SUGERENCIA_JUDICIAL cuando el mensaje es conversacional y no una consulta legal puntual.
            - REGLA DE PERMISO: solo usá NO_PERMITIDO para temas completamente ajenos al derecho
            - REGLA DE AMBIGÜEDAD: si el mensaje tiene menos de 4 palabras sin verbo Y no hay contexto previo → NECESITA_ACLARACION
            - REGLA DE CREACION: si el usuario quiere crear un expediente Y confirmaOperacionPendiente NO aplica → ASISTENTE_CREACION

            Respondé ÚNICAMENTE con este JSON (sin texto adicional):
            {"accion":"ASISTENTE_CREACION","radicado":null,"expedienteIds":null,"expedienteNombre":null,"tareaId":null,"tareaNombre":null,"confirmaOperacionPendiente":null,"contextoRequerido":null}
            """;

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public IntentRouterService(ChatClient chatClient, ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.objectMapper = objectMapper;
    }

    public ChatIntent classify(String prompt) {
        return classify(prompt, null, null);
    }

    public ChatIntent classify(String prompt, List<MensajeHistorial> historial) {
        return classify(prompt, historial, null);
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(IntentRouterService.class);

    public ChatIntent classify(String prompt, List<MensajeHistorial> historial, String documentHint) {
        String userMessage = buildUserMessage(prompt, historial, documentHint);
        log.info("=== INTENT ROUTER — mensaje a Gemini ===\n{}\n========================================", userMessage);
        try {
            String raw = chatClient.prompt()
                    .system(SYSTEM_INTENT)
                    .user(userMessage)
                    .call()
                    .content();

            log.info("=== INTENT ROUTER — respuesta de Gemini ===\n{}\n===========================================", raw);
            String cleaned = raw.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            int start = cleaned.indexOf('{'); int end = cleaned.lastIndexOf('}');
            String json = (start >= 0 && end > start) ? cleaned.substring(start, end + 1) : cleaned;
            ChatIntent intent = objectMapper.readValue(json, ChatIntent.class);
            log.info("=== INTENT ROUTER — clasificación final: {} | ids={} | nombre={} | radicado={} | tareaId={} | confirma={} | contexto={} ===",
                    intent.accion(), intent.expedienteIds(), intent.expedienteNombre(), intent.radicado(),
                    intent.tareaId(), intent.confirmaOperacionPendiente(), intent.contextoRequerido());

            return intent;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            ChatIntent.Accion fallback = (historial != null && !historial.isEmpty())
                    ? ChatIntent.Accion.NECESITA_ACLARACION
                    : ChatIntent.Accion.SUGERENCIA_JUDICIAL;
            return new ChatIntent(fallback, null, null, null, null, null, null, null);
        }
    }

    private String buildUserMessage(String prompt, List<MensajeHistorial> historial, String documentHint) {
        String base = documentHint != null ? documentHint + "\n" + prompt : prompt;
        if (historial == null || historial.isEmpty()) {
            return base;
        }
        String contexto = historial.stream()
                .map(m -> m.rol().toUpperCase() + ": " + m.contenido())
                .collect(Collectors.joining("\n"));
        return "CONVERSACIÓN PREVIA:\n" + contexto + "\n\nMENSAJE ACTUAL: " + base;
    }
}
