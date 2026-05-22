package com.expedientia.dto;

import java.util.List;

public record DocumentoAnalisisResponse(
    boolean esDocumentoJudicial,
    String sugerenciaTexto,
    List<ProcesoSugeridoDTO> procesos
) {}
