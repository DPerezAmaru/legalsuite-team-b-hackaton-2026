package com.expedientia.dto;

import java.util.List;

public record BulkConfirmarResponse(
    int totalCreados,
    int totalOmitidos,
    List<ExpedienteDTO> expedientes,
    List<Omitido> omitidos
) {
    public record Omitido(
        int indice,
        String archivo,
        String razon
    ) {}
}
