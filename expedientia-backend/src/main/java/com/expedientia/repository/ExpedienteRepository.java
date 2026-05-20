package com.expedientia.repository;

import com.expedientia.entity.Expediente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExpedienteRepository extends JpaRepository<Expediente, Long> {
    Optional<Expediente> findByRadicado(String radicado);
    List<Expediente> findByEstado(Expediente.Estado estado);
    List<Expediente> findByCreadoPor_Id(Long userId);
}
