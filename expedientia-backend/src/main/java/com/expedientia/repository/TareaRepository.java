package com.expedientia.repository;

import com.expedientia.entity.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findByExpediente_Id(Long expedienteId);
    List<Tarea> findByAsignadoA_Id(Long userId);
}
