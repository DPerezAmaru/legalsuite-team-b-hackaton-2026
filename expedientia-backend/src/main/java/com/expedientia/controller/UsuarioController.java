package com.expedientia.controller;

import com.expedientia.dto.UsuarioDTO;
import com.expedientia.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Usuarios", description = "Gestión de usuarios de la firma legal")
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @Operation(summary = "Listar todos los usuarios")
    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    @Operation(summary = "Obtener usuario por ID")
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtener(id));
    }

    @Operation(summary = "Crear usuario")
    @PostMapping
    public ResponseEntity<UsuarioDTO> crear(@Valid @RequestBody UsuarioDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(dto));
    }

    @Operation(summary = "Actualizar usuario")
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> actualizar(@PathVariable Long id, @RequestBody UsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizar(id, dto));
    }

    @Operation(summary = "Eliminar usuario")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
