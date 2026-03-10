package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.DeletionRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_deletion_requests", indexes = {
        @Index(name = "idx_deletion_request_user", columnList = "user_id"),
        @Index(name = "idx_deletion_request_status", columnList = "status"),
        @Index(name = "idx_deletion_request_date", columnList = "requested_date")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DataDeletionRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DeletionRequestStatus status = DeletionRequestStatus.PENDING;

    @Column(name = "requested_date", nullable = false)
    private LocalDate requestedDate;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    // Review fields
    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_date")
    private LocalDateTime reviewedDate;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    // Approval fields
    @Column(name = "schedule_date")
    private LocalDateTime scheduleDate;

    @Column(name = "execute_immediately", columnDefinition = "TINYINT(1) DEFAULT 0")
    @Builder.Default
    private Boolean executeImmediately = false;

    // Rejection fields
    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "additional_comments", columnDefinition = "TEXT")
    private String additionalComments;

    // Request info fields
    @Column(name = "required_info", columnDefinition = "TEXT")
    private String requiredInfo;

    @Column(name = "info_deadline")
    private LocalDate infoDeadline;

    // Cancellation fields
    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "cancelled_date")
    private LocalDateTime cancelledDate;

    // Execution fields
    @Column(name = "executed_date")
    private LocalDateTime executedDate;

    @Column(name = "executed_by")
    private Long executedBy;

    // Notification tracking
    @Column(name = "notification_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    @Builder.Default
    private Boolean notificationSent = false;

    @Column(name = "notification_sent_date")
    private LocalDateTime notificationSentDate;
}
