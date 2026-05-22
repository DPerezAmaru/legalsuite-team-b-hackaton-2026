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

        if (!analisis.esDocumentoJudicial()) {
            throw new AppException(AppException.Code.PDF_NOT_JUDICIAL,
                    "El documento no parece ser un expediente judicial colombiano. " +
                    "Solo se aceptan autos, sentencias, demandas, memoriales y documentos procesales.");
        }

        return analisis;
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
