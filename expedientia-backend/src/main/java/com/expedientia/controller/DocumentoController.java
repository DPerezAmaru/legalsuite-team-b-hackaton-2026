package com.expedientia.controller;

import com.expedientia.dto.BulkAnalisisResponse;
import com.expedientia.dto.BulkConfirmarRequest;
import com.expedientia.dto.BulkConfirmarResponse;
import com.expedientia.service.DocumentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Documentos", description = "Procesamiento de documentos PDF con extracción de procesos judiciales mediante IA")
@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {

    private final DocumentoService documentoService;

    public DocumentoController(DocumentoService documentoService) {
        this.documentoService = documentoService;
    }

    @Operation(
        summary = "Analizar múltiples PDFs en paralelo",
        description = """
            Recibe hasta 5 PDFs y los analiza en paralelo. Por cada archivo valida formato y peso
            (si falla → omitido con razón, continúa con los demás). Si se envían más de 5 → 400
            indicando qué archivos se recibieron. No escribe nada en BD.
            Los procesos detectados se numeran globalmente para seleccionar en /bulk/confirmar.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Análisis completado",
            content = @Content(schema = @Schema(implementation = BulkAnalisisResponse.class))),
        @ApiResponse(responseCode = "400", description = "Más de 5 archivos enviados")
    })
    @PostMapping(value = "/bulk/analizar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BulkAnalisisResponse> bulkAnalizar(
            @Parameter(description = "Archivos PDF (máximo 5)", required = true)
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(documentoService.bulkAnalizar(files));
    }

    @Operation(
        summary = "Confirmar procesos bulk y crear expedientes",
        description = """
            Segunda etapa del flujo bulk. Indica qué índices del análisis previo confirmar.
            Si uno falla (radicado duplicado u otro error) se reporta y continúa con los demás.
            """
    )
    @ApiResponse(responseCode = "201", description = "Expedientes creados")
    @PostMapping("/bulk/confirmar")
    public ResponseEntity<BulkConfirmarResponse> bulkConfirmar(
            @Parameter(description = "ID del usuario", example = "1")
            @RequestParam(required = false) Long usuarioId,
            @RequestBody BulkConfirmarRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentoService.bulkConfirmar(request, usuarioId));
    }
}
