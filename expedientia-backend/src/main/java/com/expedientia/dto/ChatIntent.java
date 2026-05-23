package com.expedientia.dto;

public record ChatIntent(
    Accion accion,
    String radicado
) {
    public enum Accion {
        CREAR_EXPEDIENTE,
        CREAR_EXPEDIENTES_MASIVO,
        LISTAR_EXPEDIENTES,
        OBTENER_EXPEDIENTE,
        LISTAR_TAREAS,
        SUGERENCIA_JUDICIAL,
        NO_PERMITIDO
    }
}
