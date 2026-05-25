package com.expedientia.service;

import com.expedientia.dto.MensajeHistorial;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatAnalysisService {

    private static final String SYSTEM_ANALYSIS = """
            Sos un asistente legal analizando datos reales de un sistema de gestión de expedientes colombianos.
            Los datos que se te proveen son REALES y actuales — NUNCA inventes información adicional.
            Basá tu respuesta EXCLUSIVAMENTE en los datos proporcionados.
            Sé preciso, útil y conciso. Tono profesional y cercano.
            """;

    private final ChatClient chatClient;

    public ChatAnalysisService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public String analizar(String preguntaUsuario, String datosReales,
                           String contextoDocumentos, List<MensajeHistorial> historial) {
        String contexto = (historial == null || historial.isEmpty()) ? "" :
            historial.stream()
                .map(m -> m.rol().toUpperCase() + ": " + m.contenido())
                .collect(Collectors.joining("\n")) + "\n\n";

        StringBuilder fuentes = new StringBuilder();
        if (datosReales != null && !datosReales.isBlank()) {
            fuentes.append("DATOS REALES DEL SISTEMA:\n").append(datosReales).append("\n\n");
        }
        if (contextoDocumentos != null && !contextoDocumentos.isBlank()) {
            fuentes.append(contextoDocumentos).append("\n\n");
        }

        String userMessage = contexto + fuentes + "PREGUNTA DEL USUARIO: " + preguntaUsuario;

        return chatClient.prompt()
            .system(SYSTEM_ANALYSIS)
            .user(userMessage)
            .call()
            .content();
    }
}
