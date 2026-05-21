package com.expedientia.service;

import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import com.expedientia.repository.ExpedienteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class ExtractionNormalizerService {

    private static final Set<String> VALID_ESPECIALIDADES = Set.of(
        "CIVIL", "PENAL", "LABORAL", "ADMINISTRATIVO", "FAMILIA"
    );
    private static final Set<String> VALID_PARTICIPACIONES = Set.of(
        "DEMANDANTE", "DEMANDADO", "APODERADO", "TERCERO"
    );

    private final ExpedienteRepository expedienteRepository;

    public ExtractionNormalizerService(ExpedienteRepository expedienteRepository) {
        this.expedienteRepository = expedienteRepository;
    }

    public CreateExpedienteRequest normalize(CreateExpedienteRequest raw) {
        String radicado = normalizeRadicado(raw.radicado());
        String titulo = normalizeTitulo(raw.titulo(), raw.partes(), radicado);
        Expediente.Especialidad especialidad = normalizeEspecialidad(raw.especialidad());
        List<CreateExpedienteRequest.ParteRequest> partes = normalizePartes(raw.partes());

        return new CreateExpedienteRequest(
            radicado,
            titulo,
            especialidad,
            trim(raw.despacho()),
            trim(raw.ciudad()),
            Expediente.Estado.ACTIVO,
            trim(raw.resumen()),
            null,
            null,
            partes
        );
    }

    private String normalizeRadicado(String radicado) {
        if (radicado != null && !radicado.isBlank()) {
            return radicado.trim();
        }
        // Generate from system: YYYY-NNNNN
        int year = LocalDate.now().getYear();
        long count = expedienteRepository.count() + 1;
        return String.format("%d-%05d", year, count);
    }

    private String normalizeTitulo(String titulo, List<CreateExpedienteRequest.ParteRequest> partes, String radicado) {
        if (titulo != null && !titulo.isBlank()) {
            return titulo.trim();
        }
        if (partes != null && !partes.isEmpty()) {
            Optional<String> demandante = partes.stream()
                .filter(p -> p.tipoParticipacion() == Parte.TipoParticipacion.DEMANDANTE)
                .map(p -> lastName(p.nombre()))
                .findFirst();
            Optional<String> demandado = partes.stream()
                .filter(p -> p.tipoParticipacion() == Parte.TipoParticipacion.DEMANDADO)
                .map(p -> lastName(p.nombre()))
                .findFirst();
            if (demandante.isPresent() && demandado.isPresent()) {
                return demandante.get() + " vs. " + demandado.get();
            }
            if (demandante.isPresent()) {
                return "Expediente " + demandante.get();
            }
        }
        return "Expediente " + radicado;
    }

    private Expediente.Especialidad normalizeEspecialidad(Expediente.Especialidad especialidad) {
        if (especialidad == null) return Expediente.Especialidad.CIVIL;
        try {
            return Expediente.Especialidad.valueOf(especialidad.name());
        } catch (IllegalArgumentException e) {
            return Expediente.Especialidad.CIVIL;
        }
    }

    private List<CreateExpedienteRequest.ParteRequest> normalizePartes(
            List<CreateExpedienteRequest.ParteRequest> partes) {
        if (partes == null) return Collections.emptyList();
        return partes.stream()
            .filter(p -> p != null && p.nombre() != null && !p.nombre().isBlank())
            .filter(p -> p.tipoParticipacion() != null)
            .map(p -> new CreateExpedienteRequest.ParteRequest(
                p.nombre().trim(),
                p.identificacion() != null ? p.identificacion().trim() : null,
                p.tipoParticipacion()
            ))
            .toList();
    }

    private String trim(String value) {
        return value != null ? value.trim() : null;
    }

    private String lastName(String fullName) {
        if (fullName == null) return "Parte";
        String[] parts = fullName.trim().split("\\s+");
        return parts[parts.length - 1];
    }
}
