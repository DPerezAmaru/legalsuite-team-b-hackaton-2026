package com.expedientia.controller;

import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.ExpedienteDTO;
import com.expedientia.service.ExpedienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Expedientes", description = "CRUD de expedientes judiciales")
@RestController
@RequestMapping("/api/expedientes")
public class ExpedienteController {

    private final ExpedienteService expedienteService;

    public ExpedienteController(ExpedienteService expedienteService) {
        this.expedienteService = expedienteService;
    }

    @Operation(summary = "Crear expediente", description = "Crea un expediente con datos estructurados directamente, sin pasar por IA.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Expediente creado"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "409", description = "El radicado ya existe")
    })
    @PostMapping
    public ResponseEntity<ExpedienteDTO> crear(
            @Valid @RequestBody CreateExpedienteRequest req,
            @Parameter(description = "ID del usuario que crea el expediente", example = "1")
            @RequestParam(required = false) Long usuarioId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expedienteService.crear(req, usuarioId));
    }

    @Operation(summary = "Listar todos los expedientes")
    @ApiResponse(responseCode = "200", description = "Lista de expedientes")
    @GetMapping
    public ResponseEntity<List<ExpedienteDTO>> listar() {
        return ResponseEntity.ok(expedienteService.listar());
    }

    @Operation(summary = "Obtener expediente por ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Expediente encontrado"),
        @ApiResponse(responseCode = "404", description = "Expediente no encontrado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ExpedienteDTO> obtener(
            @Parameter(description = "ID interno del expediente", example = "1")
            @PathVariable Long id) {
        return ResponseEntity.ok(expedienteService.obtener(id));
    }

    @Operation(summary = "Actualizar expediente")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Expediente actualizado"),
        @ApiResponse(responseCode = "404", description = "Expediente no encontrado"),
        @ApiResponse(responseCode = "409", description = "El radicado ya existe en otro expediente")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ExpedienteDTO> actualizar(
            @Parameter(description = "ID interno del expediente", example = "1")
            @PathVariable Long id,
            @Valid @RequestBody CreateExpedienteRequest req) {
        return ResponseEntity.ok(expedienteService.actualizar(id, req));
    }

    @Operation(summary = "Eliminar expediente")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Expediente eliminado"),
        @ApiResponse(responseCode = "404", description = "Expediente no encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @Parameter(description = "ID interno del expediente", example = "1")
            @PathVariable Long id) {
        expedienteService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
