package com.expedientia.dto;

public record ConfirmarProcesoRequest(
    int numero,
    ProcesoSugeridoDTO datos,
    String nombreArchivo
) {}
