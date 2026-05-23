package com.expedientia.dto;

import java.util.List;

public record BulkConfirmarRequest(
    List<Integer> seleccionados,
    List<BulkAnalisisResponse.ProcesoEncontrado> procesos
) {}
