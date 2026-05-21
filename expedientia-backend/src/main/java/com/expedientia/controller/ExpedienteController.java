package com.expedientia.controller;

import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.ExpedienteDTO;
import com.expedientia.service.ExpedienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expedientes")
public class ExpedienteController {

    private final ExpedienteService expedienteService;

    public ExpedienteController(ExpedienteService expedienteService) {
        this.expedienteService = expedienteService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ExpedienteDTO> crearDesdeChat(
            @RequestBody Map<String, String> body,
            @RequestParam(required = false) Long usuarioId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expedienteService.crearDesdeChat(body.get("prompt"), usuarioId));
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
