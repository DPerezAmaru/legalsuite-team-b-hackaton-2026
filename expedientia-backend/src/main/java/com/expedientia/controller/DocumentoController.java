package com.expedientia.controller;

import com.expedientia.dto.BulkAnalisisResponse;
import com.expedientia.dto.BulkConfirmarRequest;
import com.expedientia.dto.BulkConfirmarResponse;
import com.expedientia.dto.ConfirmarProcesoRequest;
import com.expedientia.dto.ConfirmarProcesoResponse;
import com.expedientia.dto.DocumentoAnalisisResponse;
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
        summary = "Analizar documento PDF",
        description = """
            Recibe un archivo PDF judicial y ejecuta el pipeline de análisis:
            1. Validación del archivo (máx. 10 MB, 50 páginas, tipo MIME)
            2. Extracción de texto con PDFBox 3.x
            3. Validación de relevancia judicial (rechaza documentos no judiciales)
            4. Detección de uno o más procesos judiciales en el documento
            5. Retorna los procesos detectados con sus partes, especialidad, etapa y despacho

            NO crea ningún registro en base de datos. El usuario debe confirmar con /confirmar.
            Si el documento contiene múltiples procesos, se retornan numerados para que el usuario
            pueda confirmarlos uno a uno.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "PDF analizado — procesos detectados listos para confirmar",
            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = DocumentoAnalisisResponse.class))),
        @ApiResponse(responseCode = "400", description = "Archivo no es PDF o está vacío"),
        @ApiResponse(responseCode = "413", description = "Archivo supera 10 MB o tiene más de 50 páginas"),
        @ApiResponse(responseCode = "422", description = "PDF escaneado sin texto seleccionable, o documento no judicial")
    })
    @PostMapping(value = "/procesar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentoAnalisisResponse> procesar(
            @Parameter(description = "Archivo PDF del documento judicial", required = true)
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentoService.procesar(file));
    }

    @Operation(
        summary = "Confirmar proceso y crear expediente",
        description = """
            Segunda etapa del flujo. El usuario elige qué proceso del análisis previo desea crear,
            puede editar las partes u otros datos antes de confirmar.

            Al confirmar:
            - Se crea el Documento en base de datos
            - Se crea el Expediente con todas sus partes (N partes por proceso)
            - La IA genera tareas sugeridas basadas en la etapa procesal y el contenido del "Resuelve"

            Para documentos con múltiples procesos, se llama una vez por cada proceso a crear,
            indicando el número correspondiente en el campo "numero".
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Expediente creado con tareas sugeridas",
            content = @Content(schema = @Schema(implementation = ConfirmarProcesoResponse.class))),
        @ApiResponse(responseCode = "409", description = "El radicado ya existe en el sistema")
    })
    @PostMapping("/confirmar")
    public ResponseEntity<ConfirmarProcesoResponse> confirmar(
            @Parameter(description = "ID del usuario que confirma la creación", example = "1")
            @RequestParam(required = false) Long usuarioId,
            @RequestBody ConfirmarProcesoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentoService.confirmar(request, usuarioId));
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
