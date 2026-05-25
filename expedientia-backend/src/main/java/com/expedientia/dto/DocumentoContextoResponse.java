package com.expedientia.dto;

public record DocumentoContextoResponse(
    String nombreDocumento,
    String contenido,
    String error
) {
    public static DocumentoContextoResponse error(String nombre, String msg) {
        return new DocumentoContextoResponse(nombre, null, msg);
    }
}
