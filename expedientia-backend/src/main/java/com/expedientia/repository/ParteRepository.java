package com.expedientia.repository;

import com.expedientia.entity.Parte;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParteRepository extends JpaRepository<Parte, Long> {
    List<Parte> findByExpediente_Id(Long expedienteId);
}
