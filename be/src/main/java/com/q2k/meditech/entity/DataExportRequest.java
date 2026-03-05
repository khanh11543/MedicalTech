package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.ExportRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_export_requests", indexes = {
        @Index(name = "idx_export_request_user", columnList = "user_id"),
        @Index(name = "idx_export_request_status", columnList = "status"),
        @Index(name = "idx_export_request_date", columnList = "requested_date")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DataExportRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ExportRequestStatus status = ExportRequestStatus.PENDING;

    @Column(name = "requested_date", nullable = false)
    private LocalDate requestedDate;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(name = "processed_by")
    private Long processedBy;

    // Data inclusion flags
    @Builder.Default
    @Column(name = "include_profile", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean includeProfile = true;

    @Builder.Default
    @Column(name = "include_appointments", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean includeAppointments = true;

    @Builder.Default
    @Column(name = "include_prescriptions", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean includePrescriptions = true;

    @Builder.Default
    @Column(name = "include_payments", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean includePayments = true;

    @Builder.Default
    @Column(name = "include_reviews", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean includeReviews = true;

    @Builder.Default
    @Column(name = "include_activity_logs", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean includeActivityLogs = true;

    @Column(name = "export_format", length = 10)
    @Builder.Default
    private String exportFormat = "JSON";

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "email_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    @Builder.Default
    private Boolean emailSent = false;

    @Column(name = "email_sent_date")
    private LocalDateTime emailSentDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
