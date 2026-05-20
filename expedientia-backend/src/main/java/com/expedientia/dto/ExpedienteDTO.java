package com.expedientia.dto;

import com.expedientia.entity.Expediente;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ExpedienteDTO(
    Long id,
    String radicado,
    String titulo,
    Expediente.Especialidad especialidad,
    String despacho,
    String ciudad,
    Expediente.Estado estado,
    String resumen,
    LocalDate fechaInicio,
    LocalDateTime createdAt,
    Long creadoPorId,
    Long documentoOrigenId,
    List<ParteDTO> partes
) {
    public record ParteDTO(
        Long id,
        String nombre,
        String identificacion,
        String tipoParticipacion
    ) {}
}
