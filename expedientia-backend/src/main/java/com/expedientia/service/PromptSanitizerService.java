package com.expedientia.service;

import com.expedientia.exception.AppException;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class PromptSanitizerService {

    private static final int MAX_LENGTH = 800;

    private static final List<String> INJECTION_PATTERNS = List.of(
        "ignore previous", "ignore las instrucciones", "olvida las instrucciones",
        "system prompt", "instrucciones del sistema", "system instruction",
        "jailbreak", "dan mode", "modo dan",
        "you are now", "ahora sos", "ahora eres",
        "act as", "actuá como", "actúa como",
        "pretend you", "hacé como si", "finge que",
        "reveal your", "mostrá tu prompt", "muestra tu prompt",
        "forget your instructions", "olvidá tus instrucciones",
        "override instructions", "anulá las instrucciones",
        "new instructions:", "nuevas instrucciones:",
        "</system>", "<|system|>", "###instruction"
    );

    private static final Pattern HTML_PATTERN = Pattern.compile("<[^>]+>");
    // Caracteres de control ilegales: cualquier char < 0x20 excepto \t (9) y \n (10)
    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]");

    public String sanitize(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new AppException(AppException.Code.PROMPT_INJECTION, "Solicitud contiene contenido no permitido");
        }

        // ── PASO 1: Integridad del string ─────────────────────────────────────
        // Verificar que puede ser procesado como texto válido
        validateStringIntegrity(raw);

        // Normalize unicode (handles lookalike characters)
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFKC).trim();

        // Strip HTML
        String clean = HTML_PATTERN.matcher(normalized).replaceAll(" ").trim();

        // Length check (after strip)
        if (clean.length() > MAX_LENGTH) {
            clean = clean.substring(0, MAX_LENGTH);
        }

        // Injection detection (case-insensitive)
        // NOTA: este blacklist detecta patrones obvios pero NO es la defensa principal.
        // La defensa real es el system prompt de AIService que restringe a Gemini a solo extraer datos.
        String lower = clean.toLowerCase();
        for (String pattern : INJECTION_PATTERNS) {
            if (lower.contains(pattern)) {
                throw new AppException(AppException.Code.PROMPT_INJECTION, "Patrón no permitido detectado: " + pattern);
            }
        }

        return clean;
    }

    private void validateStringIntegrity(String input) {
        // Null bytes: rompen parsers, logs y queries silenciosamente
        if (input.indexOf('\0') >= 0) {
            throw new AppException(AppException.Code.PROMPT_INJECTION, "Solicitud contiene contenido no permitido");
        }

        // Caracteres de control (excluye \t y \n que son válidos en texto)
        if (CONTROL_CHARS.matcher(input).find()) {
            throw new AppException(AppException.Code.PROMPT_INJECTION, "Solicitud contiene contenido no permitido");
        }

        // Verificar que el string puede ser re-encoded como UTF-8 sin pérdida
        try {
            byte[] bytes = input.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            String roundtrip = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
            if (!input.equals(roundtrip)) {
                throw new AppException(AppException.Code.PROMPT_INJECTION, "Solicitud contiene contenido no permitido");
            }
        } catch (Exception e) {
            throw new AppException(AppException.Code.PROMPT_INJECTION, "Solicitud contiene contenido no permitido");
        }
    }
}
