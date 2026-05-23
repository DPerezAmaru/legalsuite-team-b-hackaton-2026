package com.expedientia.controller;

import com.expedientia.dto.TareaDTO;
import com.expedientia.service.TareaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Tareas", description = "Gestión de tareas asociadas a expedientes judiciales")
@RestController
@RequestMapping("/api/tareas")
public class TareaController {

    private final TareaService tareaService;

    public TareaController(TareaService tareaService) {
        this.tareaService = tareaService;
    }

    @Operation(summary = "Crear tarea", description = "Crea una tarea asociada a un expediente. El campo expedienteId es obligatorio.")
    @PostMapping
    public ResponseEntity<TareaDTO> crear(
            @Valid @RequestBody TareaDTO dto,
            @Parameter(description = "ID del usuario que crea la tarea") @RequestParam(required = false) Long usuarioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tareaService.crear(dto, usuarioId));
    }

    @Operation(summary = "Obtener tarea por ID")
    @GetMapping("/{id}")
    public ResponseEntity<TareaDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(tareaService.obtener(id));
    }

    @Operation(summary = "Listar tareas por expediente")
    @GetMapping
    public ResponseEntity<List<TareaDTO>> listar(
            @Parameter(description = "ID del expediente", required = true) @RequestParam Long expedienteId) {
        return ResponseEntity.ok(tareaService.listarPorExpediente(expedienteId));
    }

    @Operation(summary = "Actualizar tarea", description = "Actualiza los campos enviados. Los campos null se ignoran.")
    @PutMapping("/{id}")
    public ResponseEntity<TareaDTO> actualizar(
            @PathVariable Long id,
            @RequestBody TareaDTO dto) {
        return ResponseEntity.ok(tareaService.actualizar(id, dto));
    }

    @Operation(summary = "Eliminar tarea")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        tareaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
