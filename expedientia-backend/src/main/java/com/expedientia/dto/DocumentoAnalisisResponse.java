package com.expedientia.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DocumentoAnalisisResponse(
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) boolean esDocumentoJudicial,
    String sugerenciaTexto,
    ProcesoSugeridoDTO proceso
) {}
