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
import com.expedientia.dto.UsuarioDTO;
import com.expedientia.exception.ResourceNotFoundException;
import com.expedientia.service.AIService;
import com.expedientia.service.ChatAnalysisService;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;

@Tag(name = "Chat", description = "Interfaz conversacional con IA para gestión de expedientes legales")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final PromptSanitizerService sanitizerService;
    private final IntentRouterService intentRouter;
    private final AIService aiService;
    private final ChatAnalysisService chatAnalysisService;
    private final ExtractionNormalizerService normalizer;
    private final ExpedienteService expedienteService;
    private final TareaService tareaService;
    private final UsuarioService usuarioService;

    public ChatController(PromptSanitizerService sanitizerService,
                          IntentRouterService intentRouter,
                          AIService aiService,
                          ChatAnalysisService chatAnalysisService,
                          ExtractionNormalizerService normalizer,
                          ExpedienteService expedienteService,
                          TareaService tareaService,
                          UsuarioService usuarioService) {
        this.sanitizerService = sanitizerService;
        this.intentRouter = intentRouter;
        this.aiService = aiService;
        this.chatAnalysisService = chatAnalysisService;
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

        // Safety net: si el mensaje es una confirmación Y hay pregunta de eliminación pendiente
        // en el historial, ejecutar directamente sin pasar por Gemini.
        if (confirmaEliminacion(clean) && hayPreguntaEliminacionPendiente(request.historial())) {
            Long expId = extraerExpedienteIdDeHistorial(request.historial());
            if (expId != null) {
                try {
                    ExpedienteDTO exp = expedienteService.obtener(expId);
                    expedienteService.eliminar(exp.id());
                    return ResponseEntity.ok(done("ELIMINAR_EXPEDIENTE",
                        "Expediente \"" + exp.titulo() + "\" eliminado junto con todas sus tareas.", null));
                } catch (ResourceNotFoundException e) {
                    return ResponseEntity.ok(done("ELIMINAR_EXPEDIENTE",
                        "No se encontró el expediente a eliminar.", null));
                }
            }
            Long tareaId = extraerTareaIdDeHistorial(request.historial());
            if (tareaId != null) {
                try {
                    tareaService.eliminar(tareaId);
                    return ResponseEntity.ok(done("ELIMINAR_TAREA", "Tarea eliminada correctamente.", null));
                } catch (ResourceNotFoundException e) {
                    return ResponseEntity.ok(done("ELIMINAR_TAREA",
                        "No se encontró la tarea a eliminar.", null));
                }
            }
        }

        String documentHint = buildDocumentHint(request.archivos());
        ChatIntent intent = (request.historial() != null && !request.historial().isEmpty())
                ? intentRouter.classify(clean, request.historial(), documentHint)
                : intentRouter.classify(clean, null, documentHint);

        return switch (intent.accion()) {
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
                                .collect(Collectors.joining("\n"));
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
            case CREAR_EXPEDIENTE, ASISTENTE_CREACION -> {
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
                List<ExpedienteDTO> exps;
                try {
                    exps = ids.stream().map(expedienteService::obtener).toList();
                } catch (ResourceNotFoundException e) {
                    yield ResponseEntity.ok(done("SUGERIR_TAREAS",
                        "No se encontró uno de los expedientes indicados.", null));
                }
                List<TareaDTO> sugerencias = aiService.sugerirTareas(exps);
                List<TareaDTO> conIds = new java.util.ArrayList<>();
                for (int i = 0; i < sugerencias.size(); i++) {
                    TareaDTO t = sugerencias.get(i);
                    conIds.add(new TareaDTO((long) (i + 1), t.titulo(), t.descripcion(),
                            t.estado(), t.prioridad(), t.fechaVencimiento(),
                            t.sugeridaPorIa(), t.asignadoAId(), t.expedienteId(), null));
                }
                yield ResponseEntity.ok(done("SUGERIR_TAREAS",
                        conIds.size() + " tarea(s) sugerida(s) (no guardadas)", conIds));
            }
            case CREAR_TAREAS_EXPEDIENTE -> {
                List<Long> ids = intent.expedienteIds();
                if (intent.radicado() != null) {
                    try {
                        ExpedienteDTO expPorRadicado = expedienteService.obtenerPorRadicado(intent.radicado());
                        ids = List.of(expPorRadicado.id());
                    } catch (Exception ignored) {}
                }

                if (ids != null && !ids.isEmpty()) {
                    try {
                        ids.forEach(expedienteService::obtener);
                    } catch (ResourceNotFoundException e) {
                        yield ResponseEntity.ok(done("CREAR_TAREAS_EXPEDIENTE",
                            "No se encontró uno de los expedientes indicados.", null));
                    }
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

                String nombre = intent.expedienteNombre();
                if (nombre == null || nombre.isBlank()) {
                    List<ExpedienteDTO> todos = expedienteService.listar();
                    String listaIds = todos.isEmpty() ? "No hay expedientes registrados." :
                            todos.stream()
                                    .map(e -> "ID " + e.id() + ": " + e.titulo())
                                    .collect(Collectors.joining("\n"));
                    yield ResponseEntity.ok(ask("CREAR_TAREAS_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("CREAR_TAREAS_EXPEDIENTE",
                                    "nombre o ID del expediente destino (NO pedir radicado). " +
                                    "Expedientes disponibles:\n" + listaIds,
                                    clean, request.historial())));
                }

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
                boolean hayDocResumen = contextoDocumentos != null && !contextoDocumentos.isBlank();
                if (expId == null) {
                    if (hayDocResumen) {
                        String resumenDoc = chatAnalysisService.analizar(
                                clean, null, contextoDocumentos, request.historial());
                        yield ResponseEntity.ok(done("RESUMEN_EXPEDIENTE", resumenDoc, null));
                    }
                    yield ResponseEntity.ok(ask("RESUMEN_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("RESUMEN_EXPEDIENTE",
                                    "ID del expediente para generar el resumen. " +
                                    "Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                    clean, request.historial())));
                }
                try {
                    ExpedienteDTO exp = expedienteService.obtener(expId);
                    List<TareaDTO> tareas = tareaService.listarPorExpediente(expId);
                    String resumen = aiService.generarResumen(exp, tareas);
                    yield ResponseEntity.ok(done("RESUMEN_EXPEDIENTE", resumen, exp));
                } catch (ResourceNotFoundException e) {
                    String infoFaltante = hayDocResumen
                            ? "el expediente indicado no fue encontrado, pero hay documentos adjuntos — ofrecé resumirlos en su lugar"
                            : "el expediente indicado no fue encontrado — pedile al usuario que confirme el nombre o ID. " +
                              "Expedientes disponibles:\n" + listarExpedientesParaContexto();
                    yield ResponseEntity.ok(ask("RESUMEN_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("RESUMEN_EXPEDIENTE",
                                    infoFaltante, clean, request.historial())));
                }
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
            case NO_PERMITIDO -> {
                String msgNoPermitido = aiService.generarRespuestaAsistente("NO_PERMITIDO",
                        "indicá al usuario de forma amable que esta solicitud está fuera del alcance del sistema " +
                        "y sugerile qué sí podés hacer: gestionar expedientes, tareas, consultas legales colombianas",
                        clean, request.historial());
                yield ResponseEntity.ok(ask("NO_PERMITIDO", msgNoPermitido));
            }
            case CONVERSACION_LIBRE -> {
                String respuesta = aiService.responderConversacional(clean, request.historial(),
                        contextoDocumentos);
                yield ResponseEntity.ok(done("CONVERSACION_LIBRE", respuesta, null));
            }
            case ELIMINAR_EXPEDIENTE -> {
                // Primary path: Gemini confirmed deletion
                if (Boolean.TRUE.equals(intent.confirmaOperacionPendiente())) {
                    Long expId = (intent.expedienteIds() != null && !intent.expedienteIds().isEmpty())
                            ? intent.expedienteIds().get(0)
                            : extraerExpedienteIdDeHistorial(request.historial());
                    if (expId != null) {
                        try {
                            ExpedienteDTO exp = expedienteService.obtener(expId);
                            expedienteService.eliminar(exp.id());
                            yield ResponseEntity.ok(done("ELIMINAR_EXPEDIENTE",
                                "Expediente \"" + exp.titulo() + "\" eliminado junto con todas sus tareas.", null));
                        } catch (ResourceNotFoundException e) {
                            yield ResponseEntity.ok(done("ELIMINAR_EXPEDIENTE",
                                "No se encontró el expediente a eliminar.", null));
                        }
                    }
                }
                // First turn: resolve expediente and ask for confirmation
                String identificador = intent.radicado() != null ? intent.radicado() : intent.expedienteNombre();
                if (identificador == null || identificador.isBlank()) {
                    yield ResponseEntity.ok(ask("ELIMINAR_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("ELIMINAR_EXPEDIENTE",
                                    "radicado o nombre del expediente que desea eliminar. " +
                                    "Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                    clean, request.historial())));
                }
                ExpedienteDTO expTarget;
                try {
                    expTarget = expedienteService.obtenerPorRadicado(identificador);
                } catch (ResourceNotFoundException e) {
                    List<ExpedienteDTO> matches = expedienteService.buscarPorNombre(identificador);
                    if (matches.isEmpty()) {
                        yield ResponseEntity.ok(ask("ELIMINAR_EXPEDIENTE",
                            aiService.generarRespuestaAsistente("ELIMINAR_EXPEDIENTE",
                                "no se encontró expediente con \"" + identificador + "\". " +
                                "Pedile que verifique el nombre o radicado. " +
                                "Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                clean, request.historial())));
                    }
                    if (matches.size() > 1) {
                        String lista = matches.stream()
                            .map(m -> "ID " + m.id() + ": " + m.titulo())
                            .collect(Collectors.joining("\n"));
                        yield ResponseEntity.ok(ask("ELIMINAR_EXPEDIENTE",
                            "Encontré varios expedientes:\n" + lista + "\n¿Cuál querés eliminar? Indicá el ID.", matches));
                    }
                    expTarget = matches.get(0);
                }
                String radicadoDisplay = expTarget.radicado() != null ? expTarget.radicado() : "—";
                yield ResponseEntity.ok(ask("ELIMINAR_EXPEDIENTE",
                    "Encontré el siguiente expediente:\n" +
                    "• ID: " + expTarget.id() + "\n• Radicado: " + radicadoDisplay + "\n• Título: " + expTarget.titulo() +
                    "\n\n¿Confirmás que querés eliminarlo? Esta acción eliminará también todas sus tareas. Respondé \"sí\" para confirmar.",
                    expTarget));
            }
            case ELIMINAR_TAREA -> {
                // Primary path: Gemini confirmed deletion
                if (Boolean.TRUE.equals(intent.confirmaOperacionPendiente())) {
                    Long tId = intent.tareaId() != null
                            ? intent.tareaId()
                            : extraerTareaIdDeHistorial(request.historial());
                    if (tId != null) {
                        try {
                            tareaService.eliminar(tId);
                            yield ResponseEntity.ok(done("ELIMINAR_TAREA", "Tarea eliminada correctamente.", null));
                        } catch (ResourceNotFoundException e) {
                            yield ResponseEntity.ok(done("ELIMINAR_TAREA",
                                "No se encontró la tarea a eliminar.", null));
                        }
                    }
                }
                // First turn: resolve tarea and ask for confirmation
                Long tId = intent.tareaId();
                if (tId != null) {
                    try {
                        TareaDTO tarea = tareaService.obtener(tId);
                        yield ResponseEntity.ok(ask("ELIMINAR_TAREA",
                            "Encontré la siguiente tarea:\n" +
                            "• ID: " + tarea.id() + "\n• Título: " + tarea.titulo() + "\n• Estado: " + tarea.estado() +
                            "\n\n¿Confirmás que querés eliminarla? Respondé \"sí\" para confirmar.",
                            tarea));
                    } catch (ResourceNotFoundException e) {
                        yield ResponseEntity.ok(done("ELIMINAR_TAREA",
                            "No se encontró la tarea indicada.", null));
                    }
                }
                // Resolve by expediente context
                String radicadoTarea = intent.radicado() != null ? intent.radicado() : null;
                String nombreExpTarea = intent.expedienteNombre();
                List<Long> expIds = intent.expedienteIds();
                Long expIdParaTarea = null;
                if (expIds != null && !expIds.isEmpty()) {
                    expIdParaTarea = expIds.get(0);
                } else if (radicadoTarea != null) {
                    try {
                        expIdParaTarea = expedienteService.obtenerPorRadicado(radicadoTarea).id();
                    } catch (ResourceNotFoundException ignored) {}
                } else if (nombreExpTarea != null) {
                    List<ExpedienteDTO> found = expedienteService.buscarPorNombre(nombreExpTarea);
                    if (found.size() == 1) expIdParaTarea = found.get(0).id();
                }
                if (expIdParaTarea != null) {
                    List<TareaDTO> tareasList = tareaService.listarPorExpediente(expIdParaTarea);
                    if (tareasList.isEmpty()) {
                        yield ResponseEntity.ok(done("ELIMINAR_TAREA",
                            "El expediente no tiene tareas para eliminar.", null));
                    }
                    String listaTareas = tareasList.stream()
                        .map(t -> "• ID: " + t.id() + " | " + t.titulo() + " | " + t.estado())
                        .collect(Collectors.joining("\n"));
                    yield ResponseEntity.ok(ask("ELIMINAR_TAREA",
                        "Tareas del expediente:\n" + listaTareas + "\n\n¿Cuál tarea querés eliminar? Indicá el ID.", tareasList));
                }
                yield ResponseEntity.ok(ask("ELIMINAR_TAREA",
                        aiService.generarRespuestaAsistente("ELIMINAR_TAREA",
                                "nombre o ID de la tarea, o bien el expediente al que pertenece. " +
                                "Expedientes disponibles:\n" + listarExpedientesParaContexto(),
                                clean, request.historial())));
            }
            case ANALISIS_CONTEXTUAL -> {
                String datosReales = fetchContexto(intent);
                boolean hayDatos = datosReales != null && !datosReales.isBlank();
                boolean hayDocs  = contextoDocumentos != null && !contextoDocumentos.isBlank();
                if (!hayDatos && !hayDocs) {
                    yield ResponseEntity.ok(ask("ANALISIS_CONTEXTUAL",
                        aiService.generarRespuestaAsistente("ANALISIS_CONTEXTUAL",
                            "no hay datos disponibles para responder — pedile más contexto: " +
                            "¿sobre qué expedientes o tareas quiere el análisis? ¿Tiene algún documento adjunto?",
                            clean, request.historial())));
                }
                String analisis = chatAnalysisService.analizar(
                        clean, datosReales, contextoDocumentos, request.historial());
                yield ResponseEntity.ok(done("ANALISIS_CONTEXTUAL", analisis, null));
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

    private static String buildDocumentHint(List<DocumentoContextoInput> archivos) {
        if (archivos == null || archivos.isEmpty()) return null;
        String nombres = archivos.stream()
                .map(DocumentoContextoInput::nombreDocumento)
                .collect(Collectors.joining(", "));
        return "[El usuario adjuntó " + archivos.size() + " documento(s): " + nombres + "]";
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

    private String fetchContexto(ChatIntent intent) {
        String tipo = intent.contextoRequerido();
        if (tipo == null) return null;
        return switch (tipo) {
            case "EXPEDIENTES" -> {
                List<ExpedienteDTO> exps = expedienteService.listar();
                yield exps.isEmpty() ? "No hay expedientes en el sistema." :
                    exps.stream()
                        .map(e -> "ID " + e.id() + " | Radicado: " + (e.radicado() != null ? e.radicado() : "—") +
                                  " | Título: " + e.titulo() + " | Estado: " + e.estado() +
                                  " | Especialidad: " + (e.especialidad() != null ? e.especialidad() : "—"))
                        .collect(Collectors.joining("\n"));
            }
            case "TAREAS" -> {
                List<TareaDTO> tareas = tareaService.listar();
                yield tareas.isEmpty() ? "No hay tareas en el sistema." :
                    tareas.stream()
                        .map(t -> "ID " + t.id() + " | " + t.titulo() +
                                  " | Estado: " + t.estado() + " | Vence: " + t.fechaVencimiento())
                        .collect(Collectors.joining("\n"));
            }
            case "TAREAS_EXPEDIENTE" -> {
                if (intent.expedienteIds() == null || intent.expedienteIds().isEmpty()) yield null;
                Long expId = intent.expedienteIds().get(0);
                List<TareaDTO> tareas = tareaService.listarPorExpediente(expId);
                yield tareas.isEmpty() ? "El expediente ID " + expId + " no tiene tareas." :
                    tareas.stream()
                        .map(t -> "ID " + t.id() + " | " + t.titulo() +
                                  " | Estado: " + t.estado() + " | Vence: " + t.fechaVencimiento())
                        .collect(Collectors.joining("\n"));
            }
            default -> null;
        };
    }

    private static boolean confirmaEliminacion(String prompt) {
        String p = prompt.toLowerCase().trim();
        return p.equals("sí") || p.equals("si") || p.equals("confirmo") || p.equals("confirmar")
                || p.equals("dale") || p.equals("ok") || p.equals("listo") || p.equals("de acuerdo")
                || p.startsWith("sí,") || p.startsWith("si,");
    }

    private static boolean hayPreguntaEliminacionPendiente(List<MensajeHistorial> historial) {
        if (historial == null) return false;
        for (int i = historial.size() - 1; i >= 0; i--) {
            MensajeHistorial m = historial.get(i);
            if ("assistant".equalsIgnoreCase(m.rol())) {
                return m.contenido().contains("¿Confirmás que querés eliminarlo?")
                    || m.contenido().contains("¿Confirmás que querés eliminarla?");
            }
        }
        return false;
    }

    private static Long extraerExpedienteIdDeHistorial(List<MensajeHistorial> historial) {
        if (historial == null) return null;
        Pattern pattern = Pattern.compile("•\\s*ID:\\s*(\\d+)");
        for (int i = historial.size() - 1; i >= 0; i--) {
            MensajeHistorial m = historial.get(i);
            if ("assistant".equalsIgnoreCase(m.rol())
                    && m.contenido().contains("¿Confirmás que querés eliminarlo?")) {
                Matcher matcher = pattern.matcher(m.contenido());
                if (matcher.find()) return Long.parseLong(matcher.group(1));
            }
        }
        return null;
    }

    private static Long extraerTareaIdDeHistorial(List<MensajeHistorial> historial) {
        if (historial == null) return null;
        Pattern pattern = Pattern.compile("•\\s*ID:\\s*(\\d+)");
        for (int i = historial.size() - 1; i >= 0; i--) {
            MensajeHistorial m = historial.get(i);
            if ("assistant".equalsIgnoreCase(m.rol())
                    && m.contenido().contains("¿Confirmás que querés eliminarla?")) {
                Matcher matcher = pattern.matcher(m.contenido());
                if (matcher.find()) return Long.parseLong(matcher.group(1));
            }
        }
        return null;
    }
}
