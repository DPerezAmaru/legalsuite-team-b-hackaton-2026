package com.expedientia.dto;

import com.expedientia.entity.Tarea;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record TareaDTO(
    Long id,
    @NotBlank String titulo,
    String descripcion,
    @NotNull Tarea.Estado estado,
    @NotNull Tarea.Prioridad prioridad,
    LocalDate fechaVencimiento,
    Boolean sugeridaPorIa,
    Long asignadoAId,
    Long expedienteId,
    String expedienteTitulo
) {}
