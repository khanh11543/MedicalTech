package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "deletion_logs", indexes = {
        @Index(name = "idx_deletion_log_user", columnList = "user_id"),
        @Index(name = "idx_deletion_log_executed_date", columnList = "executed_date")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeletionLog extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "user_full_name", length = 255)
    private String userFullName;

    @Column(name = "deletion_request_id")
    private Long deletionRequestId;

    @Column(name = "deleted_data_summary", columnDefinition = "TEXT")
    private String deletedDataSummary;

    @Column(name = "deleted_records_count")
    private Integer deletedRecordsCount;

    @Column(name = "executed_by", nullable = false)
    private Long executedBy;

    @Column(name = "executed_by_name", length = 255)
    private String executedByName;

    @Column(name = "executed_date", nullable = false)
    private LocalDateTime executedDate;

    @Column(name = "execution_notes", columnDefinition = "TEXT")
    private String executionNotes;

    @Column(name = "success", columnDefinition = "TINYINT(1) DEFAULT 1")
    @Builder.Default
    private Boolean success = true;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
