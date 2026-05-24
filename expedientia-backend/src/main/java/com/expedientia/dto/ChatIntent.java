package com.expedientia.dto;

import java.util.List;

public record ChatIntent(
    Accion accion,
    String radicado,
    List<Long> expedienteIds,
    String expedienteNombre
) {
    public enum Accion {
        CREAR_EXPEDIENTE,
        CREAR_EXPEDIENTES_MASIVO,
        LISTAR_EXPEDIENTES,
        OBTENER_EXPEDIENTE,
        LISTAR_TAREAS,
        LISTAR_TODAS_TAREAS,
        SUGERENCIA_JUDICIAL,
        ASISTENTE_CREACION,
        SUGERIR_TAREAS,
        CREAR_TAREAS_EXPEDIENTE,
        RESUMEN_EXPEDIENTE,
        ALERTAS_VENCIMIENTO,
        BUSCAR_EXPEDIENTES,
        CREAR_USUARIO,
        NECESITA_ACLARACION,
        NO_PERMITIDO,
        CONVERSACION_LIBRE
    }
}
