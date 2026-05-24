package com.expedientia.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .reduce("", (a, b) -> a.isEmpty() ? b : a + "; " + b);
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }

    @ExceptionHandler(AppException.class)
    public ProblemDetail handleApp(AppException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(ex.getCode().status, ex.getDetail());
        pd.setTitle(ex.getCode().title);
        pd.setProperty("code", ex.getCode().name());
        return pd;
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ProblemDetail handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "El endpoint requiere multipart/form-data. Enviá el archivo como form-data, no como JSON.");
        pd.setTitle("Content-Type no soportado");
        return pd;
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ProblemDetail handleMissingRequestPart(MissingServletRequestPartException ex) {
        String campo = ex.getRequestPartName();
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "El campo '" + campo + "' es obligatorio. Enviá el archivo como form-data con clave '" + campo + "'.");
        pd.setTitle("Archivo faltante");
        return pd;
    }

    @ExceptionHandler(HttpMessageConversionException.class)
    public ProblemDetail handleMalformedRequest(HttpMessageConversionException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "El cuerpo del request está malformado: " + ex.getMostSpecificCause().getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleMaxUpload(MaxUploadSizeExceededException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "El archivo supera el límite de 10 MB.");
        pd.setTitle("Archivo demasiado grande");
        return pd;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneral(Exception ex) {
        log.error("Excepción no manejada [{}]: {}", ex.getClass().getName(), ex.getMessage(), ex);
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }
}
