package com.expedientia.dto;

import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateExpedienteRequest(
    @JsonProperty("radicado") String radicado,
    @JsonProperty("titulo") @NotBlank String titulo,
    @JsonProperty("especialidad") Expediente.Especialidad especialidad,
    @JsonProperty("despacho") String despacho,
    @JsonProperty("ciudad") String ciudad,
    @JsonProperty("estado") Expediente.Estado estado,
    @JsonProperty("resumen") String resumen,
    @JsonProperty("resuelve") String resuelve,
    @JsonProperty("fechaInicio") LocalDate fechaInicio,
    @JsonProperty("documentoOrigenId") Long documentoOrigenId,
    @JsonProperty("partes") List<ParteRequest> partes
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ParteRequest(
        @JsonProperty("nombre") @NotBlank String nombre,
        @JsonProperty("identificacion") String identificacion,
        @JsonProperty("tipoParticipacion") @NotNull Parte.TipoParticipacion tipoParticipacion
    ) {}
}
