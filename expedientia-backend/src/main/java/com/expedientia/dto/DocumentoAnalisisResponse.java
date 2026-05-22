package com.expedientia.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record DocumentoAnalisisResponse(
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) boolean esDocumentoJudicial,
    int numeroExpedientesEncontrados,
    String sugerenciaTexto,
    List<ProcesoSugeridoDTO> procesos,
    List<String> promptsSugeridos
) {}
