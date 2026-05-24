package com.expedientia.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AsistenteCreacionResult(
    @JsonProperty("fase") String fase,
    @JsonProperty("expediente") CreateExpedienteRequest expediente,
    @JsonProperty("pregunta") String pregunta,
    @JsonProperty("camposFaltantes") List<String> camposFaltantes
) {
    @JsonIgnore public boolean listo() { return "LISTO".equals(fase); }
    @JsonIgnore public boolean sinInfo() { return "SIN_INFO".equals(fase); }
}
