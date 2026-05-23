package com.expedientia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatExpedienteRequest(
    @NotBlank(message = "El prompt no puede estar vacío")
    @Size(min = 10, message = "El prompt debe tener al menos 10 caracteres")
    @Size(max = 3000, message = "El prompt no puede superar 3000 caracteres")
    String prompt
) {}
