package com.expedientia.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        log.debug("Resource not found: {}", ex.getMessage());
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail handleRouteNotFound(NoResourceFoundException ex) {
        log.debug("Route not found: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND,
                "El recurso solicitado no existe.");
        pd.setTitle("No encontrado");
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .reduce("", (a, b) -> a.isEmpty() ? b : a + "; " + b);
        log.debug("Validation error: {}", detail);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        pd.setTitle("Error de validación");
        return pd;
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ProblemDetail handleMissingParam(MissingServletRequestParameterException ex) {
        log.debug("Missing request param: {}", ex.getParameterName());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "El parámetro '" + ex.getParameterName() + "' es obligatorio.");
        pd.setTitle("Parámetro faltante");
        return pd;
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.debug("Type mismatch for param '{}': {}", ex.getName(), ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "El parámetro '" + ex.getName() + "' tiene un formato inválido.");
        pd.setTitle("Parámetro inválido");
        return pd;
    }

    @ExceptionHandler(AppException.class)
    public ProblemDetail handleApp(AppException ex) {
        log.warn("AppException [{}]: {}", ex.getCode(), ex.getDetail());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(ex.getCode().status, ex.getCode().title);
        pd.setTitle(ex.getCode().title);
        pd.setProperty("code", ex.getCode().name());
        return pd;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        String detail = ex.getMostSpecificCause().getMessage() != null
                && ex.getMostSpecificCause().getMessage().contains("radicado")
                ? "Ya existe un expediente con ese radicado."
                : "El registro ya existe o viola una restricción de unicidad.";
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detail);
        pd.setTitle("Conflicto de datos");
        return pd;
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDetail handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        log.debug("Method not supported: {}", ex.getMethod());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.METHOD_NOT_ALLOWED,
                "El método HTTP '" + ex.getMethod() + "' no está soportado para este endpoint.");
        pd.setTitle("Método no permitido");
        return pd;
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ProblemDetail handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex) {
        log.debug("Unsupported media type: {}", ex.getContentType());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "El Content-Type enviado no es soportado por este endpoint.");
        pd.setTitle("Content-Type no soportado");
        return pd;
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ProblemDetail handleMissingRequestPart(MissingServletRequestPartException ex) {
        log.debug("Missing request part: {}", ex.getRequestPartName());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "El campo '" + ex.getRequestPartName() + "' es obligatorio.");
        pd.setTitle("Archivo faltante");
        return pd;
    }

    @ExceptionHandler(MultipartException.class)
    public ProblemDetail handleMultipart(MultipartException ex) {
        log.warn("Multipart error: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "El request multipart está malformado o incompleto.");
        pd.setTitle("Request inválido");
        return pd;
    }

    @ExceptionHandler(HttpMessageConversionException.class)
    public ProblemDetail handleMalformedRequest(HttpMessageConversionException ex) {
        log.debug("Malformed request body: {}", ex.getMostSpecificCause().getMessage());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "El cuerpo del request contiene un formato inválido. Verificá los tipos y valores enviados.");
        pd.setTitle("Request malformado");
        return pd;
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleMaxUpload(MaxUploadSizeExceededException ex) {
        log.debug("Upload size exceeded: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "El archivo supera el límite de 10 MB.");
        pd.setTitle("Archivo demasiado grande");
        return pd;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneral(Exception ex) {
        log.error("Unhandled exception [{}]: {}", ex.getClass().getName(), ex.getMessage(), ex);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error interno del servidor. Por favor intentá nuevamente.");
        pd.setTitle("Error interno");
        return pd;
    }
}
