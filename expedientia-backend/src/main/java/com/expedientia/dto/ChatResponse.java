package com.expedientia.dto;

public record ChatResponse(
    String accion,
    String mensaje,
    Object datos
) {}
