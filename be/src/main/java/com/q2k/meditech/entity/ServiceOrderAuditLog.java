package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Audit log specifically for the Service Order workflow.
 * Tracks every state change across the full lifecycle:
 *   order created → payment → in-progress → result completed → consultation finalized → cancelled
 */
@Entity
@Table(name = "service_order_audit_logs", indexes = {
        @Index(name = "idx_soal_event_type", columnList = "event_type"),
        @Index(name = "idx_soal_actor", columnList = "actor_user_id"),
        @Index(name = "idx_soal_appointment", columnList = "appointment_id"),
        @Index(name = "idx_soal_service_order", columnList = "service_order_id"),
        @Index(name = "idx_soal_created", columnList = "created_at"),
        @Index(name = "idx_soal_patient", columnList = "patient_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrderAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The workflow event that occurred */
    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    // ── Actor ──

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private User actorUser;

    @Column(name = "actor_name", length = 200)
    private String actorName;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    // ── Related entities ──

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "consultation_id")
    private Long consultationId;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "patient_name", length = 200)
    private String patientName;

    @Column(name = "service_order_id")
    private Long serviceOrderId;

    @Column(name = "service_result_id")
    private Long serviceResultId;

    /** Human-readable summary of what happened */
    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    // ── Before / After snapshots (JSON) ──

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_data", columnDefinition = "json")
    private String beforeData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_data", columnDefinition = "json")
    private String afterData;

    // ── Request metadata ──

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Lob
    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
