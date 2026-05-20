package com.expedientia.dto;

import com.expedientia.entity.Expediente;
import com.expedientia.entity.Parte;
import java.util.List;

public record DocumentoExtraidoDTO(
    Long documentoId,
    String radicado,
    Expediente.Especialidad especialidad,
    String despacho,
    String ciudad,
    String resumen,
    List<ParteExtraidaDTO> partes,
    List<String> tareasSugeridas
) {
    public record ParteExtraidaDTO(
        String nombre,
        String identificacion,
        Parte.TipoParticipacion tipoParticipacion
    ) {}
}
