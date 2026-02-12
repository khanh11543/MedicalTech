package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DeliveryLog Entity
 * Tracks email/SMS delivery for invoices
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "delivery_logs",
        indexes = {
                @Index(name = "idx_delivery_logs_payment", columnList = "payment_id"),
                @Index(name = "idx_delivery_logs_type", columnList = "delivery_type"),
                @Index(name = "idx_delivery_logs_status", columnList = "status")
        }
)
public class DeliveryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(name = "delivery_type", nullable = false, length = 20)
    private String deliveryType; // EMAIL, SMS

    @Column(nullable = false, length = 255)
    private String recipient;

    @Column(nullable = false, length = 20)
    private String status; // SENT, FAILED, PENDING

    @Lob
    private String message;

    @Lob
    @Column(name = "error_message")
    private String errorMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sent_by")
    private User sentBy;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}