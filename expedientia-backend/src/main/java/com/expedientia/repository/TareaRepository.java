package com.expedientia.repository;

import com.expedientia.entity.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findByExpediente_Id(Long expedienteId);
    List<Tarea> findByAsignadoA_Id(Long userId);
    List<Tarea> findByFechaVencimientoLessThanEqualAndEstadoIn(LocalDate deadline, List<Tarea.Estado> estados);
}
