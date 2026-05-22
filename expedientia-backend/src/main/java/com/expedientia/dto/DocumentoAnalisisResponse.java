package com.expedientia.dto;

import java.util.List;

public record DocumentoAnalisisResponse(
    int numeroExpedientesEncontrados,
    String sugerenciaTexto,
    List<ProcesoSugeridoDTO> procesos,
    List<String> promptsSugeridos
) {}
