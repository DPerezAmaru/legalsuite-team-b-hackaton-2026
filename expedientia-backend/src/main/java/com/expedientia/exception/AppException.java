package com.expedientia.exception;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {

    public enum Code {
        PROMPT_INJECTION        (HttpStatus.BAD_REQUEST,           "Contenido no permitido detectado"),
        INTENT_BLOCKED_SECURITY (HttpStatus.FORBIDDEN,             "Acción bloqueada por seguridad"),
        INTENT_BLOCKED_CONTEXT  (HttpStatus.UNPROCESSABLE_ENTITY,  "Acción no permitida"),
        AI_EXTRACTION_FAILED    (HttpStatus.BAD_GATEWAY,           "Error al procesar la respuesta de IA"),
        DUPLICATE_RADICADO      (HttpStatus.CONFLICT,              "Radicado duplicado");

        public final HttpStatus status;
        public final String title;

        Code(HttpStatus status, String title) {
            this.status = status;
            this.title = title;
        }
    }

    private final Code code;
    private final String detail;

    public AppException(Code code, String detail) {
        super(detail);
        this.code = code;
        this.detail = detail;
    }

    public Code getCode()   { return code; }
    public String getDetail() { return detail; }
}
