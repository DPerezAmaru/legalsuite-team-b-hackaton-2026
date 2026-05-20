package com.expedientia.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parte")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Parte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediente_id", nullable = false)
    private Expediente expediente;

    @Column(nullable = false)
    private String nombre;

    private String identificacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_participacion", nullable = false)
    private TipoParticipacion tipoParticipacion;

    public enum TipoParticipacion { DEMANDANTE, DEMANDADO, APODERADO, TERCERO }
}
