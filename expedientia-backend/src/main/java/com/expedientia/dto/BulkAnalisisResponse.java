package com.expedientia.dto;

import java.util.List;

public record BulkAnalisisResponse(
    int totalArchivos,
    int totalProcesosEncontrados,
    List<ProcesoEncontrado> procesos,
    List<ArchivoOmitido> omitidos
) {
    public record ProcesoEncontrado(
        int indice,
        String archivoOrigen,
        ProcesoSugeridoDTO datos
    ) {}

    public record ArchivoOmitido(
        String archivo,
        String razon
    ) {}
}
