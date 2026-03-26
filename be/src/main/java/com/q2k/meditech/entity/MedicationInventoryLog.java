package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "medication_inventory_logs", indexes = {
        @Index(name = "idx_inv_log_medication", columnList = "medication_id"),
        @Index(name = "idx_inv_log_type", columnList = "type"),
        @Index(name = "idx_inv_log_changed_at", columnList = "changed_at"),
        @Index(name = "idx_inv_log_user", columnList = "user_id"),
        @Index(name = "idx_inv_log_ref", columnList = "reference_type, reference_id")
})
public class MedicationInventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false)
    private Medication medication;

    /**
     * INVENTORY_IMPORT, INVENTORY_EXPORT, INVENTORY_ADJUST,
     * INVENTORY_DEDUCT_BY_PRESCRIPTION, INVENTORY_RESTORE_BY_REFUND,
     * INVENTORY_RESTORE_BY_CANCEL, INITIAL
     */
    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "quantity_before", nullable = false)
    private Integer quantityBefore;

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    /** quantityAfter - quantityBefore */
    private Integer delta;

    @Column(length = 500)
    private String note;

    /** User who performed the action (null if SYSTEM) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** MANUAL, PRESCRIPTION, PAYMENT, REFUND, SYSTEM */
    @Column(name = "reference_type", length = 30)
    private String referenceType;

    /** ID of related entity (prescription_id, payment_id, refund_id) */
    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Builder.Default
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt = LocalDateTime.now();
}
