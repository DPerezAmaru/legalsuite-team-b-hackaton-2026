package com.expedientia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ChatExpedienteRequest(
    @NotBlank(message = "El prompt no puede estar vacío")
    @Size(min = 2, message = "El prompt debe tener al menos 2 caracteres")
    @Size(max = 3000, message = "El prompt no puede superar 3000 caracteres")
    String prompt,
    Boolean modoAsistente,
    List<MensajeHistorial> historial,
    List<DocumentoContextoInput> archivos
) {}
