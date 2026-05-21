package com.expedientia.dto;

public record ChatIntent(
    Accion accion,
    String radicado
) {
    public enum Accion {
        CREAR_EXPEDIENTE,
        LISTAR_EXPEDIENTES,
        OBTENER_EXPEDIENTE,
        LISTAR_TAREAS,
        SUGERENCIA_JUDICIAL,
        NO_PERMITIDO
    }
}
