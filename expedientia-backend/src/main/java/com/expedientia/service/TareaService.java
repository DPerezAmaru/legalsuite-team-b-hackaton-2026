package com.expedientia.service;

import com.expedientia.dto.TareaDTO;
import com.expedientia.entity.Expediente;
import com.expedientia.entity.Tarea;
import com.expedientia.exception.ResourceNotFoundException;
import com.expedientia.repository.ExpedienteRepository;
import com.expedientia.repository.TareaRepository;
import com.expedientia.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TareaService {

    private final TareaRepository tareaRepo;
    private final ExpedienteRepository expedienteRepo;
    private final UsuarioRepository usuarioRepo;

    public TareaService(TareaRepository tareaRepo,
                        ExpedienteRepository expedienteRepo,
                        UsuarioRepository usuarioRepo) {
        this.tareaRepo = tareaRepo;
        this.expedienteRepo = expedienteRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @Transactional
    public TareaDTO crear(TareaDTO dto, Long usuarioId) {
        Expediente exp = expedienteRepo.findById(dto.expedienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", dto.expedienteId()));

        Tarea tarea = new Tarea();
        tarea.setExpediente(exp);
        tarea.setTitulo(dto.titulo());
        tarea.setDescripcion(dto.descripcion());
        tarea.setEstado(dto.estado() != null ? dto.estado() : Tarea.Estado.PENDIENTE);
        tarea.setPrioridad(dto.prioridad() != null ? dto.prioridad() : Tarea.Prioridad.MEDIA);
        tarea.setFechaVencimiento(dto.fechaVencimiento());
        tarea.setSugeridaPorIa(dto.sugeridaPorIa() != null ? dto.sugeridaPorIa() : false);

        if (dto.asignadoAId() != null) {
            usuarioRepo.findById(dto.asignadoAId()).ifPresent(tarea::setAsignadoA);
        }
        if (usuarioId != null) {
            usuarioRepo.findById(usuarioId).ifPresent(tarea::setCreadoPor);
        }

        return toDTO(tareaRepo.save(tarea));
    }

    public TareaDTO obtener(Long id) {
        return toDTO(findById(id));
    }

    public List<TareaDTO> listar() {
        return tareaRepo.findAll().stream().map(this::toDTO).toList();
    }

    public List<TareaDTO> listarPorExpediente(Long expedienteId) {
        return tareaRepo.findByExpediente_Id(expedienteId)
                .stream().map(this::toDTO).toList();
    }

    public List<TareaDTO> listarPorRadicado(String radicado) {
        Expediente exp = expedienteRepo.findFirstByRadicado(radicado)
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", 0L));
        return tareaRepo.findByExpediente_Id(exp.getId())
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public TareaDTO actualizar(Long id, TareaDTO dto) {
        Tarea tarea = findById(id);

        if (dto.titulo() != null) tarea.setTitulo(dto.titulo());
        if (dto.descripcion() != null) tarea.setDescripcion(dto.descripcion());
        if (dto.estado() != null) tarea.setEstado(dto.estado());
        if (dto.prioridad() != null) tarea.setPrioridad(dto.prioridad());
        if (dto.fechaVencimiento() != null) tarea.setFechaVencimiento(dto.fechaVencimiento());
        if (dto.sugeridaPorIa() != null) tarea.setSugeridaPorIa(dto.sugeridaPorIa());
        if (dto.asignadoAId() != null) {
            usuarioRepo.findById(dto.asignadoAId()).ifPresent(tarea::setAsignadoA);
        }

        return toDTO(tareaRepo.save(tarea));
    }

    @Transactional
    public List<TareaDTO> crearMasivoDesdeIA(List<TareaDTO> dtos, Long usuarioId) {
        if (dtos.isEmpty()) return List.of();

        com.expedientia.entity.Usuario usuario = usuarioId != null
                ? usuarioRepo.findById(usuarioId).orElse(null) : null;

        List<Tarea> tareas = dtos.stream().map(dto -> {
            Expediente exp = expedienteRepo.findById(dto.expedienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Expediente", dto.expedienteId()));
            Tarea tarea = new Tarea();
            tarea.setExpediente(exp);
            tarea.setTitulo(dto.titulo());
            tarea.setDescripcion(dto.descripcion());
            tarea.setEstado(dto.estado() != null ? dto.estado() : Tarea.Estado.PENDIENTE);
            tarea.setPrioridad(dto.prioridad() != null ? dto.prioridad() : Tarea.Prioridad.MEDIA);
            tarea.setFechaVencimiento(dto.fechaVencimiento());
            tarea.setSugeridaPorIa(true);
            if (usuario != null) tarea.setCreadoPor(usuario);
            return tarea;
        }).toList();

        return tareaRepo.saveAll(tareas).stream().map(this::toDTO).toList();
    }

    public List<TareaDTO> listarProximas(int days) {
        LocalDate deadline = LocalDate.now().plusDays(days);
        return tareaRepo.findByFechaVencimientoLessThanEqualAndEstadoIn(
                deadline, List.of(Tarea.Estado.PENDIENTE, Tarea.Estado.EN_PROGRESO))
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public void eliminar(Long id) {
        if (!tareaRepo.existsById(id)) throw new ResourceNotFoundException("Tarea", id);
        tareaRepo.deleteById(id);
    }

    private Tarea findById(Long id) {
        return tareaRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarea", id));
    }

    private TareaDTO toDTO(Tarea t) {
        return new TareaDTO(
                t.getId(),
                t.getTitulo(),
                t.getDescripcion(),
                t.getEstado(),
                t.getPrioridad(),
                t.getFechaVencimiento(),
                t.getSugeridaPorIa(),
                t.getAsignadoA() != null ? t.getAsignadoA().getId() : null,
                t.getExpediente().getId()
        );
    }
}
