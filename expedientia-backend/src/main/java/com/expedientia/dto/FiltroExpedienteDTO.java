package com.expedientia.dto;

import com.expedientia.entity.Expediente;

public record FiltroExpedienteDTO(
    Expediente.Especialidad especialidad,
    Expediente.Estado estado,
    String ciudad,
    String despacho
) {}
