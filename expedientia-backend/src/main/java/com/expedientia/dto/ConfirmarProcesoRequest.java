package com.expedientia.dto;

import jakarta.validation.constraints.NotNull;

public record ConfirmarProcesoRequest(
    @NotNull(message = "El campo 'datos' es obligatorio") ProcesoSugeridoDTO datos,
    String nombreArchivo
) {}
