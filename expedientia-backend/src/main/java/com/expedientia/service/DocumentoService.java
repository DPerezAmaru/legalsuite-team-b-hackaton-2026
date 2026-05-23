package com.expedientia.service;

import com.expedientia.dto.BulkAnalisisResponse;
import com.expedientia.dto.BulkConfirmarRequest;
import com.expedientia.dto.BulkConfirmarResponse;
import com.expedientia.dto.ConfirmarProcesoRequest;
import com.expedientia.dto.ConfirmarProcesoResponse;
import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.DocumentoAnalisisResponse;
import com.expedientia.dto.ExpedienteDTO;
import com.expedientia.dto.ProcesoSugeridoDTO;
import com.expedientia.entity.Documento;
import com.expedientia.entity.Parte;
import com.expedientia.exception.AppException;
import com.expedientia.repository.DocumentoRepository;
import com.expedientia.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Transactional
public class DocumentoService {

    private static final int MAX_BULK_FILES = 5;
    private static final long MAX_BYTES = 10L * 1024 * 1024;

    private final PdfTextExtractorService extractor;
    private final AIService aiService;
    private final DocumentoRepository documentoRepo;
    private final UsuarioRepository usuarioRepo;
    private final ExpedienteService expedienteService;
    private final ExtractionNormalizerService normalizer;

    public DocumentoService(PdfTextExtractorService extractor,
                            AIService aiService,
                            DocumentoRepository documentoRepo,
                            UsuarioRepository usuarioRepo,
                            ExpedienteService expedienteService,
                            ExtractionNormalizerService normalizer) {
        this.extractor = extractor;
        this.aiService = aiService;
        this.documentoRepo = documentoRepo;
        this.usuarioRepo = usuarioRepo;
        this.expedienteService = expedienteService;
        this.normalizer = normalizer;
    }

    @Transactional(readOnly = true)
    public DocumentoAnalisisResponse procesar(MultipartFile file) {
        PdfTextExtractorService.ExtractionResult result = extractor.extract(file);
        DocumentoAnalisisResponse analisis = aiService.extraerProcesos(result.textForExtraction());

        if (!analisis.esDocumentoJudicial()) {
            throw new AppException(AppException.Code.PDF_NOT_JUDICIAL,
                    "El documento no parece ser un expediente judicial colombiano. " +
                    "Solo se aceptan autos, sentencias, demandas, memoriales y documentos procesales.");
        }

        List<String> prompts = analisis.procesos().stream()
                .map(this::buildPromptParaChat)
                .toList();

        return new DocumentoAnalisisResponse(
                true,
                analisis.procesos().size(),
                analisis.sugerenciaTexto(),
                analisis.procesos(),
                prompts
        );
    }

    public ConfirmarProcesoResponse confirmar(ConfirmarProcesoRequest request, Long usuarioId) {
        ProcesoSugeridoDTO datos = request.datos();

        Documento documento = new Documento();
        documento.setNombreArchivo(request.nombreArchivo());
        documento.setRutaArchivo("uploads/" + request.nombreArchivo());
        documento.setContenidoExtraido(datos.resumen());
        documento.setEstadoProcesamiento(Documento.EstadoProcesamiento.PROCESADO);
        documento.setFechaSubida(LocalDateTime.now());

        if (usuarioId != null) {
            usuarioRepo.findById(usuarioId).ifPresent(documento::setSubidoPor);
        }

        Documento savedDoc = documentoRepo.save(documento);

        CreateExpedienteRequest req = new CreateExpedienteRequest(
                datos.radicado(),
                datos.titulo(),
                datos.especialidad(),
                datos.despacho(),
                datos.ciudad(),
                datos.estado(),
                datos.resumen(),
                datos.resuelve(),
                null,
                savedDoc.getId(),
                mapPartes(datos.partes())
        );

        CreateExpedienteRequest normalized = normalizer.normalize(req);
        ExpedienteDTO expedienteDTO = expedienteService.crear(normalized, usuarioId);
        List<String> tareas = aiService.generarTareasParaProceso(datos);

        return new ConfirmarProcesoResponse(expedienteDTO, tareas);
    }

    @Transactional(readOnly = true)
    public BulkAnalisisResponse bulkAnalizar(List<MultipartFile> files) {
        if (files.size() > MAX_BULK_FILES) {
            String nombres = files.stream()
                    .map(f -> f.getOriginalFilename() != null ? f.getOriginalFilename() : "sin-nombre")
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            throw new AppException(AppException.Code.BULK_LIMIT_EXCEEDED,
                    "Máximo " + MAX_BULK_FILES + " archivos por solicitud. " +
                    "Recibidos " + files.size() + ": " + nombres);
        }

        ExecutorService executor = Executors.newFixedThreadPool(Math.min(files.size(), MAX_BULK_FILES));
        try {
            List<FileResult> results = files.stream()
                    .map(file -> CompletableFuture.supplyAsync(() -> processFileSingle(file), executor))
                    .toList()
                    .stream()
                    .map(CompletableFuture::join)
                    .toList();

            List<BulkAnalisisResponse.ProcesoEncontrado> procesos = new ArrayList<>();
            List<BulkAnalisisResponse.ArchivoOmitido> omitidos = new ArrayList<>();
            int indice = 1;

            for (FileResult result : results) {
                if (result.omitido()) {
                    omitidos.add(new BulkAnalisisResponse.ArchivoOmitido(result.filename(), result.razon()));
                } else {
                    for (ProcesoSugeridoDTO proceso : result.procesos()) {
                        procesos.add(new BulkAnalisisResponse.ProcesoEncontrado(indice++, result.filename(), proceso));
                    }
                }
            }

            return new BulkAnalisisResponse(files.size(), procesos.size(), procesos, omitidos);
        } finally {
            executor.shutdown();
        }
    }

    public BulkConfirmarResponse bulkConfirmar(BulkConfirmarRequest request, Long usuarioId) {
        List<BulkConfirmarResponse.Omitido> omitidos = new ArrayList<>();
        List<ExpedienteDTO> expedientes = new ArrayList<>();

        for (Integer indice : request.seleccionados()) {
            BulkAnalisisResponse.ProcesoEncontrado encontrado = request.procesos().stream()
                    .filter(p -> p.indice() == indice)
                    .findFirst()
                    .orElse(null);

            if (encontrado == null) {
                omitidos.add(new BulkConfirmarResponse.Omitido(
                        indice, "desconocido", "Índice " + indice + " no encontrado"));
                continue;
            }

            try {
                ConfirmarProcesoRequest req = new ConfirmarProcesoRequest(
                        indice, encontrado.datos(), encontrado.archivoOrigen());
                expedientes.add(confirmar(req, usuarioId).expediente());
            } catch (AppException e) {
                omitidos.add(new BulkConfirmarResponse.Omitido(
                        indice, encontrado.archivoOrigen(), e.getDetail()));
            }
        }

        return new BulkConfirmarResponse(expedientes.size(), omitidos.size(), expedientes, omitidos);
    }

    private FileResult processFileSingle(MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "sin-nombre";

        if (file.isEmpty()) {
            return FileResult.omitido(filename, "El archivo está vacío");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            return FileResult.omitido(filename, "No es un PDF válido (tipo: " + contentType + ")");
        }
        if (file.getSize() > MAX_BYTES) {
            return FileResult.omitido(filename,
                    "Supera el límite de 10 MB (" + String.format("%.1f", file.getSize() / 1_048_576.0) + " MB)");
        }

        try {
            PdfTextExtractorService.ExtractionResult extracted = extractor.extract(file);
            DocumentoAnalisisResponse analisis = aiService.extraerProcesos(extracted.textForExtraction());

            if (!analisis.esDocumentoJudicial()) {
                return FileResult.omitido(filename, "No es un expediente judicial colombiano");
            }

            return FileResult.ok(filename, analisis.procesos());
        } catch (AppException e) {
            return FileResult.omitido(filename, e.getDetail());
        } catch (Exception e) {
            return FileResult.omitido(filename, "Error inesperado al procesar el archivo");
        }
    }

    private String buildPromptParaChat(ProcesoSugeridoDTO proceso) {
        StringBuilder sb = new StringBuilder("Crear expediente.");
        if (proceso.radicado() != null) sb.append(" Radicado: ").append(proceso.radicado()).append(".");
        if (proceso.especialidad() != null) sb.append(" Especialidad: ").append(proceso.especialidad()).append(".");
        if (proceso.estado() != null) sb.append(" Estado: ").append(proceso.estado()).append(".");
        if (proceso.despacho() != null) sb.append(" Despacho: ").append(proceso.despacho()).append(".");
        if (proceso.ciudad() != null) sb.append(" Ciudad: ").append(proceso.ciudad()).append(".");
        if (proceso.partes() != null) {
            proceso.partes().forEach(p ->
                sb.append(" ").append(p.tipoParticipacion()).append(": ").append(p.nombre())
                  .append(p.identificacion() != null ? " (" + p.identificacion() + ")" : "").append(".")
            );
        }
        if (proceso.resumen() != null) {
            int available = 800 - sb.length() - 10;
            if (available > 20) {
                sb.append(" Resumen: ")
                  .append(proceso.resumen(), 0, Math.min(proceso.resumen().length(), available))
                  .append(".");
            }
        }
        return sb.toString();
    }

    private List<CreateExpedienteRequest.ParteRequest> mapPartes(List<ProcesoSugeridoDTO.ParteExtraidaDTO> partes) {
        if (partes == null) return Collections.emptyList();
        return partes.stream()
                .filter(p -> p != null && p.nombre() != null && !p.nombre().isBlank())
                .map(p -> new CreateExpedienteRequest.ParteRequest(
                        p.nombre(),
                        p.identificacion(),
                        p.tipoParticipacion() != null ? p.tipoParticipacion() : Parte.TipoParticipacion.TERCERO
                ))
                .toList();
    }

    private record FileResult(String filename, List<ProcesoSugeridoDTO> procesos, String razon) {
        static FileResult ok(String filename, List<ProcesoSugeridoDTO> procesos) {
            return new FileResult(filename, procesos, null);
        }
        static FileResult omitido(String filename, String razon) {
            return new FileResult(filename, List.of(), razon);
        }
        boolean omitido() { return razon != null; }
    }
}
