package com.expedientia.service;

import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.DocumentoExtraidoDTO;
import com.expedientia.entity.Expediente;
import com.expedientia.entity.Tarea;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AIService {

    private static final String SYSTEM_CHAT = """
            Sos un asistente legal colombiano. Extraé datos del texto y respondé ÚNICAMENTE con este JSON, sin explicaciones:
            {"radicado":"YYYY-NNNNN","titulo":"string","especialidad":"CIVIL|PENAL|LABORAL|ADMINISTRATIVO|FAMILIA",\
            "despacho":null,"ciudad":null,"estado":"ACTIVO","resumen":null,"fechaInicio":null,"documentoOrigenId":null,\
            "partes":[{"nombre":"string","identificacion":null,"tipoParticipacion":"DEMANDANTE|DEMANDADO|APODERADO|TERCERO"}]}
            radicado y titulo son OBLIGATORIOS. Si radicado no está en el texto, generalo con formato YYYY-NNNNN.
            """;

    private static final String SYSTEM_PDF = """
            Sos un asistente legal colombiano. Extraé datos del documento y respondé ÚNICAMENTE con este JSON, sin explicaciones:
            {"documentoId":null,"radicado":null,"especialidad":"CIVIL|PENAL|LABORAL|ADMINISTRATIVO|FAMILIA",\
            "despacho":null,"ciudad":null,"resumen":null,\
            "partes":[{"nombre":"string","identificacion":null,"tipoParticipacion":"DEMANDANTE|DEMANDADO|APODERADO|TERCERO"}],\
            "tareasSugeridas":["string"]}
            """;

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public AIService(ChatClient chatClient, ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.objectMapper = objectMapper;
    }

    public CreateExpedienteRequest interpretarDesdeChat(String prompt) {
        String raw = chatClient.prompt()
                .system(SYSTEM_CHAT)
                .user(prompt)
                .call()
                .content();
        System.out.println("=== GEMINI RAW RESPONSE ===\n" + raw + "\n===========================");
        return parse(raw, CreateExpedienteRequest.class);
    }

    public DocumentoExtraidoDTO extraerDesdePDF(String textoPDF) {
        String raw = chatClient.prompt()
                .system(SYSTEM_PDF)
                .user("Documento judicial:\n" + textoPDF)
                .call()
                .content();
        return parse(raw, DocumentoExtraidoDTO.class);
    }

    private <T> T parse(String raw, Class<T> type) {
        try {
            String json = raw.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            return objectMapper.readValue(json, type);
        } catch (Exception e) {
            throw new RuntimeException("Error al parsear respuesta de IA: " + raw, e);
        }
    }

    public String generarInforme(Expediente expediente, List<Tarea> tareas) {
        String prompt = String.format(
                "Expediente %s — %s (%s). Resumen: %s. Tareas (%d): %s.",
                expediente.getRadicado(),
                expediente.getTitulo(),
                expediente.getEspecialidad(),
                expediente.getResumen() != null ? expediente.getResumen() : "sin resumen",
                tareas.size(),
                tareas.stream().map(Tarea::getTitulo).toList()
        );
        return chatClient.prompt()
                .system("Generá un informe ejecutivo breve (máx 150 palabras) del expediente legal.")
                .user(prompt)
                .call()
                .content();
    }
}
