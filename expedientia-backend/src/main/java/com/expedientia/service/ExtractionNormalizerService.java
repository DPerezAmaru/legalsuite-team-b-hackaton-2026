package com.expedientia.service;

import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class ExtractionNormalizerService {

    private static final Set<String> VALID_PARTICIPACIONES = Set.of(
        "DEMANDANTE", "DEMANDADO", "APODERADO", "TERCERO"
    );

    public CreateExpedienteRequest normalize(CreateExpedienteRequest raw) {
        String titulo = normalizeTitulo(raw.titulo(), raw.partes(), raw.radicado());
        List<CreateExpedienteRequest.ParteRequest> partes = normalizePartes(raw.partes());

        return new CreateExpedienteRequest(
            raw.radicado() != null ? raw.radicado().trim() : null,
            titulo,
            raw.especialidad(),
            trim(raw.despacho()),
            trim(raw.ciudad()),
            normalizeEstado(raw.estado()),
            trim(raw.resumen()),
            trim(raw.resuelve()),
            null,
            raw.documentoOrigenId(),
            partes
        );
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
        if (radicado != null && !radicado.isBlank()) {
            return "Expediente " + radicado.trim();
        }
        return "Expediente sin radicado";
    }

    private Expediente.Estado normalizeEstado(Expediente.Estado estado) {
        if (estado == null) return Expediente.Estado.ACTIVO;
        try {
            return Expediente.Estado.valueOf(estado.name());
        } catch (IllegalArgumentException e) {
            return Expediente.Estado.ACTIVO;
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
