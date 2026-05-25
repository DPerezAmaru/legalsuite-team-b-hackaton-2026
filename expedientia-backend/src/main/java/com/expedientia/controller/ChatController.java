package com.expedientia.controller;

import com.expedientia.dto.AsistenteCreacionResult;
import com.expedientia.dto.ChatExpedienteRequest;
import com.expedientia.dto.ChatIntent;
import com.expedientia.dto.ChatResponse;
import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.DocumentoContextoInput;
import com.expedientia.dto.ExpedienteDTO;
import com.expedientia.dto.FiltroExpedienteDTO;
import com.expedientia.dto.MensajeHistorial;
import com.expedientia.dto.TareaDTO;
import com.expedientia.entity.Tarea;
import com.expedientia.exception.AppException;
import com.expedientia.exception.ResourceNotFoundException;
import com.expedientia.dto.UsuarioDTO;
import com.expedientia.service.AIService;
import com.expedientia.service.ExtractionNormalizerService;
import com.expedientia.service.ExpedienteService;
import com.expedientia.service.IntentRouterService;
import com.expedientia.service.PromptSanitizerService;
import com.expedientia.service.TareaService;
import com.expedientia.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;

@Tag(name = "Chat", description = "Interfaz conversacional con IA para gestión de expedientes legales")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final PromptSanitizerService sanitizerService;
    private final IntentRouterService intentRouter;
    private final AIService aiService;
    private final ExtractionNormalizerService normalizer;
    private final ExpedienteService expedienteService;
    private final TareaService tareaService;
    private final UsuarioService usuarioService;

    public ChatController(PromptSanitizerService sanitizerService,
                          IntentRouterService intentRouter,
                          AIService aiService,
                          ExtractionNormalizerService normalizer,
                          ExpedienteService expedienteService,
                          TareaService tareaService,
                          UsuarioService usuarioService) {
        this.sanitizerService = sanitizerService;
        this.intentRouter = intentRouter;
        this.aiService = aiService;
        this.normalizer = normalizer;
        this.expedienteService = expedienteService;
        this.tareaService = tareaService;
        this.usuarioService = usuarioService;
    }

    @Operation(
        summary = "Enviar mensaje al asistente legal",
        description = """
            Endpoint conversacional principal. Activá `modoAsistente: true` para habilitar
            el modo guiado — el sistema clasifica la intención con el historial completo
            y guía al usuario paso a paso para cualquier acción.

            **Modo normal** (`modoAsistente: false` o ausente): clasificación stateless del prompt actual.
            **Modo asistente** (`modoAsistente: true`): clasificación con historial completo, respuestas
            guiadas, `esperaRespuesta: true` cuando se necesita más información del usuario.

            **Pipeline:** sanitización → detección de intención → enrutamiento
            """,
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                examples = {
                    @ExampleObject(name = "Modo normal — listar",
                        value = """
                        { "prompt": "Listame todos los expedientes activos" }
                        """),
                    @ExampleObject(name = "Modo asistente — crear tarea (turno 1)",
                        value = """
                        { "prompt": "crear tarea de audiencia inicial", "modoAsistente": true, "historial": [] }
                        """),
                    @ExampleObject(name = "Modo asistente — crear tarea (turno 2 con historial)",
                        value = """
                        { "prompt": "para el expediente García", "modoAsistente": true,
                          "historial": [
                            { "rol": "user", "contenido": "crear tarea de audiencia inicial" },
                            { "rol": "assistant", "contenido": "¿Para qué expediente?" }
                          ]
                        }
                        """)
                }
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Acción ejecutada o esperando respuesta del usuario"),
        @ApiResponse(responseCode = "201", description = "Recurso creado"),
        @ApiResponse(responseCode = "400", description = "Prompt vacío o con contenido no permitido"),
        @ApiResponse(responseCode = "403", description = "Intención bloqueada por seguridad"),
        @ApiResponse(responseCode = "422", description = "Acción no permitida en este contexto")
    })
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatExpedienteRequest request,
            @Parameter(description = "ID del usuario que realiza la consulta", example = "1")
            @RequestParam(required = false) Long usuarioId) {

        String clean = sanitizerService.sanitize(request.prompt());
        String contextoDocumentos = buildDocumentContext(request.archivos());

        ChatIntent intent = (request.historial() != null && !request.historial().isEmpty())
                ? intentRouter.classify(clean, request.historial())
                : intentRouter.classify(clean);

        return switch (intent.accion()) {
            case CREAR_EXPEDIENTE -> {
                if (request.historial() != null && !request.historial().isEmpty()) {
                    AsistenteCreacionResult resultado = aiService.asistirCreacion(clean, request.historial(), contextoDocumentos);
                    if (!resultado.listo()) {
                        yield ResponseEntity.ok(ask("ASISTENTE_CREACION",
                                resultado.pregunta(), resultado.expediente()));
                    }
                    CreateExpedienteRequest normalized = normalizer.normalize(resultado.expediente());
                    ExpedienteDTO dto = expedienteService.crear(normalized, usuarioId);
                    String msgCreado = dto.radicado() != null
                            ? "Expediente creado. Radicado: " + dto.radicado()
                            : "Expediente creado: " + dto.titulo();
                    yield ResponseEntity.status(HttpStatus.CREATED)
                            .body(done("ASISTENTE_CREACION", msgCreado, dto));
                }
                yield ResponseEntity.ok(ask("CREAR_EXPEDIENTE",
                        aiService.generarRespuestaAsistente("CREAR_EXPEDIENTE",
                                "nombre del caso", clean, request.historial())));
            }
            case CREAR_EXPEDIENTES_MASIVO -> {
                List<CreateExpedienteRequest> extracted = aiService.interpretarMasivoDesdeChat(clean);
                if (extracted.isEmpty()) {
                    yield ResponseEntity.ok(ask("CREAR_EXPEDIENTES_MASIVO",
                            aiService.generarRespuestaAsistente("CREAR_EXPEDIENTES_MASIVO",
                                    "datos de cada expediente: título del caso, partes involucradas y especialidad. " +
                                    "Si quiere datos ficticios para pruebas, sugerirle que lo pida explícitamente " +
                                    "diciendo 'expedientes de prueba' o 'datos ficticios'.",
                                    clean, request.historial())));
                }
                List<CreateExpedienteRequest> normalized = extracted.stream()
                        .map(normalizer::normalize)
                        .collect(Collectors.toList());
                ExpedienteService.BulkResult result = expedienteService.crearMasivo(normalized, usuarioId);
                yield ResponseEntity.status(HttpStatus.CREATED).body(done("CREAR_EXPEDIENTES_MASIVO",
                        result.creados().size() + " expediente(s) creado(s)", result.creados()));
            }
            case LISTAR_EXPEDIENTES -> {
                List<ExpedienteDTO> lista = expedienteService.listar();
                String listaTexto = lista.isEmpty()
                        ? "No hay expedientes registrados."
                        : lista.stream()
                                .map(e -> "ID " + e.id() + ": " + e.titulo())
                                .collect(java.util.stream.Collectors.joining("\n"));
                if (request.historial() != null && !request.historial().isEmpty()) {
                    String guia = aiService.generarRespuestaAsistente(
                            "LISTAR_EXPEDIENTES",
                            "mostrar lista y guiar al usuario a elegir según el contexto de la conversación. " +
                            "Lista disponible:\n" + listaTexto,
                            clean, request.historial());
                    yield ResponseEntity.ok(ask("LISTAR_EXPEDIENTES", guia, lista));
                }
                yield ResponseEntity.ok(done("LISTAR_EXPEDIENTES", listaTexto, lista));
            }
            case OBTENER_EXPEDIENTE -> {
                if (intent.radicado() == null) {
                    yield ResponseEntity.ok(ask("OBTENER_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("OBTENER_EXPEDIENTE",
                                    "nombre o ID del expediente (NO pedir radicado). " +
                                    "Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                    clean, request.historial())));
                }
                ExpedienteDTO dto = expedienteService.obtenerPorRadicado(intent.radicado());
                yield ResponseEntity.ok(done("OBTENER_EXPEDIENTE", "Expediente encontrado", dto));
            }
            case LISTAR_TODAS_TAREAS -> {
                List<TareaDTO> todas = tareaService.listar();
                yield ResponseEntity.ok(done("LISTAR_TODAS_TAREAS",
                        todas.size() + " tarea(s) en el sistema", todas));
            }
            case LISTAR_TAREAS -> {
                if (intent.radicado() == null) {
                    yield ResponseEntity.ok(ask("LISTAR_TAREAS",
                            aiService.generarRespuestaAsistente("LISTAR_TAREAS",
                                    "nombre o ID del expediente (NO pedir radicado). " +
                                    "Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                    clean, request.historial())));
                }
                List<TareaDTO> tareas = tareaService.listarPorRadicado(intent.radicado());
                yield ResponseEntity.ok(done("LISTAR_TAREAS",
                        tareas.size() + " tarea(s) encontrada(s)", tareas));
            }
            case NECESITA_ACLARACION -> {
                String aclaracion = aiService.generarAclaracion(clean);
                yield ResponseEntity.ok(ask("NECESITA_ACLARACION", aclaracion));
            }
            case SUGERENCIA_JUDICIAL -> {
                String sugerencia = aiService.generarSugerencia(clean);
                yield ResponseEntity.ok(done("SUGERENCIA_JUDICIAL", sugerencia, null));
            }
            case ASISTENTE_CREACION -> {
                AsistenteCreacionResult resultado = aiService.asistirCreacion(clean, request.historial(), contextoDocumentos);
                if (!resultado.listo()) {
                    yield ResponseEntity.ok(ask("ASISTENTE_CREACION", resultado.pregunta(),
                            resultado.expediente()));
                }
                CreateExpedienteRequest normalized = normalizer.normalize(resultado.expediente());
                ExpedienteDTO dto = expedienteService.crear(normalized, usuarioId);
                String msgCreado = dto.radicado() != null
                        ? "Expediente creado. Radicado: " + dto.radicado()
                        : "Expediente creado: " + dto.titulo();
                yield ResponseEntity.status(HttpStatus.CREATED)
                        .body(done("ASISTENTE_CREACION", msgCreado, dto));
            }
            case SUGERIR_TAREAS -> {
                List<Long> ids = intent.expedienteIds();
                if (ids == null || ids.isEmpty()) {
                    yield ResponseEntity.ok(ask("SUGERIR_TAREAS",
                            aiService.generarRespuestaAsistente("SUGERIR_TAREAS",
                                    "ID del expediente para sugerir tareas. " +
                                    "Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                    clean, request.historial())));
                }
                List<ExpedienteDTO> exps = ids.stream().map(expedienteService::obtener).toList();
                List<TareaDTO> sugerencias = aiService.sugerirTareas(exps);
                List<TareaDTO> conIds = new java.util.ArrayList<>();
                for (int i = 0; i < sugerencias.size(); i++) {
                    TareaDTO t = sugerencias.get(i);
                    conIds.add(new TareaDTO((long) (i + 1), t.titulo(), t.descripcion(),
                            t.estado(), t.prioridad(), t.fechaVencimiento(),
                            t.sugeridaPorIa(), t.asignadoAId(), t.expedienteId()));
                }
                yield ResponseEntity.ok(done("SUGERIR_TAREAS",
                        conIds.size() + " tarea(s) sugerida(s) (no guardadas)", conIds));
            }
            case CREAR_TAREAS_EXPEDIENTE -> {
                // Radicado tiene prioridad: Gemini a veces pone el radicado como expedienteIds (número largo)
                List<Long> ids = intent.expedienteIds();
                if (intent.radicado() != null) {
                    try {
                        ExpedienteDTO expPorRadicado = expedienteService.obtenerPorRadicado(intent.radicado());
                        ids = List.of(expPorRadicado.id());
                    } catch (Exception ignored) {}
                }

                // Path directo por IDs (modo normal o cuando el router extrajo IDs)
                if (ids != null && !ids.isEmpty()) {
                    ids.forEach(expedienteService::obtener);
                    String ctxIds = buildExtractionContext(clean, request.historial());
                    List<TareaDTO> extraidas = aiService.extraerTareasDesdeChat(ctxIds, ids);
                    if (extraidas.isEmpty())
                        yield ResponseEntity.ok(ask("CREAR_TAREAS_EXPEDIENTE",
                                aiService.generarRespuestaAsistente("CREAR_TAREAS_EXPEDIENTE",
                                        "descripción de la tarea a crear", clean, request.historial())));
                    List<TareaDTO> creadas = tareaService.crearMasivoDesdeIA(extraidas, usuarioId);
                    yield ResponseEntity.status(HttpStatus.CREATED).body(done("CREAR_TAREAS_EXPEDIENTE",
                            creadas.size() + " tarea(s) creada(s)", creadas));
                }

                // Path guiado por nombre (modo asistente)
                String nombre = intent.expedienteNombre();
                if (nombre == null || nombre.isBlank()) {
                    List<ExpedienteDTO> todos = expedienteService.listar();
                    String listaIds = todos.isEmpty() ? "No hay expedientes registrados." :
                            todos.stream()
                                    .map(e -> "ID " + e.id() + ": " + e.titulo())
                                    .collect(java.util.stream.Collectors.joining("\n"));
                    yield ResponseEntity.ok(ask("CREAR_TAREAS_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("CREAR_TAREAS_EXPEDIENTE",
                                    "nombre o ID del expediente destino (NO pedir radicado). " +
                                    "Expedientes disponibles:\n" + listaIds,
                                    clean, request.historial())));
                }

                // Búsqueda semántica por IA en lugar de LIKE
                List<ExpedienteDTO> todos = expedienteService.listar();
                List<Long> idsResueltos = aiService.resolverExpedientePorDescripcion(nombre, todos);
                List<ExpedienteDTO> encontrados = todos.stream()
                        .filter(e -> idsResueltos.contains(e.id()))
                        .toList();

                if (encontrados.isEmpty()) {
                    yield ResponseEntity.ok(ask("CREAR_TAREAS_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("CREAR_TAREAS_EXPEDIENTE",
                                    "no se encontró expediente con descripción '" + nombre +
                                    "'. Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                    clean, request.historial())));
                }

                if (encontrados.size() == 1) {
                    ExpedienteDTO exp = encontrados.get(0);
                    String ctxNombre = buildExtractionContext(clean, request.historial());
                    List<TareaDTO> extraidas = aiService.extraerTareasDesdeChat(ctxNombre,
                            List.of(exp.id()));
                    if (extraidas.isEmpty())
                        yield ResponseEntity.ok(ask("CREAR_TAREAS_EXPEDIENTE",
                                aiService.generarRespuestaAsistente("CREAR_TAREAS_EXPEDIENTE",
                                        "descripción de la tarea para expediente '" + exp.titulo() + "'",
                                        clean, request.historial())));
                    List<TareaDTO> creadas = tareaService.crearMasivoDesdeIA(extraidas, usuarioId);
                    yield ResponseEntity.status(HttpStatus.CREATED).body(done("CREAR_TAREAS_EXPEDIENTE",
                            creadas.size() + " tarea(s) creada(s) para \"" + exp.titulo() + "\"",
                            creadas));
                }

                // Disambiguación — múltiples matches
                StringBuilder sb = new StringBuilder("Encontré ")
                        .append(encontrados.size()).append(" expedientes:\n");
                for (int i = 0; i < encontrados.size(); i++) {
                    sb.append(i + 1).append(". ")
                      .append(encontrados.get(i).titulo())
                      .append(" (ID: ").append(encontrados.get(i).id()).append(")\n");
                }
                sb.append("¿Para cuál querés crear la tarea?");
                yield ResponseEntity.ok(ask("CREAR_TAREAS_EXPEDIENTE", sb.toString(), encontrados));
            }
            case RESUMEN_EXPEDIENTE -> {
                Long expId = (intent.expedienteIds() != null && !intent.expedienteIds().isEmpty())
                        ? intent.expedienteIds().get(0) : null;
                if (expId == null) {
                    yield ResponseEntity.ok(ask("RESUMEN_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("RESUMEN_EXPEDIENTE",
                                    "ID del expediente para generar el resumen. " +
                                    "Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                    clean, request.historial())));
                }
                ExpedienteDTO exp = expedienteService.obtener(expId);
                List<TareaDTO> tareas = tareaService.listarPorExpediente(expId);
                String resumen = aiService.generarResumen(exp, tareas);
                yield ResponseEntity.ok(done("RESUMEN_EXPEDIENTE", resumen, exp));
            }
            case ALERTAS_VENCIMIENTO -> {
                List<TareaDTO> proximas = tareaService.listarProximas(7);
                String msg = proximas.isEmpty()
                        ? "No hay tareas próximas a vencer en los próximos 7 días"
                        : proximas.size() + " tarea(s) vence(n) en los próximos 7 días";
                yield ResponseEntity.ok(done("ALERTAS_VENCIMIENTO", msg, proximas));
            }
            case BUSCAR_EXPEDIENTES -> {
                FiltroExpedienteDTO filtros = aiService.extraerFiltrosBusqueda(clean);
                List<ExpedienteDTO> resultados = expedienteService.buscar(filtros);
                yield ResponseEntity.ok(done("BUSCAR_EXPEDIENTES",
                        resultados.size() + " expediente(s) encontrado(s)", resultados));
            }
            case CREAR_USUARIO -> {
                UsuarioDTO extraido = aiService.extraerUsuarioDesdeChat(clean, request.historial());
                if (extraido == null || extraido.nombre() == null || extraido.email() == null) {
                    yield ResponseEntity.ok(ask("CREAR_USUARIO",
                            aiService.generarRespuestaAsistente("CREAR_USUARIO",
                                    "nombre completo, email y rol (ABOGADO, ASISTENTE o ADMIN) del usuario",
                                    clean, request.historial())));
                }
                UsuarioDTO creado = usuarioService.crear(extraido);
                yield ResponseEntity.status(HttpStatus.CREATED)
                        .body(done("CREAR_USUARIO", "Usuario creado: " + creado.nombre() + " (" + creado.rol() + ")", creado));
            }
            case NO_PERMITIDO -> ResponseEntity.ok(ask("NO_PERMITIDO",
                    "Solo puedo ayudarte con temas legales y gestión de expedientes. ¿En qué te puedo asistir?"));
            case CONVERSACION_LIBRE -> {
                String respuesta = aiService.responderConversacional(clean, request.historial(),
                        contextoDocumentos);
                yield ResponseEntity.ok(done("CONVERSACION_LIBRE", respuesta, null));
            }
        };
    }

    // esperaRespuesta: true — el backend necesita más input del usuario
    private static ChatResponse ask(String accion, String mensaje) {
        return new ChatResponse(accion, mensaje, null, true);
    }

    private static ChatResponse ask(String accion, String mensaje, Object datos) {
        return new ChatResponse(accion, mensaje, datos, true);
    }

    // esperaRespuesta: false — acción ejecutada, conversación puede cerrar
    private static ChatResponse done(String accion, String mensaje, Object datos) {
        return new ChatResponse(accion, mensaje, datos, false);
    }

    private String listarExpedientesParaContexto() {
        List<ExpedienteDTO> todos = expedienteService.listar();
        if (todos.isEmpty()) return "No hay expedientes registrados.";
        return todos.stream()
                .map(e -> "ID " + e.id() + ": " + e.titulo())
                .collect(Collectors.joining("\n"));
    }

    private static String buildExtractionContext(String prompt, List<MensajeHistorial> historial) {
        if (historial == null || historial.isEmpty()) return prompt;
        String ctx = historial.stream()
                .map(m -> m.rol().toUpperCase() + ": " + m.contenido())
                .collect(Collectors.joining("\n"));
        return "CONVERSACIÓN PREVIA:\n" + ctx + "\n\nMENSAJE ACTUAL: " + prompt;
    }

    private String buildDocumentContext(List<DocumentoContextoInput> archivos) {
        if (archivos == null || archivos.isEmpty()) return null;
        StringBuilder sb = new StringBuilder("=== DOCUMENTOS ADJUNTOS (solo informativos — el usuario decide qué hacer) ===\n");
        int idx = 1;
        for (DocumentoContextoInput doc : archivos) {
            if (doc.contenido() == null || doc.contenido().isBlank()) continue;
            sb.append("[DOC ").append(idx++).append(": ").append(doc.nombreDocumento()).append("]\n");
            sb.append(descomprimir(doc.contenido())).append("\n");
            sb.append("[/DOC]\n");
        }
        sb.append("=== FIN DOCUMENTOS ===");
        return sb.toString();
    }

    private String descomprimir(String base64Gzip) {
        try {
            byte[] compressed = Base64.getDecoder().decode(base64Gzip);
            try (GZIPInputStream gzip = new GZIPInputStream(new ByteArrayInputStream(compressed))) {
                return new String(gzip.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            return "[Error al descomprimir documento]";
        }
    }

}
