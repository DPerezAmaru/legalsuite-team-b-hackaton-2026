package com.expedientia.dto;

import java.util.List;

public record ConfirmarProcesoResponse(
    ExpedienteDTO expediente,
    List<String> tareasSugeridas
) {}
