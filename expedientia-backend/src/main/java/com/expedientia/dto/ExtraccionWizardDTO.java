package com.expedientia.dto;

import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ExtraccionWizardDTO(
    @JsonProperty("titulo") String titulo,
    @JsonProperty("especialidad") Expediente.Especialidad especialidad,
    @JsonProperty("despacho") String despacho,
    @JsonProperty("ciudad") String ciudad,
    @JsonProperty("resumen") String resumen,
    @JsonProperty("partes") List<ParteWizard> partes,
    @JsonProperty("confirma") Boolean confirma,
    @JsonProperty("mensaje") String mensaje
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ParteWizard(
        @JsonProperty("nombre") String nombre,
        @JsonProperty("identificacion") String identificacion,
        @JsonProperty("tipoParticipacion") Parte.TipoParticipacion tipoParticipacion
    ) {}
}
