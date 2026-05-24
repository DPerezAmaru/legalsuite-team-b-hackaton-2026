package com.expedientia.controller;

import com.expedientia.dto.AsistenteCreacionResult;
import com.expedientia.dto.ChatExpedienteRequest;
import com.expedientia.dto.ChatIntent;
import com.expedientia.dto.ChatResponse;
import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.ExpedienteDTO;
import com.expedientia.dto.FiltroExpedienteDTO;
import com.expedientia.dto.TareaDTO;
import com.expedientia.exception.AppException;
import com.expedientia.exception.ResourceNotFoundException;
import com.expedientia.service.AIService;
import com.expedientia.service.ExtractionNormalizerService;
import com.expedientia.service.ExpedienteService;
import com.expedientia.service.IntentRouterService;
import com.expedientia.service.PromptSanitizerService;
import com.expedientia.service.TareaService;
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

import java.util.List;
import java.util.stream.Collectors;

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

    public ChatController(PromptSanitizerService sanitizerService,
                          IntentRouterService intentRouter,
                          AIService aiService,
                          ExtractionNormalizerService normalizer,
                          ExpedienteService expedienteService,
                          TareaService tareaService) {
        this.sanitizerService = sanitizerService;
        this.intentRouter = intentRouter;
        this.aiService = aiService;
        this.normalizer = normalizer;
        this.expedienteService = expedienteService;
        this.tareaService = tareaService;
    }

    @Operation(
        summary = "Enviar mensaje al asistente legal",
        description = """
            Endpoint conversacional principal. El sistema detecta la intención del usuario
            y ejecuta la acción correspondiente automáticamente:

            | Intención detectada    | Acción                                      |
            |------------------------|---------------------------------------------|
            | Crear expediente       | Extrae datos con IA y persiste el expediente |
            | Listar expedientes     | Retorna todos los expedientes del sistema    |
            | Obtener expediente     | Busca por número de radicado                |
            | Listar tareas          | Tareas de un expediente por radicado         |
            | Sugerencia judicial    | Genera recomendación legal con Gemini        |

            **Pipeline de seguridad:** sanitización → detección de intención → enrutamiento
            """,
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                examples = {
                    @ExampleObject(name = "Crear expediente",
                        value = """
                        { "prompt": "Necesito crear un expediente para el caso García vs Municipio de Bogotá por daños y perjuicios" }
                        """),
                    @ExampleObject(name = "Listar expedientes",
                        value = """
                        { "prompt": "Listame todos los expedientes activos" }
                        """),
                    @ExampleObject(name = "Obtener por radicado",
                        value = """
                        { "prompt": "Mostrame el expediente 2026-00001" }
                        """),
                    @ExampleObject(name = "Listar tareas",
                        value = """
                        { "prompt": "¿Cuáles son las tareas pendientes del expediente 2026-00001?" }
                        """),
                    @ExampleObject(name = "Sugerencia judicial",
                        value = """
                        { "prompt": "¿Qué excepciones previas puedo presentar en un proceso ejecutivo hipotecario?" }
                        """)
                }
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Acción ejecutada correctamente"),
        @ApiResponse(responseCode = "201", description = "Expediente creado"),
        @ApiResponse(responseCode = "400", description = "Prompt vacío, muy corto, o con contenido no permitido"),
        @ApiResponse(responseCode = "403", description = "Intención bloqueada por seguridad"),
        @ApiResponse(responseCode = "422", description = "Acción no permitida en este contexto")
    })
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatExpedienteRequest request,
            @Parameter(description = "ID del usuario que realiza la consulta", example = "1")
            @RequestParam(required = false) Long usuarioId) {

        String clean = sanitizerService.sanitize(request.prompt());
        ChatIntent intent = Boolean.TRUE.equals(request.modoAsistente())
                ? new ChatIntent(ChatIntent.Accion.ASISTENTE_CREACION, null, null)
                : intentRouter.classify(clean);

        return switch (intent.accion()) {
            case CREAR_EXPEDIENTE -> {
                yield ResponseEntity.ok(new ChatResponse("NECESITA_ACLARACION",
                        "Para crear un expediente necesito más información. ¿Podés darme el nombre del caso, el tipo de proceso (civil, penal, laboral, administrativo, familia) y las partes involucradas?",
                        null));
            }
            case CREAR_EXPEDIENTES_MASIVO -> {
                List<CreateExpedienteRequest> extracted = aiService.interpretarMasivoDesdeChat(clean);
                if (extracted.isEmpty()) throw new AppException(AppException.Code.AI_EXTRACTION_FAILED,
                        "No se pudieron extraer expedientes del prompt");
                List<CreateExpedienteRequest> normalized = extracted.stream()
                        .map(normalizer::normalize)
                        .collect(Collectors.toList());
                ExpedienteService.BulkResult result = expedienteService.crearMasivo(normalized, usuarioId);
                String mensaje = result.creados().size() + " expediente(s) creado(s)" +
                        (result.radicadosDuplicados().isEmpty() ? "" :
                         ", " + result.radicadosDuplicados().size() + " omitido(s) por radicado duplicado");
                yield ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ChatResponse("CREAR_EXPEDIENTES_MASIVO", mensaje, result.creados()));
            }
            case LISTAR_EXPEDIENTES -> {
                List<ExpedienteDTO> lista = expedienteService.listar();
                yield ResponseEntity.ok(new ChatResponse("LISTAR_EXPEDIENTES",
                        lista.size() + " expediente(s) encontrado(s)", lista));
            }
            case OBTENER_EXPEDIENTE -> {
                if (intent.radicado() == null)
                    throw new ResourceNotFoundException("Expediente", 0L);
                ExpedienteDTO dto = expedienteService.obtenerPorRadicado(intent.radicado());
                yield ResponseEntity.ok(new ChatResponse("OBTENER_EXPEDIENTE", "Expediente encontrado", dto));
            }
            case LISTAR_TAREAS -> {
                if (intent.radicado() == null)
                    throw new ResourceNotFoundException("Expediente", 0L);
                List<TareaDTO> tareas = tareaService.listarPorRadicado(intent.radicado());
                yield ResponseEntity.ok(new ChatResponse("LISTAR_TAREAS",
                        tareas.size() + " tarea(s) encontrada(s)", tareas));
            }
            case NECESITA_ACLARACION -> {
                String aclaracion = aiService.generarAclaracion(clean);
                yield ResponseEntity.ok(new ChatResponse("NECESITA_ACLARACION", aclaracion, null));
            }
            case SUGERENCIA_JUDICIAL -> {
                String sugerencia = aiService.generarSugerencia(clean);
                yield ResponseEntity.ok(new ChatResponse("SUGERENCIA_JUDICIAL", sugerencia, null));
            }
            case ASISTENTE_CREACION -> {
                AsistenteCreacionResult resultado = aiService.asistirCreacion(clean, request.historial());
                if (!resultado.listo()) {
                    yield ResponseEntity.ok(new ChatResponse("ASISTENTE_CREACION", resultado.pregunta(), resultado.expediente()));
                }
                CreateExpedienteRequest normalized = normalizer.normalize(resultado.expediente());
                ExpedienteDTO dto = expedienteService.crear(normalized, usuarioId);
                yield ResponseEntity.status(HttpStatus.CREATED).body(new ChatResponse(
                        "ASISTENTE_CREACION",
                        "Expediente creado. Radicado provisional: " + dto.radicado(),
                        dto));
            }
            case SUGERIR_TAREAS -> {
                List<Long> ids = intent.expedienteIds();
                if (ids == null || ids.isEmpty())
                    yield ResponseEntity.ok(new ChatResponse("NECESITA_ACLARACION",
                            "¿Para qué expediente querés que sugiera tareas? Decime el ID.", null));
                List<ExpedienteDTO> exps = ids.stream().map(expedienteService::obtener).toList();
                List<TareaDTO> sugerencias = aiService.sugerirTareas(exps);
                List<TareaDTO> conIds = new java.util.ArrayList<>();
                for (int i = 0; i < sugerencias.size(); i++) {
                    TareaDTO t = sugerencias.get(i);
                    conIds.add(new TareaDTO((long)(i + 1), t.titulo(), t.descripcion(),
                            t.estado(), t.prioridad(), t.fechaVencimiento(),
                            t.sugeridaPorIa(), t.asignadoAId(), t.expedienteId()));
                }
                yield ResponseEntity.ok(new ChatResponse("SUGERIR_TAREAS",
                        conIds.size() + " tarea(s) sugerida(s) (no guardadas)", conIds));
            }
            case CREAR_TAREAS_EXPEDIENTE -> {
                List<Long> ids = intent.expedienteIds();
                if (ids == null || ids.isEmpty())
                    throw new AppException(AppException.Code.AI_EXTRACTION_FAILED,
                            "Mencioná el ID del expediente para crear tareas");
                ids.forEach(expedienteService::obtener); // valida que existan
                List<TareaDTO> extraidas = aiService.extraerTareasDesdeChat(clean, ids);
                if (extraidas.isEmpty())
                    throw new AppException(AppException.Code.AI_EXTRACTION_FAILED,
                            "No se encontraron tareas en tu descripción");
                List<TareaDTO> creadas = tareaService.crearMasivoDesdeIA(extraidas, usuarioId);
                yield ResponseEntity.status(HttpStatus.CREATED).body(new ChatResponse("CREAR_TAREAS_EXPEDIENTE",
                        creadas.size() + " tarea(s) creada(s)", creadas));
            }
            case RESUMEN_EXPEDIENTE -> {
                Long expId = (intent.expedienteIds() != null && !intent.expedienteIds().isEmpty())
                        ? intent.expedienteIds().get(0) : null;
                if (expId == null)
                    throw new AppException(AppException.Code.AI_EXTRACTION_FAILED,
                            "Mencioná el ID del expediente para generar el resumen");
                ExpedienteDTO exp = expedienteService.obtener(expId);
                List<TareaDTO> tareas = tareaService.listarPorExpediente(expId);
                String resumen = aiService.generarResumen(exp, tareas);
                yield ResponseEntity.ok(new ChatResponse("RESUMEN_EXPEDIENTE", resumen, exp));
            }
            case ALERTAS_VENCIMIENTO -> {
                List<TareaDTO> proximas = tareaService.listarProximas(7);
                String msg = proximas.isEmpty()
                        ? "No hay tareas próximas a vencer en los próximos 7 días"
                        : proximas.size() + " tarea(s) vence(n) en los próximos 7 días";
                yield ResponseEntity.ok(new ChatResponse("ALERTAS_VENCIMIENTO", msg, proximas));
            }
            case BUSCAR_EXPEDIENTES -> {
                FiltroExpedienteDTO filtros = aiService.extraerFiltrosBusqueda(clean);
                List<ExpedienteDTO> resultados = expedienteService.buscar(filtros);
                yield ResponseEntity.ok(new ChatResponse("BUSCAR_EXPEDIENTES",
                        resultados.size() + " expediente(s) encontrado(s)", resultados));
            }
            case NO_PERMITIDO -> throw new AppException(AppException.Code.INTENT_BLOCKED_CONTEXT,
                    "Solo puedo realizar acciones del sistema con los permisos otorgados");
        };
    }

}
