package com.expedientia.service;

import com.expedientia.exception.AppException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.regex.Pattern;

@Service
public class PdfTextExtractorService {

    private static final long MAX_BYTES        = 10L * 1024 * 1024; // 10 MB
    private static final int  MAX_PAGES        = 50;
    private static final int  MIN_TEXT_LENGTH  = 50;   // umbral bajo para atrapar PDFs vacíos/corruptos
    private static final int  MAX_CHARS_EXTRACT = 20_000; // para extracción de datos
    private static final int  MAX_CHARS_SUMMARY = 15_000; // para resumen

    // Patrones de limpieza
    private static final Pattern PAGE_NUMBERS   = Pattern.compile("(?m)^\\s*[Pp]ágina?\\s+\\d+\\s*(de\\s+\\d+)?\\s*$");
    private static final Pattern FOLIO_NUMBERS  = Pattern.compile("(?m)^\\s*[Ff]olio\\s+\\d+\\s*$");
    private static final Pattern HYPHENATION    = Pattern.compile("-(\\r?\\n)\\s*");
    private static final Pattern MULTI_SPACES   = Pattern.compile("[ \\t]{2,}");
    private static final Pattern MULTI_NEWLINES = Pattern.compile("\\n{3,}");
    private static final Pattern CONTROL_CHARS  = Pattern.compile("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]");

    public record ExtractionResult(String textForExtraction, String textForSummary, int pages) {}

    public ExtractionResult extract(MultipartFile file) {
        validateFile(file);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new AppException(AppException.Code.PDF_INVALID, "No se pudo leer el archivo");
        }

        try (PDDocument document = Loader.loadPDF(bytes)) {
            int pages = document.getNumberOfPages();

            if (pages > MAX_PAGES) {
                throw new AppException(AppException.Code.PDF_TOO_LARGE,
                        "El PDF tiene " + pages + " páginas. Máximo permitido: " + MAX_PAGES);
            }

            PDFTextStripper stripper = new PDFTextStripper();
            String rawText = stripper.getText(document);

            if (rawText == null || rawText.trim().isEmpty()) {
                throw new AppException(AppException.Code.PDF_INVALID, "El PDF no contiene texto extraíble");
            }

            String clean = preprocess(rawText);

            if (clean.trim().length() < MIN_TEXT_LENGTH) {
                throw new AppException(AppException.Code.PDF_INVALID,
                        "El PDF contiene muy poco texto después de limpiar. Verificá que sea un documento válido");
            }

            return new ExtractionResult(
                truncate(clean, MAX_CHARS_EXTRACT),
                truncate(clean, MAX_CHARS_SUMMARY),
                pages
            );

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(AppException.Code.PDF_INVALID, "El archivo PDF está corrupto o no es válido");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(AppException.Code.PDF_INVALID, "No se recibió ningún archivo");
        }

        if (file.getSize() > MAX_BYTES) {
            throw new AppException(AppException.Code.PDF_TOO_LARGE,
                    "El archivo supera el límite de 10 MB (tamaño recibido: " +
                    String.format("%.1f", file.getSize() / 1_048_576.0) + " MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            throw new AppException(AppException.Code.PDF_INVALID,
                    "El archivo no es un PDF válido (tipo detectado: " + contentType + ")");
        }
    }

    private String preprocess(String raw) {
        // 1. Normalizar unicode
        String text = Normalizer.normalize(raw, Normalizer.Form.NFKC);

        // 2. Eliminar caracteres de control
        text = CONTROL_CHARS.matcher(text).replaceAll("");

        // 3. Reparar silabación: "proce-\nso" → "proceso"
        text = HYPHENATION.matcher(text).replaceAll("");

        // 4. Eliminar números de página y folios
        text = PAGE_NUMBERS.matcher(text).replaceAll("");
        text = FOLIO_NUMBERS.matcher(text).replaceAll("");

        // 5. Colapsar espacios múltiples
        text = MULTI_SPACES.matcher(text).replaceAll(" ");

        // 6. Colapsar saltos de línea excesivos (> 2 → 2)
        text = MULTI_NEWLINES.matcher(text).replaceAll("\n\n");

        return text.trim();
    }

    private String truncate(String text, int maxChars) {
        if (text.length() <= maxChars) return text;
        // Cortar en límite de palabra para no partir texto a la mitad
        int cut = text.lastIndexOf(' ', maxChars);
        return text.substring(0, cut > 0 ? cut : maxChars);
    }
}
