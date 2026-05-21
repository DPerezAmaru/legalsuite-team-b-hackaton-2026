package com.expedientia.dto;

import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public record CreateExpedienteRequest(
    @NotBlank String radicado,
    @NotBlank String titulo,
    @NotNull Expediente.Especialidad especialidad,
    String despacho,
    String ciudad,
    Expediente.Estado estado,
    String resumen,
    LocalDate fechaInicio,
    Long documentoOrigenId,
    List<ParteRequest> partes
) {
    public record ParteRequest(
        @NotBlank String nombre,
        String identificacion,
        @NotNull Parte.TipoParticipacion tipoParticipacion
    ) {}
}
