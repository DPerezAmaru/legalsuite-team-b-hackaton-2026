package com.expedientia.service;

import com.expedientia.dto.ChatIntent;
import com.expedientia.exception.AppException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class IntentRouterService {

    private static final String SYSTEM_INTENT = """
            Sos el clasificador de acciones de un sistema de gestión de expedientes legales colombianos.
            Analizá el texto y devolvé el JSON con la acción que el usuario quiere ejecutar.

            ACCIONES DISPONIBLES:
            - ASISTENTE_CREACION: el usuario quiere crear un expediente pero NO proporciona suficiente información (al menos el tipo de caso y las partes), o pide ayuda/guía para crear uno paso a paso
            - CREAR_EXPEDIENTE: quiere crear un único expediente y proporciona datos concretos del caso (partes, tipo de proceso, juzgado, etc.)
            - CREAR_EXPEDIENTES_MASIVO: quiere crear múltiples expedientes a la vez (el prompt contiene 2 o más casos numerados o claramente separados)
            - LISTAR_EXPEDIENTES: quiere ver, listar o consultar los expedientes existentes
            - OBTENER_EXPEDIENTE: quiere ver un expediente específico (extraé el radicado si se menciona)
            - LISTAR_TAREAS: quiere ver las tareas de un expediente (extraé el radicado si se menciona)
            - SUGERENCIA_JUDICIAL: cualquier pregunta, consulta o duda de carácter legal: consejos sobre casos, referencias a leyes o códigos colombianos, procedimientos judiciales, recursos legales, normativa, doctrina o jurisprudencia
            - SUGERIR_TAREAS: quiere que se le sugieran tareas para uno o más expedientes por ID (NO las crea, solo sugiere). Extraé los IDs numéricos como lista.
            - CREAR_TAREAS_EXPEDIENTE: quiere crear o guardar tareas para uno o más expedientes por ID en masa. Extraé los IDs numéricos como lista.
            - RESUMEN_EXPEDIENTE: quiere un resumen, informe o reporte de un expediente por ID. Extraé el ID como primer elemento de la lista.
            - ALERTAS_VENCIMIENTO: quiere ver tareas próximas a vencer, alertas o pendientes urgentes
            - BUSCAR_EXPEDIENTES: quiere buscar o filtrar expedientes por criterios (especialidad, ciudad, estado, juzgado)
            - NECESITA_ACLARACION: el mensaje es demasiado corto, vago o ambiguo para determinar con certeza qué acción ejecutar (ej: "rama civil", "expediente", "tareas", una sola palabra o frase sin contexto claro)
            - NO_PERMITIDO: la solicitud es claramente inapropiada, ofensiva o completamente ajena al ámbito legal

            REGLA DE MASIVO: si el prompt contiene 2 o más expedientes numerados o separados → CREAR_EXPEDIENTES_MASIVO
            REGLA DE DUDA: si no está claro pero parece legal → CREAR_EXPEDIENTE
            REGLA DE IDs: para SUGERIR_TAREAS, CREAR_TAREAS_EXPEDIENTE y RESUMEN_EXPEDIENTE extraé los números de expediente mencionados como lista de enteros en expedienteIds
            REGLA DE EMPRESA: "Clima S.A." o "Recetas del Valle" en contexto legal → CREAR_EXPEDIENTE
            REGLA DE PERMISO: cualquier pregunta sobre derecho colombiano, leyes, códigos, normativa, jurisprudencia, doctrina, trámites judiciales o un caso/expediente → SUGERENCIA_JUDICIAL. Solo usá NO_PERMITIDO para temas completamente ajenos al derecho (recetas, deportes, entretenimiento, tecnología sin relación legal).
            REGLA DE AMBIGÜEDAD: si el mensaje tiene menos de 4 palabras, es una sola frase sin verbo o no queda claro qué acción ejecutar → NECESITA_ACLARACION.

            Respondé ÚNICAMENTE con este JSON (sin texto adicional):
            {"accion":"CREAR_EXPEDIENTE","radicado":null,"expedienteIds":null}
            """;

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public IntentRouterService(ChatClient chatClient, ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.objectMapper = objectMapper;
    }

    public ChatIntent classify(String prompt) {
        try {
            String raw = chatClient.prompt()
                    .system(SYSTEM_INTENT)
                    .user(prompt)
                    .call()
                    .content();

            String cleaned = raw.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            int start = cleaned.indexOf('{'); int end = cleaned.lastIndexOf('}');
            String json = (start >= 0 && end > start) ? cleaned.substring(start, end + 1) : cleaned;
            ChatIntent intent = objectMapper.readValue(json, ChatIntent.class);

            if (intent.accion() == ChatIntent.Accion.NO_PERMITIDO) {
                throw new AppException(AppException.Code.INTENT_BLOCKED_CONTEXT, "Solo puedo realizar acciones del sistema con los permisos otorgados");
            }

            return intent;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            return new ChatIntent(ChatIntent.Accion.SUGERENCIA_JUDICIAL, null, null);
        }
    }
}
