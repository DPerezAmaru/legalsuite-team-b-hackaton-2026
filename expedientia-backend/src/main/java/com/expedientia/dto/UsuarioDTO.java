package com.expedientia.dto;

import com.expedientia.entity.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record UsuarioDTO(
    Long id,
    @NotBlank(message = "El nombre es obligatorio") String nombre,
    @NotBlank(message = "El email es obligatorio") @Email(message = "Email inválido") String email,
    @NotNull(message = "El rol es obligatorio") Usuario.Rol rol,
    LocalDateTime createdAt
) {}
