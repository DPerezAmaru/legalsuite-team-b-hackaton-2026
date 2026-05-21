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
            - CREAR_EXPEDIENTE: quiere crear, registrar o abrir un nuevo expediente o caso legal
            - LISTAR_EXPEDIENTES: quiere ver, listar o consultar los expedientes existentes
            - OBTENER_EXPEDIENTE: quiere ver un expediente específico (extraé el radicado si se menciona)
            - LISTAR_TAREAS: quiere ver las tareas de un expediente (extraé el radicado si se menciona)
            - SUGERENCIA_JUDICIAL: pide consejo, recomendación o sugerencia sobre un caso legal
            - NO_PERMITIDO: la solicitud no corresponde a ninguna acción del sistema

            REGLA DE DUDA: si no está claro pero parece legal → CREAR_EXPEDIENTE
            REGLA DE EMPRESA: "Clima S.A." o "Recetas del Valle" en contexto legal → CREAR_EXPEDIENTE

            Respondé ÚNICAMENTE con este JSON (sin texto adicional):
            {"accion":"CREAR_EXPEDIENTE","radicado":null}
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

            String json = raw.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            ChatIntent intent = objectMapper.readValue(json, ChatIntent.class);

            if (intent.accion() == ChatIntent.Accion.NO_PERMITIDO) {
                throw new AppException(AppException.Code.INTENT_BLOCKED_CONTEXT, "Solo puedo realizar acciones del sistema con los permisos otorgados");
            }

            return intent;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            // Si falla la clasificación, asumir creación (preferir incluir)
            return new ChatIntent(ChatIntent.Accion.CREAR_EXPEDIENTE, null);
        }
    }
}
