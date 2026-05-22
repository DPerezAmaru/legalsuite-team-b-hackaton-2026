package com.expedientia.dto;

import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import java.util.List;

public record ProcesoSugeridoDTO(
    String radicado,
    Expediente.Especialidad especialidad,
    Expediente.Estado estado,
    String despacho,
    String ciudad,
    String resumen,
    List<ParteExtraidaDTO> partes
) {
    public record ParteExtraidaDTO(
        String nombre,
        String identificacion,
        Parte.TipoParticipacion tipoParticipacion
    ) {}
}
