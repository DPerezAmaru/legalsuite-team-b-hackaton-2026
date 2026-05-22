package com.expedientia.service;

import com.expedientia.dto.ConfirmarProcesoRequest;
import com.expedientia.dto.ConfirmarProcesoResponse;
import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.DocumentoAnalisisResponse;
import com.expedientia.dto.ExpedienteDTO;
import com.expedientia.dto.ProcesoSugeridoDTO;
import com.expedientia.entity.Documento;
import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import com.expedientia.exception.AppException;
import com.expedientia.repository.DocumentoRepository;
import com.expedientia.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@Transactional
public class DocumentoService {

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

    /**
     * Extrae texto del PDF, valida que sea un documento judicial y retorna los procesos detectados.
     * No escribe nada en base de datos — el usuario debe confirmar antes de crear cualquier registro.
     */
    @Transactional(readOnly = true)
    public DocumentoAnalisisResponse procesar(MultipartFile file) {
        PdfTextExtractorService.ExtractionResult result = extractor.extract(file);

        DocumentoAnalisisResponse analisis = aiService.extraerProcesos(result.textForExtraction());

        if (analisis.procesos() == null || analisis.procesos().isEmpty()) {
            throw new AppException(AppException.Code.PDF_NOT_JUDICIAL,
                    "El documento no parece ser un expediente judicial colombiano. " +
                    "Solo se aceptan autos, sentencias, demandas, memoriales y documentos procesales.");
        }

        List<String> prompts = analisis.procesos().stream()
                .map(this::buildPromptParaChat)
                .toList();

        return new DocumentoAnalisisResponse(
                analisis.procesos().size(),
                analisis.sugerenciaTexto(),
                analisis.procesos(),
                prompts
        );
    }

    /**
     * Crea el Documento y el Expediente en base de datos, luego genera las tareas sugeridas.
     * Se llama una vez por cada proceso que el usuario decide confirmar.
     */
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
                null,
                datos.especialidad(),
                datos.despacho(),
                datos.ciudad(),
                datos.estado(),
                datos.resumen(),
                null,
                savedDoc.getId(),
                mapPartes(datos.partes())
        );

        CreateExpedienteRequest normalized = normalizer.normalize(req);
        ExpedienteDTO expedienteDTO = expedienteService.crear(normalized, usuarioId);

        List<String> tareas = aiService.generarTareasParaProceso(datos);

        return new ConfirmarProcesoResponse(expedienteDTO, tareas);
    }

    private String buildPromptParaChat(ProcesoSugeridoDTO proceso) {
        StringBuilder sb = new StringBuilder("Crear expediente.");
        if (proceso.radicado() != null)
            sb.append(" Radicado: ").append(proceso.radicado()).append(".");
        if (proceso.especialidad() != null)
            sb.append(" Especialidad: ").append(proceso.especialidad()).append(".");
        if (proceso.estado() != null)
            sb.append(" Estado: ").append(proceso.estado()).append(".");
        if (proceso.despacho() != null)
            sb.append(" Despacho: ").append(proceso.despacho()).append(".");
        if (proceso.ciudad() != null)
            sb.append(" Ciudad: ").append(proceso.ciudad()).append(".");
        if (proceso.partes() != null) {
            proceso.partes().forEach(p ->
                sb.append(" ").append(p.tipoParticipacion()).append(": ").append(p.nombre())
                  .append(p.identificacion() != null ? " (" + p.identificacion() + ")" : "").append(".")
            );
        }
        if (proceso.resumen() != null) {
            // Truncar resumen para no superar el límite de 800 chars del chat
            String resumen = proceso.resumen();
            int available = 800 - sb.length() - 10;
            if (available > 20) {
                sb.append(" Resumen: ").append(resumen, 0, Math.min(resumen.length(), available)).append(".");
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
}
