package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.RefundMethod;
import com.q2k.meditech.entity.enums.RefundReason;
import com.q2k.meditech.entity.enums.RefundStatus;
import com.q2k.meditech.entity.enums.RefundType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity for managing refund requests.
 * Lifecycle: REQUESTED → APPROVED → PROCESSING → COMPLETED / FAILED
 *            REQUESTED → REJECTED
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "refunds", indexes = {
        @Index(name = "idx_refund_status", columnList = "status"),
        @Index(name = "idx_refund_payment", columnList = "payment_id"),
        @Index(name = "idx_refund_requested_date", columnList = "requested_date"),
        @Index(name = "idx_refund_code", columnList = "refund_code")
})
public class Refund extends BaseEntity {

    @Column(name = "refund_code", nullable = false, unique = true, length = 20)
    private String refundCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(name = "refund_amount", nullable = false)
    private BigDecimal refundAmount;

    @Column(name = "original_amount", nullable = false)
    private BigDecimal originalAmount;

    @Builder.Default
    @Column(length = 3)
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RefundStatus status = RefundStatus.REQUESTED;

    // ===== Reason & Method =====

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_reason_type", length = 50)
    private RefundReason refundReasonType;

    @Column(name = "refund_reason", nullable = false, columnDefinition = "TEXT")
    private String refundReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_method", length = 30)
    private RefundMethod refundMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_type", length = 10)
    @Builder.Default
    private RefundType refundType = RefundType.MANUAL;

    // ===== Rejection =====

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // ===== Processing =====

    @Column(name = "processing_notes", columnDefinition = "TEXT")
    private String processingNotes;

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "gateway_refund_id", length = 100)
    private String gatewayRefundId;

    // ===== Manual refund evidence =====

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(name = "cashier_confirmed")
    @Builder.Default
    private Boolean cashierConfirmed = false;

    @Column(name = "workstation_id", length = 50)
    private String workstationId;

    // ===== Retry =====

    @Builder.Default
    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Builder.Default
    @Column(name = "max_retries")
    private Integer maxRetries = 3;

    // ===== Urgent flag =====

    @Builder.Default
    @Column(name = "is_urgent")
    private Boolean urgent = false;

    // ===== Timestamps & Users =====

    @Column(name = "requested_date", nullable = false)
    private LocalDateTime requestedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "rejected_date")
    private LocalDateTime rejectedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    private User rejectedBy;

    @Lob
    private String notes;

    // ===== Helper =====

    public boolean canBeApproved() {
        return status == RefundStatus.REQUESTED;
    }

    public boolean canBeProcessed() {
        return status == RefundStatus.APPROVED || status == RefundStatus.REQUESTED;
    }

    public boolean canBeRejected() {
        return status == RefundStatus.REQUESTED || status == RefundStatus.APPROVED;
    }

    public boolean canRetry() {
        return status == RefundStatus.FAILED && retryCount < maxRetries;
    }

    public boolean isUrgentOverdue(int thresholdDays) {
        if (status != RefundStatus.REQUESTED && status != RefundStatus.APPROVED) return false;
        return requestedDate.plusDays(thresholdDays).isBefore(LocalDateTime.now());
    }
}
