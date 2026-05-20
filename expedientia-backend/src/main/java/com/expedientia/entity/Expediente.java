package com.expedientia.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "expediente")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expediente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String radicado;

    @Column(nullable = false)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Especialidad especialidad;

    private String despacho;
    private String ciudad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Estado estado;

    @Column(columnDefinition = "TEXT")
    private String resumen;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por")
    private Usuario creadoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_origen_id")
    private Documento documentoOrigen;

    @OneToMany(mappedBy = "expediente", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Parte> partes = new ArrayList<>();

    @OneToMany(mappedBy = "expediente", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Tarea> tareas = new ArrayList<>();

    public enum Especialidad { CIVIL, PENAL, LABORAL, ADMINISTRATIVO, FAMILIA }
    public enum Estado { ACTIVO, CERRADO, ARCHIVADO }
}
