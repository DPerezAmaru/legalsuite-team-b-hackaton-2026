package com.expedientia.controller;

import com.expedientia.dto.ChatExpedienteRequest;
import com.expedientia.dto.ChatIntent;
import com.expedientia.dto.ChatResponse;
import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.ExpedienteDTO;
import com.expedientia.dto.TareaDTO;
import com.expedientia.exception.AppException;
import com.expedientia.exception.ResourceNotFoundException;
import com.expedientia.service.AIService;
import com.expedientia.service.ExtractionNormalizerService;
import com.expedientia.service.ExpedienteService;
import com.expedientia.service.IntentRouterService;
import com.expedientia.service.PromptSanitizerService;
import com.expedientia.service.TareaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expedientes")
public class ExpedienteController {

    private final ExpedienteService expedienteService;
    private final TareaService tareaService;
    private final PromptSanitizerService sanitizerService;
    private final IntentRouterService intentRouter;
    private final AIService aiService;
    private final ExtractionNormalizerService normalizer;

    public ExpedienteController(ExpedienteService expedienteService,
                                TareaService tareaService,
                                PromptSanitizerService sanitizerService,
                                IntentRouterService intentRouter,
                                AIService aiService,
                                ExtractionNormalizerService normalizer) {
        this.expedienteService = expedienteService;
        this.tareaService = tareaService;
        this.sanitizerService = sanitizerService;
        this.intentRouter = intentRouter;
        this.aiService = aiService;
        this.normalizer = normalizer;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatExpedienteRequest request,
            @RequestParam(required = false) Long usuarioId) {

        String clean = sanitizerService.sanitize(request.prompt());
        ChatIntent intent = intentRouter.classify(clean);

        return switch (intent.accion()) {
            case CREAR_EXPEDIENTE -> {
                CreateExpedienteRequest extracted = aiService.interpretarDesdeChat(clean);
                CreateExpedienteRequest normalized = normalizer.normalize(extracted);
                ExpedienteDTO dto = expedienteService.crear(normalized, usuarioId);
                yield ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ChatResponse("CREAR_EXPEDIENTE", "Expediente creado exitosamente", dto));
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
            case SUGERENCIA_JUDICIAL -> {
                String sugerencia = aiService.generarSugerencia(clean);
                yield ResponseEntity.ok(new ChatResponse("SUGERENCIA_JUDICIAL", sugerencia, null));
            }
            case NO_PERMITIDO -> throw new AppException(AppException.Code.INTENT_BLOCKED_CONTEXT, "Solo puedo realizar acciones del sistema con los permisos otorgados");
        };
    }

    @PostMapping
    public ResponseEntity<ExpedienteDTO> crear(
            @Valid @RequestBody CreateExpedienteRequest req,
            @RequestParam(required = false) Long usuarioId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expedienteService.crear(req, usuarioId));
    }

    @GetMapping
    public ResponseEntity<List<ExpedienteDTO>> listar() {
        return ResponseEntity.ok(expedienteService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpedienteDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(expedienteService.obtener(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpedienteDTO> actualizar(
            @PathVariable Long id,
            @RequestBody CreateExpedienteRequest req) {
        return ResponseEntity.ok(expedienteService.actualizar(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        expedienteService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
