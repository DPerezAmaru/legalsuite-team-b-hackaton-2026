package com.expedientia.service;

import com.expedientia.dto.CreateExpedienteRequest;
import com.expedientia.dto.ExpedienteDTO;
import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import com.expedientia.exception.AppException;
import com.expedientia.exception.ResourceNotFoundException;
import com.expedientia.repository.DocumentoRepository;
import com.expedientia.repository.ExpedienteRepository;
import com.expedientia.repository.ParteRepository;
import com.expedientia.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ExpedienteService {

    private final ExpedienteRepository expedienteRepo;
    private final ParteRepository parteRepo;
    private final UsuarioRepository usuarioRepo;
    private final DocumentoRepository documentoRepo;

    public ExpedienteService(ExpedienteRepository expedienteRepo,
                             ParteRepository parteRepo,
                             UsuarioRepository usuarioRepo,
                             DocumentoRepository documentoRepo) {
        this.expedienteRepo = expedienteRepo;
        this.parteRepo = parteRepo;
        this.usuarioRepo = usuarioRepo;
        this.documentoRepo = documentoRepo;
    }

    public ExpedienteDTO crear(CreateExpedienteRequest req, Long usuarioId) {
        Expediente exp = new Expediente();
        exp.setRadicado(req.radicado());
        exp.setTitulo(req.titulo());
        exp.setEspecialidad(req.especialidad());
        exp.setDespacho(req.despacho());
        exp.setCiudad(req.ciudad());
        exp.setEstado(req.estado() != null ? req.estado() : Expediente.Estado.ACTIVO);
        exp.setResumen(req.resumen());
        exp.setResuelve(req.resuelve());
        exp.setFechaInicio(req.fechaInicio());
        exp.setCreatedAt(LocalDateTime.now());

        if (usuarioId != null) {
            usuarioRepo.findById(usuarioId).ifPresent(exp::setCreadoPor);
        }

        if (req.documentoOrigenId() != null) {
            documentoRepo.findById(req.documentoOrigenId()).ifPresent(exp::setDocumentoOrigen);
        }

        // Check duplicate radicado
        if (expedienteRepo.findByRadicado(exp.getRadicado()).isPresent()) {
            throw new AppException(AppException.Code.DUPLICATE_RADICADO, "Ya existe un expediente con el radicado: " + exp.getRadicado());
        }

        Expediente saved = expedienteRepo.save(exp);

        if (req.partes() != null) {
            req.partes().forEach(p -> {
                Parte parte = new Parte();
                parte.setNombre(p.nombre());
                parte.setIdentificacion(p.identificacion());
                parte.setTipoParticipacion(p.tipoParticipacion());
                parte.setExpediente(saved);
                parteRepo.save(parte);
            });
        }

        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<ExpedienteDTO> listar() {
        return expedienteRepo.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public ExpedienteDTO obtener(Long id) {
        return toDTO(findById(id));
    }

    @Transactional(readOnly = true)
    public ExpedienteDTO obtenerPorRadicado(String radicado) {
        return toDTO(expedienteRepo.findByRadicado(radicado)
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", 0L)));
    }

    public ExpedienteDTO actualizar(Long id, CreateExpedienteRequest req) {
        Expediente exp = findById(id);
        if (req.radicado() != null) exp.setRadicado(req.radicado());
        if (req.titulo() != null) exp.setTitulo(req.titulo());
        if (req.especialidad() != null) exp.setEspecialidad(req.especialidad());
        if (req.despacho() != null) exp.setDespacho(req.despacho());
        if (req.ciudad() != null) exp.setCiudad(req.ciudad());
        if (req.estado() != null) exp.setEstado(req.estado());
        if (req.resumen() != null) exp.setResumen(req.resumen());
        if (req.resuelve() != null) exp.setResuelve(req.resuelve());
        if (req.fechaInicio() != null) exp.setFechaInicio(req.fechaInicio());
        return toDTO(expedienteRepo.save(exp));
    }

    public void eliminar(Long id) {
        if (!expedienteRepo.existsById(id)) throw new ResourceNotFoundException("Expediente", id);
        expedienteRepo.deleteById(id);
    }

    private Expediente findById(Long id) {
        return expedienteRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", id));
    }

    private ExpedienteDTO toDTO(Expediente exp) {
        List<ExpedienteDTO.ParteDTO> partes = parteRepo.findByExpediente_Id(exp.getId())
                .stream()
                .map(p -> new ExpedienteDTO.ParteDTO(
                        p.getId(),
                        p.getNombre(),
                        p.getIdentificacion(),
                        p.getTipoParticipacion().name()))
                .toList();

        return new ExpedienteDTO(
                exp.getId(),
                exp.getRadicado(),
                exp.getTitulo(),
                exp.getEspecialidad(),
                exp.getDespacho(),
                exp.getCiudad(),
                exp.getEstado(),
                exp.getResumen(),
                exp.getResuelve(),
                exp.getFechaInicio(),
                exp.getCreatedAt(),
                exp.getCreadoPor() != null ? exp.getCreadoPor().getId() : null,
                exp.getDocumentoOrigen() != null ? exp.getDocumentoOrigen().getId() : null,
                partes
        );
    }
}
