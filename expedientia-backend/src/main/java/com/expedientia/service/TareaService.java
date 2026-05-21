package com.expedientia.service;

import com.expedientia.dto.TareaDTO;
import com.expedientia.entity.Expediente;
import com.expedientia.entity.Tarea;
import com.expedientia.exception.ResourceNotFoundException;
import com.expedientia.repository.ExpedienteRepository;
import com.expedientia.repository.TareaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TareaService {

    private final TareaRepository tareaRepo;
    private final ExpedienteRepository expedienteRepo;

    public TareaService(TareaRepository tareaRepo, ExpedienteRepository expedienteRepo) {
        this.tareaRepo = tareaRepo;
        this.expedienteRepo = expedienteRepo;
    }

    public List<TareaDTO> listarPorExpediente(Long expedienteId) {
        return tareaRepo.findByExpediente_Id(expedienteId)
                .stream().map(this::toDTO).toList();
    }

    public List<TareaDTO> listarPorRadicado(String radicado) {
        Expediente exp = expedienteRepo.findByRadicado(radicado)
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", 0L));
        return tareaRepo.findByExpediente_Id(exp.getId())
                .stream().map(this::toDTO).toList();
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
